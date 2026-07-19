from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Record, User
from ..schemas import ConfirmTextRequest, RecordDetailOut, RecordOut
from ..services import engine_client

router = APIRouter(prefix="/api/records", tags=["records"])

MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_TYPES = {"prescription", "lab_report", "other"}


def _get_owned_record(record_id: int, user: User, db: Session) -> Record:
    record = db.get(Record, record_id)
    if record is None or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="Record not found.")
    return record


def _to_out(record: Record) -> RecordOut:
    return RecordOut(
        id=record.id,
        type=record.type,
        file_name=record.file_name,
        mime_type=record.mime_type,
        notes=record.notes,
        has_extracted_text=bool(record.extracted_text),
        uploaded_at=record.uploaded_at,
    )


@router.post("", response_model=RecordOut, status_code=201)
async def upload_record(
    file: UploadFile = File(...),
    type: str = Form("prescription"),
    notes: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"type must be one of {sorted(ALLOWED_TYPES)}.")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    record = Record(
        user_id=user.id,
        type=type,
        file_name=file.filename or "upload",
        mime_type=file.content_type or "application/octet-stream",
        file_data=data,
        notes=notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_out(record)


@router.get("", response_model=list[RecordOut])
def list_records(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.scalars(
        select(Record).where(Record.user_id == user.id).order_by(Record.uploaded_at.desc())
    ).all()
    return [_to_out(r) for r in records]


@router.get("/{record_id}", response_model=RecordDetailOut)
def get_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = _get_owned_record(record_id, user, db)
    out = _to_out(record)
    return RecordDetailOut(**out.model_dump(), extracted_text=record.extracted_text)


@router.get("/{record_id}/file")
def download_record_file(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = _get_owned_record(record_id, user, db)
    return Response(
        content=record.file_data,
        media_type=record.mime_type,
        headers={"Content-Disposition": f'inline; filename="{record.file_name}"'},
    )


@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = _get_owned_record(record_id, user, db)
    db.delete(record)
    db.commit()


@router.post("/{record_id}/extract")
def extract_text(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Run OCR/text extraction on the stored file via the Active Care Engine.

    Returns the raw extraction for the user to review. Nothing is saved yet —
    the human-in-the-loop step is /confirm-text.
    """
    record = _get_owned_record(record_id, user, db)
    return engine_client.extract(record.file_name, record.file_data, record.mime_type)


@router.post("/{record_id}/confirm-text", response_model=RecordDetailOut)
def confirm_text(
    record_id: int,
    payload: ConfirmTextRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the user-reviewed extraction. This confirmed text is what every
    downstream AI feature (care plan, lab analysis) works from."""
    record = _get_owned_record(record_id, user, db)
    record.extracted_text = payload.verified_text.strip()
    db.commit()
    db.refresh(record)
    out = _to_out(record)
    return RecordDetailOut(**out.model_dump(), extracted_text=record.extracted_text)
