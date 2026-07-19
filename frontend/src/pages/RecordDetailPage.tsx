import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ScanText, Trash2 } from 'lucide-react'
import { api, getToken } from '../api/client'
import type { ExtractResult, HealthRecord, LabAnalyzeResult, CarePlan } from '../api/types'
import { Button, Card, Disclaimer, ErrorBanner, PageTitle, Spinner } from '../components/ui'
import { LabResultView } from '../components/LabResultView'

/**
 * The heart of the safety design: OCR text is never fed to the AI until the
 * user has read it, corrected it, and pressed Confirm (human-in-the-loop).
 */
export default function RecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState<HealthRecord | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [extracting, setExtracting] = useState(false)
  const [draftText, setDraftText] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [labResult, setLabResult] = useState<LabAnalyzeResult | null>(null)

  const load = useCallback(async () => {
    try {
      const rec = await api.get<HealthRecord>(`/api/records/${id}`)
      setRecord(rec)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load record.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  // Image preview needs the auth header, so fetch as a blob.
  useEffect(() => {
    if (!record || !record.mime_type.startsWith('image/')) return
    let url: string | null = null
    fetch(api.fileUrl(`/api/records/${record.id}/file`), {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) {
          url = URL.createObjectURL(blob)
          setPreviewUrl(url)
        }
      })
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [record])

  async function onExtract() {
    setError('')
    setExtracting(true)
    try {
      const result = await api.post<ExtractResult>(`/api/records/${id}/extract`)
      setDraftText(result.extracted_text)
      setWarnings(result.warnings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed.')
    } finally {
      setExtracting(false)
    }
  }

  async function onConfirm() {
    if (!draftText?.trim()) {
      setError('The text is empty — extract again or type the content manually.')
      return
    }
    setError('')
    setConfirming(true)
    try {
      const updated = await api.post<HealthRecord>(`/api/records/${id}/confirm-text`, {
        verified_text: draftText,
      })
      setRecord(updated)
      setDraftText(null)
      setWarnings([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the confirmed text.')
    } finally {
      setConfirming(false)
    }
  }

  async function onGeneratePlan() {
    if (!record?.extracted_text) return
    setError('')
    setGenerating(true)
    try {
      const plan = await api.post<CarePlan>('/api/care-plans', {
        record_id: record.id,
        verified_text: record.extracted_text,
      })
      navigate(`/care-plans/${plan.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Care plan generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function onAnalyzeLab() {
    if (!record?.extracted_text) return
    setError('')
    setAnalyzing(true)
    setLabResult(null)
    try {
      setLabResult(
        await api.post<LabAnalyzeResult>('/api/ai/lab-analyze', {
          verified_text: record.extracted_text,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lab analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function onDelete() {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    try {
      await api.delete(`/api/records/${id}`)
      navigate('/records')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
    }
  }

  if (!record) {
    return error ? <ErrorBanner message={error} /> : <Spinner label="Loading record…" />
  }

  const reviewing = draftText !== null

  return (
    <div>
      <button
        onClick={() => navigate('/records')}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to records
      </button>
      <PageTitle title={record.file_name} subtitle={`Uploaded ${new Date(record.uploaded_at).toLocaleString()}`} />
      <ErrorBanner message={error} />

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-slate-800">Document</h2>
          {previewUrl ? (
            <img src={previewUrl} alt={record.file_name} className="max-h-96 w-full rounded-lg object-contain" />
          ) : (
            <p className="text-sm text-slate-500">
              {record.mime_type.startsWith('image/') ? 'Loading preview…' : `${record.mime_type} — no inline preview.`}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            {!reviewing && (
              <Button onClick={onExtract} disabled={extracting}>
                <ScanText className="h-4 w-4" />
                {record.has_extracted_text ? 'Re-extract text' : 'Extract text'}
              </Button>
            )}
            <Button variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
          {extracting && <Spinner label="Reading the document (OCR)… this can take a few seconds." />}
        </Card>

        <Card>
          {reviewing ? (
            <>
              <h2 className="font-semibold text-slate-800">Review the extracted text</h2>
              <p className="mt-1 mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Please read carefully and fix any mistakes. The AI only ever works from the text
                <strong> you confirm</strong> — not from the raw scan.
              </p>
              {warnings.length > 0 && (
                <ul className="mb-2 list-inside list-disc text-xs text-amber-600">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
              <textarea
                className="h-64 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-teal-500 focus:outline-none"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <Button onClick={onConfirm} disabled={confirming}>
                  <CheckCircle2 className="h-4 w-4" />
                  {confirming ? 'Saving…' : 'Confirm — this looks correct'}
                </Button>
                <Button variant="secondary" onClick={() => setDraftText(null)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : record.extracted_text ? (
            <>
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                Confirmed text
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
              </h2>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {record.extracted_text}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                {record.type === 'lab_report' ? (
                  <>
                    <Button onClick={onAnalyzeLab} disabled={analyzing}>
                      {analyzing ? 'Analyzing…' : 'Explain this lab report'}
                    </Button>
                    <Button variant="secondary" onClick={onGeneratePlan} disabled={generating}>
                      {generating ? 'Generating…' : 'Generate care plan'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={onGeneratePlan} disabled={generating}>
                      {generating ? 'Generating care plan…' : 'Generate care plan'}
                    </Button>
                    <Button variant="secondary" onClick={onAnalyzeLab} disabled={analyzing}>
                      {analyzing ? 'Analyzing…' : 'Analyze as lab report'}
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => setDraftText(record.extracted_text ?? '')}>
                  Edit text
                </Button>
              </div>
              {(generating || analyzing) && (
                <Spinner label={generating ? 'The AI is drafting your care plan…' : 'The AI is reading your lab report…'} />
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-800">No text yet</h2>
              <p className="mt-1 text-sm text-slate-500">
                Press <strong>Extract text</strong> to read this document. You will review and
                confirm the result before any AI feature uses it.
              </p>
            </>
          )}
        </Card>
      </div>

      {labResult && (
        <Card className="mt-6">
          <LabResultView result={labResult} />
          <Disclaimer text={labResult.disclaimer} />
        </Card>
      )}
    </div>
  )
}
