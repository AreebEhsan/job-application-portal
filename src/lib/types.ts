// ─── Domain enums ──────────────────────────────────────────────────────────
export type ApplicationStatus =
  | 'submitted'
  | 'in_review'
  | 'interview'
  | 'offer'
  | 'rejected'

export type UserRole = 'applicant' | 'recruiter'

// ─── Database row shapes ────────────────────────────────────────────────────
export interface Profile {
  user_id: string
  role: UserRole
  applicant_id: string | null
  company_id: string | null
  full_name: string | null
  university: string | null
  experience_level: string | null
  skills: string | null
}

export interface Applicant {
  applicant_id: string
  user_id: string
  name: string | null
  email: string | null
}

export interface Company {
  company_id: string
  name: string
  industry: string | null
  location: string | null
}

export interface Skill {
  skill_id: string
  skill_name: string
}

export interface ApplicantSkill {
  skill_id: string
  proficiency_level: number
  skill?: { skill_name: string }
}

export interface Job {
  job_id: string
  title: string
  description: string | null
  location: string | null
  created_at: string
  company: { name: string } | null
}

export interface JobWithSkills extends Job {
  skills: Array<{ skill: { skill_id: string; skill_name: string } }>
}

export interface JobForRecommend extends Job {
  requiredSkills: string[]
  score?: number
}

export interface Application {
  application_id: string
  job_id: string
  applicant_id: string
  status: ApplicationStatus
  date_applied: string
  resume_url: string | null
  cover_letter: string | null
  job?: {
    title: string
    company: { name: string } | null
  }
}

export interface ApplicationWithApplicant
  extends Omit<Application, 'job'> {
  applicant: { name: string | null; email: string | null } | null
}

// ─── Pagination ─────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[]
  count: number
}

// ─── Analytics ──────────────────────────────────────────────────────────────
export interface JobApplicantCount {
  job_id: string
  title: string
  count: number
}

export interface TopSkill {
  skill_id: string
  skill_name: string | undefined
  count: number
}
