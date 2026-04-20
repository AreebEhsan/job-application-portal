import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getApplicantSkills,
  getOrCreateApplicant,
  setApplicantSkills,
  updateApplicant,
} from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import SkillSelector from '@/components/SkillSelector'
import { Button } from '@/components/ui/Button'

export default function EditProfile() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id ?? ''

  const applicantQuery = useQuery({
    queryKey: ['applicant', userId],
    queryFn: () => getOrCreateApplicant(userId, session?.user.email),
    enabled: !!userId,
  })

  const applicant = applicantQuery.data
  const applicantId = applicant?.applicant_id ?? ''

  const skillsQuery = useQuery({
    queryKey: ['applicant-skills', applicantId],
    queryFn: () => getApplicantSkills(applicantId),
    enabled: !!applicantId,
    select: data =>
      data.map(s => ({ skill_id: s.skill_id, proficiency_level: s.proficiency_level ?? 3 })),
  })

  const [name, setName] = useState(() => applicant?.name ?? '')
  if (applicant?.name && name === '') setName(applicant.name)

  const [skills, setSkills] = useState<Array<{ skill_id: string; proficiency_level: number }>>([])
  if (skillsQuery.data && skills.length === 0 && skillsQuery.data.length > 0) {
    setSkills(skillsQuery.data)
  }

  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!applicantId) throw new Error('Applicant not loaded')
      await Promise.all([
        updateApplicant(applicantId, { name }),
        setApplicantSkills(applicantId, skills),
      ])
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applicant-skills', applicantId] })
      void queryClient.invalidateQueries({ queryKey: ['applicant', userId] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: Error) => setError(e.message),
  })

  if (applicantQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        <div className="glass p-8 animate-pulse space-y-4">
          <div className="h-6 w-1/3 bg-white/8 rounded" />
          <div className="h-10 bg-white/8 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-7 md:p-10 space-y-6"
      >
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Profile</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Edit Profile</h1>
          <p className="text-sm text-white/40 mt-1">Keep your info up to date for better recommendations.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
            aria-label="Your name"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Skills</label>
          <SkillSelector selected={skills} onChange={setSkills} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm"
            >
              {error}
            </motion.p>
          )}
          {saved && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm"
            >
              ✓ Profile saved successfully
            </motion.p>
          )}
        </AnimatePresence>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full py-2.5 text-base"
        >
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
              </svg>
              Saving…
            </span>
          ) : 'Save Profile'}
        </Button>
      </motion.div>
    </div>
  )
}
