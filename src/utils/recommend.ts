import type { ApplicantSkill, JobForRecommend } from '@/lib/types'

export function scoreJob(
  applicantSkills: ApplicantSkill[],
  jobRequiredSkillIds: string[],
): number {
  if (!jobRequiredSkillIds.length) return 0
  const map = new Map(applicantSkills.map(s => [s.skill_id, s.proficiency_level || 1]))
  const sum = jobRequiredSkillIds.reduce((acc, id) => acc + (map.get(id) ?? 0), 0)
  const max = jobRequiredSkillIds.length * 5
  return Number((sum / max).toFixed(3))
}

export function rankJobs(
  applicantSkills: ApplicantSkill[],
  jobs: JobForRecommend[],
): (JobForRecommend & { score: number })[] {
  return jobs
    .map(j => ({ ...j, score: scoreJob(applicantSkills, j.requiredSkills) }))
    .sort((a, b) => b.score - a.score)
}
