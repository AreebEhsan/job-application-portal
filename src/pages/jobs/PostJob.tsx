import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { postJob, getAllSkills } from '@/lib/queries'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/Button'

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
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-7 md:p-10 space-y-6"
      >
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Recruiting</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Post a Job</h1>
          {companyQuery.data?.name && (
            <p className="text-sm text-white/40 mt-1">
              Posting on behalf of <span className="text-white/65 font-medium">{companyQuery.data.name}</span>
            </p>
          )}
        </div>

        {profileLoading || companyQuery.isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-white/8 rounded-lg" />
            <div className="h-10 bg-white/8 rounded-lg" />
            <div className="h-32 bg-white/8 rounded-lg" />
          </div>
        ) : missingCompany ? (
          <p className="px-3 py-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
            You must be a recruiter linked to a company to post a job.
          </p>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault()
              setMessage(null)
              postMutation.mutate()
            }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Job Title *</label>
              <input
                className="input"
                placeholder="e.g. Senior Frontend Engineer"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                aria-label="Job title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Location</label>
              <input
                className="input"
                placeholder="e.g. Remote · Atlanta, GA · Hybrid"
                value={location}
                onChange={e => setLocation(e.target.value)}
                aria-label="Location"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Description</label>
              <textarea
                className="input resize-none"
                placeholder="Describe the role, responsibilities, and what you're looking for…"
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                aria-label="Job description"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Required Skills</label>
                {selectedSkillIds.length > 0 && (
                  <span className="text-xs text-violet-400 font-medium">
                    {selectedSkillIds.length} selected
                  </span>
                )}
              </div>
              {skillsQuery.isLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-7 w-16 bg-white/8 rounded-full animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(skillsQuery.data ?? []).map(s => {
                    const selected = selectedSkillIds.includes(s.skill_id)
                    return (
                      <button
                        key={s.skill_id}
                        type="button"
                        onClick={() => toggleSkill(s.skill_id)}
                        className={`px-3 py-1 rounded-full border text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                          selected
                            ? 'bg-violet-600/25 border-violet-500/50 text-violet-300 ring-1 ring-violet-500/30'
                            : 'bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white/80'
                        }`}
                      >
                        {selected && '✓ '}{s.skill_name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <AnimatePresence>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`px-3 py-2.5 rounded-lg border text-sm ${
                    message.ok
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/25 text-red-300'
                  }`}
                >
                  {message.ok ? '✓ ' : ''}{message.text}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={postMutation.isPending || !title.trim()}
              className="w-full py-2.5 text-base"
            >
              {postMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  Posting…
                </span>
              ) : '+ Post Job'}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
