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

const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert']

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
    <div className="space-y-4">
      {/* Skill toggles */}
      <div className="flex flex-wrap gap-2">
        {all.map(s => {
          const picked = !!selected.find(x => x.skill_id === s.skill_id)
          return (
            <button
              key={s.skill_id}
              type="button"
              onClick={() => toggle(s.skill_id)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 ${
                picked
                  ? 'bg-violet-600/25 border-violet-500/50 text-violet-300 ring-1 ring-violet-500/30'
                  : 'bg-white/5 border-white/10 text-white/55 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {picked && '✓ '}{s.skill_name}
            </button>
          )
        })}
      </div>

      {/* Proficiency sliders for selected skills */}
      {selected.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl border border-white/8 bg-white/3">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Proficiency levels</p>
          {selected.map(sel => {
            const skill = all.find(s => s.skill_id === sel.skill_id)
            if (!skill) return null
            return (
              <div key={sel.skill_id} className="flex items-center gap-3">
                <span className="text-xs text-white/70 w-28 truncate shrink-0">{skill.skill_name}</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={sel.proficiency_level}
                  onChange={e => setLevel(sel.skill_id, Number(e.target.value))}
                  className="flex-1 accent-violet-500 h-1 cursor-pointer"
                />
                <span className="text-xs text-violet-300 w-20 text-right shrink-0">
                  {LEVEL_LABELS[sel.proficiency_level]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
