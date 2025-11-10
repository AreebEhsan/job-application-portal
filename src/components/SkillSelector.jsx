import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SkillSelector({ selected, onChange }) {
  const [all, setAll] = useState([])

  useEffect(() => { (async () => {
    const { data } = await supabase.from('skill').select('*').order('skill_name')
    setAll(data || [])
  })() }, [])

  const toggle = (skill_id) => {
    const exists = selected.find(s => s.skill_id === skill_id)
    if (exists) onChange(selected.filter(s => s.skill_id !== skill_id))
    else onChange([...selected, { skill_id, proficiency_level: 3 }])
  }

  const setLevel = (skill_id, lvl) => {
    onChange(selected.map(s => s.skill_id === skill_id ? { ...s, proficiency_level: lvl } : s))
  }

  return (
    <div className="space-y-2">
      {all.map(s => {
        const picked = selected.find(x => x.skill_id === s.skill_id)
        return (
          <div key={s.skill_id} className="flex items-center gap-3">
            <input type="checkbox" checked={!!picked} onChange={() => toggle(s.skill_id)} />
            <span className="w-40">{s.skill_name}</span>
            {picked && (
              <input type="range" min={1} max={5} value={picked.proficiency_level} onChange={e => setLevel(s.skill_id, Number(e.target.value))} />
            )}
          </div>
        )
      })}
    </div>
  )
}
