import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getOrCreateApplicant, setApplicantSkills, updateApplicant } from '@/lib/queries'
import SkillSelector from '@/components/SkillSelector'

export default function EditProfile() {
  const { session } = useAuth()
  const [applicant, setApplicant] = useState()
  const [skills, setSkills] = useState([])
  const [name, setName] = useState('')

  useEffect(() => { (async () => {
    if (!session) return
    const a = await getOrCreateApplicant(session.user.id, session.user.email || undefined)
    setApplicant(a)
    setName(a.name || '')
  })() }, [session])

  const save = async () => {
    if (!applicant) return
    await updateApplicant(applicant.applicant_id, { name })
    await setApplicantSkills(applicant.applicant_id, skills)
    alert('Profile saved!')
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 space-y-6 px-4">
      <div className="glass p-6 md:p-10 space-y-4">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Your name" />
        <div>
          <h3 className="font-semibold mb-2">Skills</h3>
          <SkillSelector selected={skills} onChange={setSkills} />
        </div>
        <button onClick={save} className="cta bg-emerald-600 hover:bg-emerald-500" aria-label="Save profile">Save</button>
      </div>
    </div>
  )
}
