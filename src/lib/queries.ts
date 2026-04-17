import { supabase } from '@/lib/supabaseClient'
import type {
  Applicant,
  ApplicantSkill,
  Application,
  ApplicationStatus,
  ApplicationWithApplicant,
  Job,
  JobApplicantCount,
  JobForRecommend,
  JobWithSkills,
  PaginatedResult,
  TopSkill,
} from '@/lib/types'

const PAGE_SIZE = 12

// ─── Jobs ────────────────────────────────────────────────────────────────────

export async function getJobs(
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<PaginatedResult<Job>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('job')
    .select('job_id, title, description, location, created_at, company:company_id(name)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data ?? []) as Job[], count: count ?? 0 }
}

export async function getJobById(job_id: string): Promise<JobWithSkills | null> {
  const { data, error } = await supabase
    .from('job')
    .select(
      'job_id, title, description, location, created_at, company:company_id(name), skills:job_skill(skill:skill_id(skill_id, skill_name))',
    )
    .eq('job_id', job_id)
    .maybeSingle()
  if (error) throw error
  return data as JobWithSkills | null
}

export async function postJob(row: {
  title: string
  location: string
  description: string
  company_id: string
  skillIds?: string[]
}): Promise<Job> {
  const { skillIds, ...jobRow } = row
  const { data, error } = await supabase.from('job').insert(jobRow).select('*').single()
  if (error) throw error

  if (skillIds && skillIds.length > 0) {
    const skillRows = skillIds.map(skill_id => ({ job_id: data.job_id, skill_id }))
    const { error: skillErr } = await supabase.from('job_skill').insert(skillRows)
    if (skillErr) throw skillErr
  }

  return data as Job
}

// ─── Companies ───────────────────────────────────────────────────────────────

export async function getMyCompanies(): Promise<{ company_id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('company')
    .select('company_id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ─── Applicants & profile ────────────────────────────────────────────────────

export async function getOrCreateApplicant(
  user_id: string,
  email?: string,
): Promise<Applicant> {
  const { data, error } = await supabase
    .from('applicant')
    .select('*')
    .eq('user_id', user_id)
    .maybeSingle()
  if (error) throw error
  if (data) return data as Applicant

  const { data: created, error: e2 } = await supabase
    .from('applicant')
    .insert({ user_id, email })
    .select('*')
    .single()
  if (e2) throw e2
  return created as Applicant
}

export async function updateApplicant(
  applicant_id: string,
  patch: Partial<Pick<Applicant, 'name' | 'email'>>,
): Promise<Applicant> {
  const { data, error } = await supabase
    .from('applicant')
    .update(patch)
    .eq('applicant_id', applicant_id)
    .select('*')
    .single()
  if (error) throw error
  return data as Applicant
}

export async function setApplicantSkills(
  applicant_id: string,
  skills: Array<{ skill_id: string; proficiency_level: number }>,
): Promise<void> {
  // Delete the full existing set first so removed skills are not left behind
  const { error: deleteError } = await supabase
    .from('applicant_skill')
    .delete()
    .eq('applicant_id', applicant_id)
  if (deleteError) throw deleteError

  if (!skills.length) return

  const rows = skills.map(s => ({
    applicant_id,
    skill_id: s.skill_id,
    proficiency_level: s.proficiency_level,
  }))
  const { error } = await supabase.from('applicant_skill').insert(rows)
  if (error) throw error
}

export async function getApplicantSkills(applicant_id: string): Promise<ApplicantSkill[]> {
  const { data, error } = await supabase
    .from('applicant_skill')
    .select('skill_id, proficiency_level, skill:skill_id(skill_name)')
    .eq('applicant_id', applicant_id)
  if (error) throw error
  return (data ?? []) as ApplicantSkill[]
}

// ─── Skills catalogue ────────────────────────────────────────────────────────

export async function getAllSkills(): Promise<{ skill_id: string; skill_name: string }[]> {
  const { data, error } = await supabase
    .from('skill')
    .select('skill_id, skill_name')
    .order('skill_name')
  if (error) throw error
  return data ?? []
}

// ─── Jobs with skills (for recommendations) ──────────────────────────────────

export async function getJobsWithSkills(): Promise<JobForRecommend[]> {
  const { data, error } = await supabase
    .from('job')
    .select(
      'job_id, title, description, location, created_at, company:company_id(name), skills:job_skill(skill:skill_id(skill_id, skill_name))',
    )
  if (error) throw error
  return ((data ?? []) as JobWithSkills[]).map(j => ({
    ...j,
    requiredSkills: (j.skills ?? []).map(js => js.skill?.skill_id).filter(Boolean) as string[],
  }))
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function applyToJob(applicant_id: string, job_id: string): Promise<Application> {
  const { data, error } = await supabase
    .from('application')
    .insert({ applicant_id, job_id, status: 'submitted' })
    .select('*')
    .single()
  if (error) throw error
  return data as Application
}

export async function getMyApplications(
  applicant_id: string,
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<PaginatedResult<Application>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('application')
    .select(
      'application_id, job_id, status, date_applied, job:job_id(title, company:company_id(name))',
      { count: 'exact' },
    )
    .eq('applicant_id', applicant_id)
    .order('date_applied', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data ?? []) as Application[], count: count ?? 0 }
}

export async function getJobApplications(
  job_id: string,
  page = 1,
  pageSize = PAGE_SIZE,
): Promise<PaginatedResult<ApplicationWithApplicant>> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('application')
    .select(
      'application_id, applicant_id, status, date_applied, resume_url, cover_letter, applicant:applicant_id(name, email)',
      { count: 'exact' },
    )
    .eq('job_id', job_id)
    .order('date_applied', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { data: (data ?? []) as ApplicationWithApplicant[], count: count ?? 0 }
}

export async function updateApplicationStatus(
  application_id: string,
  status: ApplicationStatus,
): Promise<{ application_id: string; status: ApplicationStatus }> {
  const { data, error } = await supabase
    .from('application')
    .update({ status })
    .eq('application_id', application_id)
    .select('application_id, status')
    .single()
  if (error) throw error
  return data as { application_id: string; status: ApplicationStatus }
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function applicantsPerJob(company_id: string): Promise<JobApplicantCount[]> {
  // Step 1: get all jobs belonging to this company
  const { data: jobs, error: jobsErr } = await supabase
    .from('job')
    .select('job_id, title')
    .eq('company_id', company_id)
  if (jobsErr) throw jobsErr
  if (!jobs?.length) return []

  const jobIds = jobs.map(j => j.job_id as string)
  const jobMap = new Map(jobs.map(j => [j.job_id as string, j.title as string]))

  // Step 2: count applications only for those jobs
  const { data, error } = await supabase
    .from('application')
    .select('job_id')
    .in('job_id', jobIds)
  if (error) throw error
  if (!data?.length) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const jid = row.job_id as string
    counts.set(jid, (counts.get(jid) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([job_id, count]) => ({
    job_id,
    title: jobMap.get(job_id) ?? job_id,
    count,
  }))
}

export async function topSkills(limit = 10): Promise<TopSkill[]> {
  const { data, error } = await supabase.from('applicant_skill').select('skill_id, applicant_id')
  if (error) throw error
  if (!data?.length) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    if (!row.skill_id) continue
    counts.set(row.skill_id as string, (counts.get(row.skill_id as string) ?? 0) + 1)
  }

  const sorted = Array.from(counts.entries())
    .map(([skill_id, count]) => ({ skill_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  const ids = sorted.map(d => d.skill_id)
  if (!ids.length) return []

  const { data: skills, error: skillsErr } = await supabase
    .from('skill')
    .select('skill_id, skill_name')
    .in('skill_id', ids)
  if (skillsErr) throw skillsErr

  return sorted.map(d => ({
    ...d,
    skill_name: skills?.find(s => s.skill_id === d.skill_id)?.skill_name,
  }))
}
