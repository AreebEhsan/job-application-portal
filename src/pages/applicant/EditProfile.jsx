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
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Edit Profile</h1>
      <input className="border p-2 rounded w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
      <div>
        <h3 className="font-semibold mb-2">Skills</h3>
        <SkillSelector selected={skills} onChange={setSkills} />
      </div>
      <button onClick={save} className="px-4 py-2 rounded-xl bg-emerald-600 text-white">Save</button>
    </div>
  )
}
