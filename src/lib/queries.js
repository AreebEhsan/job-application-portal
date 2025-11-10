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

// Applications
export async function applyToJob(applicant_id, job_id) {
  const { data, error } = await supabase.from('application').insert({ applicant_id, job_id }).select('*').single()
  if (error) throw error
  return data
}

export async function getMyApplications(applicant_id) {
  const { data, error } = await supabase
    .from('application')
    .select('application_id, status, date_applied, job:job_id(title, company:company_id(name))')
    .eq('applicant_id', applicant_id)
    .order('date_applied', { ascending: false })
  if (error) throw error
  return data || []
}

// Analytics
export async function applicantsPerJob(company_id) {
  const { data: jobs, error: e1 } = await supabase.from('job').select('job_id, title').eq('company_id', company_id)
  if (e1) throw e1
  const ids = jobs?.map(j => j.job_id) || []
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('application')
    .select('job_id, count:application_id')
    .in('job_id', ids)
    .group('job_id')
  if (error) throw error
  return data.map(d => ({ ...d, title: jobs.find(j => j.job_id === d.job_id)?.title || d.job_id }))
}

export async function topSkills(limit = 10) {
  const { data, error } = await supabase
    .from('applicant_skill')
    .select('skill_id, count:applicant_id')
    .group('skill_id')
    .order('count', { ascending: false })
    .limit(limit)
  if (error) throw error
  const ids = data.map(d => d.skill_id)
  const { data: skills } = await supabase.from('skill').select('skill_id, skill_name').in('skill_id', ids)
  return data.map(d => ({ ...d, skill_name: skills?.find(s => s.skill_id === d.skill_id)?.skill_name }))
}
