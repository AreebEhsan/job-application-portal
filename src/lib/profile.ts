import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/lib/types'

export async function getWhoAmI(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select('user_id, role, applicant_id, company_id, full_name, university, experience_level, skills')
    .maybeSingle()

  if (error) {
    console.warn('getWhoAmI: error loading profile', error)
    throw error
  }

  return (data as Profile) ?? null
}
