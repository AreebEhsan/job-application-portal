import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant, updateApplicant } from '@/lib/queries'
import { Button } from '@/components/ui/Button'

const EXPERIENCE_OPTIONS = ['Student', '0–1 years', '2–5 years', '5+ years']

export default function ApplicantProfileSetup() {
  const { session } = useAuth()
  const { profile, loading: profileLoading, refreshProfile } = useProfile()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('')
  const [experience, setExperience] = useState('')
  const [skills, setSkills] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (profileLoading) return
    if (!session) { navigate('/signin', { replace: true }); return }
    if (!profile || profile.role !== 'applicant') { navigate('/', { replace: true }); return }
    setFullName(profile.full_name ?? '')
    setUniversity(profile.university ?? '')
    setExperience(profile.experience_level ?? '')
    setSkills(profile.skills ?? '')
  }, [session, profile, profileLoading, navigate])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session || !profile) throw new Error('Not authenticated')
      if (!fullName.trim()) throw new Error('Full name is required.')

      const { error: updateErr } = await supabase
        .from('profile')
        .update({
          full_name: fullName.trim(),
          university: university.trim() || null,
          experience_level: experience || null,
          skills: skills.trim() || null,
        })
        .eq('user_id', session.user.id)
      if (updateErr) throw updateErr

      const applicant = await getOrCreateApplicant(session.user.id, session.user.email)
      const patch: { name: string; email?: string } = { name: fullName.trim() }
      if (session.user.email && session.user.email !== applicant.email) {
        patch.email = session.user.email
      }
      await updateApplicant(applicant.applicant_id, patch)
      await refreshProfile()
    },
    onSuccess: () => navigate('/jobs', { replace: true }),
    onError: (e: Error) => setFormError(e.message || 'Failed to save profile.'),
  })

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="glass p-8 animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="glass p-7 md:p-10 space-y-6"
      >
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">Onboarding</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Set up your profile</h1>
          <p className="text-sm text-white/40 mt-1">
            Fill in your details so recruiters can see your background and skills when you apply.
          </p>
        </div>

        <form
          onSubmit={e => { e.preventDefault(); setFormError(null); saveMutation.mutate() }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Full Name <span className="text-red-400 normal-case">*</span>
            </label>
            <input
              className="input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">University</label>
            <input
              className="input"
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="e.g. Georgia Tech"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Experience Level</label>
            <select className="input" value={experience} onChange={e => setExperience(e.target.value)}>
              <option value="">Select…</option>
              {EXPERIENCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Skills</label>
            <textarea
              className="input resize-none"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g. JavaScript, React, SQL, Python…"
              rows={3}
            />
          </div>

          {formError && (
            <p className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => navigate('/jobs')}>
              Skip for now
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/>
                  </svg>
                  Saving…
                </span>
              ) : 'Save Profile →'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
