import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { HealthRecord, RecordType } from '../api/types'
import { Button, Card, EmptyState, ErrorBanner, PageTitle, Segmented, SkeletonList, inputClass } from '../components/ui'
import { useLang } from '../i18n/LanguageContext'

const typeLabelKeys: Record<RecordType, string> = {
  prescription: 'common.prescription',
  lab_report: 'common.labReport',
  other: 'common.other',
}

export default function RecordsPage() {
  const { t } = useLang()
  const [records, setRecords] = useState<HealthRecord[] | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [type, setType] = useState<RecordType>('prescription')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState<'all' | RecordType>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const fileInput = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      setRecords(await api.get<HealthRecord[]>('/api/records'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setError('Choose a file first.')
      return
    }
    setError('')
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('type', type)
      if (notes) form.append('notes', notes)
      await api.postForm('/api/records', form)
      if (fileInput.current) fileInput.current.value = ''
      setNotes('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <PageTitle title={t('records.title')} subtitle={t('records.sub')} />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={onUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.file')}</label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.pdf,.docx,.txt"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.type')}</label>
            <Segmented
              value={type}
              onChange={(v) => setType(v as RecordType)}
              options={[
                { value: 'prescription', label: t('common.prescription') },
                { value: 'lab_report', label: t('common.labReport') },
                { value: 'other', label: t('common.other') },
              ]}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">{t('common.notes')}</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? t('common.uploading') : t('common.upload')}
          </Button>
        </form>
      </Card>

      {records !== null && records.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={filter}
            onChange={(v) => setFilter(v as 'all' | RecordType)}
            options={[
              { value: 'all', label: t('records.filterAll') },
              { value: 'prescription', label: t('common.prescription') },
              { value: 'lab_report', label: t('common.labReport') },
              { value: 'other', label: t('common.other') },
            ]}
          />
          <Segmented
            value={sort}
            onChange={(v) => setSort(v as 'newest' | 'oldest')}
            options={[
              { value: 'newest', label: t('records.sortNewest') },
              { value: 'oldest', label: t('records.sortOldest') },
            ]}
          />
        </div>
      )}

      {records === null ? (
        <SkeletonList />
      ) : records.length === 0 ? (
        <EmptyState title={t('records.empty')} hint={t('records.emptyHint')} />
      ) : (() => {
        const shown = records
          .filter((r) => filter === 'all' || r.type === filter)
          .sort((a, b) =>
            sort === 'newest'
              ? b.uploaded_at.localeCompare(a.uploaded_at)
              : a.uploaded_at.localeCompare(b.uploaded_at),
          )
        if (shown.length === 0) {
          return <p className="py-8 text-center text-sm text-stone-400">{t('records.noneOfType')}</p>
        }
        return (
        <ul className="space-y-2">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                to={`/records/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-teal-300"
              >
                <FileText className="h-5 w-5 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">{r.file_name}</div>
                  <div className="text-xs text-slate-400">
                    {t(typeLabelKeys[r.type])} · {new Date(r.uploaded_at).toLocaleDateString()}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </div>
                </div>
                {r.has_extracted_text && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    {t('records.confirmedBadge')}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        )
      })()}
    </div>
  )
}
