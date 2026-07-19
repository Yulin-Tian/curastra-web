// Mirrors the backend's Pydantic schemas and the Active Care Engine outputs.

export interface User {
  id: number
  name: string
  email: string
  abha_number: string | null
  abha_address: string | null
  abha_linked: boolean
}

export interface TokenResponse {
  token: string
  user: User
}

export type RecordType = 'prescription' | 'lab_report' | 'other'

export interface HealthRecord {
  id: number
  type: RecordType
  file_name: string
  mime_type: string
  notes: string | null
  has_extracted_text: boolean
  uploaded_at: string
  extracted_text?: string | null
}

export interface ExtractResult {
  file_name: string
  file_type: string
  extracted_text: string
  extraction_method: string
  warnings: string[]
}

export interface CarePlanMedication {
  name: string | null
  strength: string | null
  form: string | null
  dosage: string | null
  frequency: string | null
  timing: string | null
  duration: string | null
  original_line: string | null
  confidence: 'high' | 'medium' | 'low' | null
}

export interface CarePlanTask {
  category: 'medication' | 'follow_up' | 'monitoring' | 'lifestyle' | 'safety' | 'other'
  instruction: string
  schedule: string | null
  original_source: string | null
}

export interface CarePlanContent {
  safety_disclaimer: string
  clarification_questions: string[]
  medications: CarePlanMedication[]
  tasks: CarePlanTask[]
  red_flags: string[]
  structured_summary: Record<string, unknown>
}

export interface CarePlan {
  id: number
  record_id: number | null
  source_text: string
  plan: CarePlanContent
  created_at: string
}

export interface Medication {
  id: number
  name: string
  dosage: string | null
  frequency: string | null
  timing: string | null
  duration: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export interface Vital {
  id: number
  type: string
  value: string
  unit: string | null
  note: string | null
  measured_at: string
}

export interface SimplifyResult {
  simplified: string
  tts_text: string
  disclaimer: string
  simulated: boolean
}

export interface LabFlag {
  name: string
  value: string | null
  status: 'normal' | 'high' | 'low' | 'borderline' | 'unknown'
  note: string | null
}

export interface LabAnalyzeResult {
  summary: string
  flags: LabFlag[]
  disclaimer: string
  simulated: boolean
}

export interface MedAlert {
  type: 'duplicate' | 'interaction' | 'dosage' | 'other'
  medications: string[]
  message: string
  severity: 'info' | 'caution' | 'warning'
}

export interface MedSafetyResult {
  alerts: MedAlert[]
  disclaimer: string
  simulated: boolean
}

export interface Insight {
  title: string
  detail: string
  category: 'trend' | 'adherence' | 'lifestyle' | 'follow_up' | 'other'
}

export interface InsightsResult {
  insights: Insight[]
  disclaimer: string
  simulated: boolean
}

export type SafetyFlag = 'refused' | 'advised_see_doctor' | null

export interface ChatResult {
  reply: string
  used_context: boolean
  disclaimer: string
  safety_flag: SafetyFlag
  simulated: boolean
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  safety_flag: SafetyFlag
  created_at: string
}
