import { supabase } from '@/lib/supabaseClient'

// Jobs
export async function getJobs() {
  const { data, error } = await supabase
    .from('job')
    .select('job_id, title, description, location, created_at, company:company_id(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getJobById(job_id) {
  const { data, error } = await supabase
    .from('job')
    .select('job_id, title, description, location, company:company_id(name), skills:job_skill(skill:skill_id(skill_id, skill_name))')
    .eq('job_id', job_id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function postJob(row) {
  const { data, error } = await supabase.from('job').insert(row).select('*').single()
  if (error) throw error
  return data
}

// Companies
export async function getMyCompanies() {
  const { data, error } = await supabase
    .from('company')
    .select('company_id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

// Applicants & profile
export async function getOrCreateApplicant(user_id, email) {
  const { data, error } = await supabase.from('applicant').select('*').eq('user_id', user_id).maybeSingle()
  if (error) throw error
  if (data) return data
  const { data: created, error: e2 } = await supabase.from('applicant').insert({ user_id, email }).select('*').single()
  if (e2) throw e2
  return created
}

export async function updateApplicant(applicant_id, patch) {
  const { data, error } = await supabase.from('applicant').update(patch).eq('applicant_id', applicant_id).select('*').single()
  if (error) throw error
  return data
}

export async function setApplicantSkills(applicant_id, skills) {
  const rows = skills.map(s => ({ applicant_id, skill_id: s.skill_id, proficiency_level: s.proficiency_level }))
  const { error } = await supabase.from('applicant_skill').upsert(rows)
  if (error) throw error
}

export async function getApplicantSkills(applicant_id) {
  const { data, error } = await supabase
    .from('applicant_skill')
    .select('skill_id, proficiency_level, skill:skill_id(skill_name)')
    .eq('applicant_id', applicant_id)
  if (error) throw error
  return data || []
}

// Jobs + skills for recommendations
export async function getJobsWithSkills() {
  const { data, error } = await supabase
    .from('job')
    .select('job_id, title, description, location, company:company_id(name), skills:job_skill(skill:skill_id(skill_id, skill_name))')
  if (error) throw error
  return (data || []).map(j => ({
    ...j,
    requiredSkills: (j.skills || []).map(js => js.skill?.skill_id).filter(Boolean),
  }))
}

// Applications
export async function applyToJob(applicant_id, job_id) {
  const { data, error } = await supabase
    .from('application')
    .insert({ applicant_id, job_id, status: 'submitted' })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getMyApplications(applicant_id) {
  const { data, error } = await supabase
    .from('application')
    .select('application_id, job_id, status, date_applied, job:job_id(title, company:company_id(name))')
    .eq('applicant_id', applicant_id)
    .order('date_applied', { ascending: false })
  if (error) throw error
  return data || []
}

// Analytics
export async function applicantsPerJob(company_id) {
  // Fetch applications joined with jobs for this company, then aggregate in JS
  const { data, error } = await supabase
    .from('application')
    .select('job_id, application_id, job:job_id(title, company_id)')
    .eq('job.company_id', company_id)

  if (error) throw error
  if (!data || !data.length) return []

  const byJob = new Map()
  for (const row of data) {
    const jobId = row.job_id
    if (!jobId) continue
    const existing = byJob.get(jobId) || { job_id: jobId, title: row.job?.title || jobId, count: 0 }
    existing.count += 1
    byJob.set(jobId, existing)
  }

  return Array.from(byJob.values())
}

export async function topSkills(limit = 10) {
  // Aggregate applicant_skill in JS instead of using .group()
  const { data, error } = await supabase
    .from('applicant_skill')
    .select('skill_id, applicant_id')
  if (error) throw error
  if (!data || !data.length) return []

  const counts = new Map()
  for (const row of data) {
    if (!row.skill_id) continue
    counts.set(row.skill_id, (counts.get(row.skill_id) || 0) + 1)
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
