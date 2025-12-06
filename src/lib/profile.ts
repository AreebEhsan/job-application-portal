import { supabase } from '@/lib/supabaseClient'

export type WhoAmI = {
  user_id: string
  role: 'applicant' | 'recruiter'
  applicant_id: string | null
  company_id: string | null
  full_name: string | null
  university: string | null
  experience_level: string | null
  skills: string | null
} | null

export async function getWhoAmI(): Promise<WhoAmI> {
  // Always read from profile as the source of truth
  const { data, error } = await supabase
    .from('profile')
    .select(
      'user_id, role, applicant_id, company_id, full_name, university, experience_level, skills'
    )
    .maybeSingle()

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('getWhoAmI: error loading profile', error)
    throw error
  }

  return (data as any) ?? null
}