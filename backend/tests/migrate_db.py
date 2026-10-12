"""One-off: copy the production database from one Postgres to another.

Used in Oct 2026 to move curastra-db off Render's paid plan onto a free
persistent Postgres, so curastra.app keeps running at no monthly cost.

Reads the two connection strings from a local file (never commit it):

    SOURCE_URL=postgres://...render.com/curastra_db   (Render external URL)
    TARGET_URL=postgresql://...neon.tech/neondb?sslmode=require

Usage (from backend/, with the .venv active):

    python tests/migrate_db.py backup  <urls-file>  <backup.json>   # source -> JSON
    python tests/migrate_db.py migrate <urls-file>                   # source -> target
    python tests/migrate_db.py verify  <urls-file>                   # row counts match?

The target schema is built with the app's own models + column migrations,
so it is exactly what the backend expects on its next start.
"""
from __future__ import annotations

import base64
import datetime as dt
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


def _read_urls(path: str) -> tuple[str, str]:
    vals: dict[str, str] = {}
    for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        vals[k.strip()] = v.strip().strip('"').strip("'")
    src, tgt = vals.get("SOURCE_URL", ""), vals.get("TARGET_URL", "")
    if not src:
        sys.exit("SOURCE_URL missing in " + path)
    return _fix(src), _fix(tgt)


def _fix(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _json_default(o):
    if isinstance(o, (bytes, memoryview)):
        return {"__bytes__": base64.b64encode(bytes(o)).decode()}
    if isinstance(o, (dt.datetime, dt.date)):
        return o.isoformat()
    raise TypeError(type(o))


def _source_tables(src_url: str):
    from sqlalchemy import MetaData, create_engine

    eng = create_engine(src_url)
    md = MetaData()
    md.reflect(bind=eng)
    return eng, md


def cmd_backup(urls_file: str, out: str) -> None:
    src_url, _ = _read_urls(urls_file)
    eng, md = _source_tables(src_url)
    dump: dict[str, list[dict]] = {}
    with eng.connect() as conn:
        for t in md.sorted_tables:
            rows = [dict(r._mapping) for r in conn.execute(t.select())]
            dump[t.name] = rows
            print(f"  {t.name:24s} {len(rows):6d} rows")
    Path(out).write_text(json.dumps(dump, default=_json_default), encoding="utf-8")
    print(f"backup written: {out} ({Path(out).stat().st_size/1024:.0f} KB)")


def cmd_migrate(urls_file: str) -> None:
    src_url, tgt_url = _read_urls(urls_file)
    if not tgt_url:
        sys.exit("TARGET_URL missing")
    if src_url == tgt_url:
        sys.exit("SOURCE_URL and TARGET_URL are identical")

    # Build the target schema with the app's own models.
    os.environ["DATABASE_URL"] = tgt_url
    from sqlalchemy import text

    from app import models  # noqa: F401  (registers tables on Base)
    from app.database import Base, apply_column_migrations
    from app.database import engine as tgt

    Base.metadata.create_all(bind=tgt)
    apply_column_migrations()

    # Refuse to merge into a target that already holds data.
    with tgt.connect() as conn:
        n = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
    if n:
        sys.exit(f"target already has {n} users; refusing to copy on top")

    src, smd = _source_tables(src_url)
    src_tables = {t.name: t for t in smd.tables.values()}

    with src.connect() as sconn, tgt.begin() as tconn:
        for tt in Base.metadata.sorted_tables:  # FK-safe order
            st = src_tables.get(tt.name)
            if st is None:
                print(f"  {tt.name:24s} (not in source, skipped)")
                continue
            cols = [c.name for c in tt.columns if c.name in st.columns]
            rows = [
                {k: v for k, v in r._mapping.items() if k in cols}
                for r in sconn.execute(st.select())
            ]
            if rows:
                tconn.execute(tt.insert(), rows)
            print(f"  {tt.name:24s} {len(rows):6d} rows copied")

        # Serial sequences must continue after the copied ids.
        for tt in Base.metadata.sorted_tables:
            if "id" in tt.columns:
                tconn.execute(
                    text(
                        f"SELECT setval(pg_get_serial_sequence('{tt.name}', 'id'), "
                        f"COALESCE((SELECT MAX(id) FROM {tt.name}), 0) + 1, false)"
                    )
                )
    print("migration complete")


def cmd_verify(urls_file: str) -> None:
    src_url, tgt_url = _read_urls(urls_file)
    from sqlalchemy import create_engine, text

    s, t = create_engine(src_url), create_engine(tgt_url)
    _, smd = _source_tables(src_url)
    ok = True
    with s.connect() as sc, t.connect() as tc:
        for name in sorted(smd.tables):
            a = sc.execute(text(f"SELECT COUNT(*) FROM {name}")).scalar()
            try:
                b = tc.execute(text(f"SELECT COUNT(*) FROM {name}")).scalar()
            except Exception:
                b = "missing"
            flag = "" if a == b else "   <-- MISMATCH"
            ok = ok and a == b
            print(f"  {name:24s} source={a:6}  target={b!s:>7}{flag}")
    print("VERIFY OK" if ok else "VERIFY FAILED")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd = sys.argv[1]
    if cmd == "backup" and len(sys.argv) == 4:
        cmd_backup(sys.argv[2], sys.argv[3])
    elif cmd == "migrate":
        cmd_migrate(sys.argv[2])
    elif cmd == "verify":
        cmd_verify(sys.argv[2])
    else:
        sys.exit(__doc__)
