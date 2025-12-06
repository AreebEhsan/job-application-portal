import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { supabase } from '@/lib/supabaseClient'
import { getOrCreateApplicant, updateApplicant } from '@/lib/queries'
import Card from '@/components/ui/Card'
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profileLoading) return
    if (!session) {
      navigate('/signin', { replace: true })
      return
    }
    if (!profile || profile.role !== 'applicant') {
      navigate('/', { replace: true })
      return
    }

    setFullName(profile.full_name || '')
    setUniversity(profile.university || '')
    setExperience(profile.experience_level || '')
    setSkills(profile.skills || '')
  }, [session, profile, profileLoading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!session || !profile) return

    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase
        .from('profile') // or 'profiles' – must match your table name
        .update({
          full_name: fullName.trim(),
          university: university.trim() || null,
          experience_level: experience || null,
          skills: skills.trim() || null,
        })
        .eq('user_id', session.user.id)

      if (updateErr) throw updateErr

      const applicant = await getOrCreateApplicant(
        session.user.id,
        session.user.email || undefined
      )

      const patch = { name: fullName.trim() }
      if (session.user.email && session.user.email !== applicant.email) {
        patch.email = session.user.email
      }

      await updateApplicant(applicant.applicant_id, patch)

      await refreshProfile()

      navigate('/jobs', { replace: true })
    } catch (e) {
      setError(e.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-8">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-10">
      <Card className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Set up your applicant profile
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Fill in your details so recruiters can see your name, background, and skills when you apply.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">University</label>
            <input
              className="input"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. Georgia Tech"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Experience level</label>
            <select
              className="input"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">Select…</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">
              Skills (comma-separated)
            </label>
            <textarea
              className="input min-h-[96px]"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. JavaScript, React, SQL"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/jobs')}
            >
              Skip for now
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
