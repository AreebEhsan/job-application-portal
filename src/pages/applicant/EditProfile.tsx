import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getApplicantSkills,
  getOrCreateApplicant,
  setApplicantSkills,
  updateApplicant,
} from '@/lib/queries'
import { useAuth } from '@/hooks/useAuth'
import SkillSelector from '@/components/SkillSelector'

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
  // Keep local name in sync once applicant loads
  if (applicant?.name && name === '') setName(applicant.name)

  const [skills, setSkills] = useState<Array<{ skill_id: string; proficiency_level: number }>>([])
  // Sync skills once loaded
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

  if (applicantQuery.isLoading) return <div className="p-6">Loading profile…</div>

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10 space-y-4">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          aria-label="Your name"
        />
        <div>
          <h3 className="font-semibold mb-2">Skills</h3>
          <SkillSelector selected={skills} onChange={setSkills} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Profile saved!</p>}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="cta bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
          aria-label="Save profile"
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
