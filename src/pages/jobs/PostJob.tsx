import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { postJob, getAllSkills } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'

export default function PostJob() {
  const { profile, loading: profileLoading } = useProfile()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const companyQuery = useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company')
        .select('company_id, name')
        .eq('company_id', profile!.company_id!)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!profile?.company_id,
  })

  const skillsQuery = useQuery({
    queryKey: ['all-skills'],
    queryFn: getAllSkills,
    staleTime: Infinity,
  })

  const postMutation = useMutation({
    mutationFn: () =>
      postJob({
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        company_id: profile!.company_id!,
        skillIds: selectedSkillIds,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company-jobs'] })
      setMessage({ text: 'Job posted successfully!', ok: true })
      setTitle('')
      setLocation('')
      setDescription('')
      setSelectedSkillIds([])
    },
    onError: (e: Error) => setMessage({ text: e.message, ok: false }),
  })

  const toggleSkill = (skill_id: string) =>
    setSelectedSkillIds(prev =>
      prev.includes(skill_id) ? prev.filter(id => id !== skill_id) : [...prev, skill_id],
    )

  const missingCompany = !profile || profile.role !== 'recruiter' || !profile.company_id

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10">
        <h1 className="text-3xl font-bold mb-4">Post a Job</h1>

        {profileLoading || companyQuery.isLoading ? (
          <p className="text-sm">Loading your company…</p>
        ) : missingCompany ? (
          <p className="text-sm text-red-400">
            You must be a recruiter linked to a company to post a job.
          </p>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault()
              setMessage(null)
              postMutation.mutate()
            }}
            className="space-y-4"
          >
            <p className="text-sm text-white/80">
              Posting on behalf of:{' '}
              <span className="font-semibold">
                {companyQuery.data?.name ?? 'Your company'}
              </span>
            </p>

            <input
              className="input"
              placeholder="Job title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              aria-label="Job title"
            />
            <input
              className="input"
              placeholder="Location (e.g. Remote, Atlanta, GA)"
              value={location}
              onChange={e => setLocation(e.target.value)}
              aria-label="Location"
            />
            <textarea
              className="input"
              placeholder="Job description"
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-label="Job description"
            />

            {/* Required skills */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/90">Required skills</p>
              {skillsQuery.isLoading ? (
                <p className="text-xs text-white/60">Loading skills…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(skillsQuery.data ?? []).map(s => (
                    <button
                      key={s.skill_id}
                      type="button"
                      onClick={() => toggleSkill(s.skill_id)}
                      className={`px-3 py-1 rounded-full border text-sm transition-all ${
                        selectedSkillIds.includes(s.skill_id)
                          ? 'bg-emerald-500/30 border-emerald-400 text-white'
                          : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {selectedSkillIds.includes(s.skill_id) ? '✓ ' : ''}
                      {s.skill_name}
                    </button>
                  ))}
                </div>
              )}
              {selectedSkillIds.length > 0 && (
                <p className="text-xs text-white/60">
                  {selectedSkillIds.length} skill{selectedSkillIds.length === 1 ? '' : 's'} selected
                </p>
              )}
            </div>

            <button
              className="cta bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
              type="submit"
              disabled={postMutation.isPending || !title.trim()}
            >
              {postMutation.isPending ? 'Posting…' : '+ Post Job'}
            </button>
          </form>
        )}

        {message && (
          <p className={`text-sm mt-3 ${message.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
