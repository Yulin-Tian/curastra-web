import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload } from 'lucide-react'
import { api } from '../api/client'
import type { HealthRecord, RecordType } from '../api/types'
import { Button, Card, EmptyState, ErrorBanner, PageTitle, Spinner, inputClass } from '../components/ui'

const typeLabels: Record<RecordType, string> = {
  prescription: 'Prescription',
  lab_report: 'Lab report',
  other: 'Other',
}

export default function RecordsPage() {
  const [records, setRecords] = useState<HealthRecord[] | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [type, setType] = useState<RecordType>('prescription')
  const [notes, setNotes] = useState('')
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
      <PageTitle
        title="Health Records"
        subtitle="Upload prescriptions and lab reports — photos, PDFs, or documents."
      />
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <form onSubmit={onUpload} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">File</label>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,.pdf,.docx,.txt"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as RecordType)}>
              <option value="prescription">Prescription</option>
              <option value="lab_report">Lab report</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button type="submit" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </Card>

      {records === null ? (
        <Spinner label="Loading records…" />
      ) : records.length === 0 ? (
        <EmptyState
          title="No records yet"
          hint="Upload a prescription above to extract its text and generate your care plan."
        />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id}>
              <Link
                to={`/records/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-teal-300"
              >
                <FileText className="h-5 w-5 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">{r.file_name}</div>
                  <div className="text-xs text-slate-400">
                    {typeLabels[r.type]} · {new Date(r.uploaded_at).toLocaleDateString()}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </div>
                </div>
                {r.has_extracted_text && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    Text confirmed
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
