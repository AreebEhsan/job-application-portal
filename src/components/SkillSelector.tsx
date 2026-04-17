import { useQuery } from '@tanstack/react-query'
import { getAllSkills } from '@/lib/queries'

interface SelectedSkill {
  skill_id: string
  proficiency_level: number
}

interface SkillSelectorProps {
  selected: SelectedSkill[]
  onChange: (skills: SelectedSkill[]) => void
}

export default function SkillSelector({ selected, onChange }: SkillSelectorProps) {
  const { data: all = [] } = useQuery({
    queryKey: ['all-skills'],
    queryFn: getAllSkills,
    staleTime: Infinity,
  })

  const toggle = (skill_id: string) => {
    const exists = selected.find(s => s.skill_id === skill_id)
    if (exists) onChange(selected.filter(s => s.skill_id !== skill_id))
    else onChange([...selected, { skill_id, proficiency_level: 3 }])
  }

  const setLevel = (skill_id: string, lvl: number) => {
    onChange(selected.map(s => s.skill_id === skill_id ? { ...s, proficiency_level: lvl } : s))
  }

  return (
    <div className="glass p-4 space-y-3">
      {all.map(s => {
        const picked = selected.find(x => x.skill_id === s.skill_id)
        return (
          <div key={s.skill_id} className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => toggle(s.skill_id)}
              className={`px-3 py-1 rounded-full border transition-all duration-200 ${
                picked
                  ? 'bg-white/30 border-white/40'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
            >
              {picked ? '✓ ' : ''}{s.skill_name}
            </button>
            {picked && (
              <input
                type="range"
                min={1}
                max={5}
                value={picked.proficiency_level}
                onChange={e => setLevel(s.skill_id, Number(e.target.value))}
                className="w-40 accent-white/80"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
