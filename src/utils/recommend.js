export function scoreJob(applicantSkills, jobRequiredSkillIds) {
  const map = new Map(applicantSkills.map(s => [s.skill_id, s.proficiency_level || 1]))
  const matched = jobRequiredSkillIds.map(id => map.get(id) || 0)
  const sum = matched.reduce((a,b) => a + b, 0)
  const max = jobRequiredSkillIds.length * 5
  const score = max ? sum / max : 0
  return Number(score.toFixed(3))
}

export function rankJobs(applicantSkills, jobs) {
  return jobs
    .map(j => ({ ...j, score: scoreJob(applicantSkills, j.requiredSkills) }))
    .sort((a, b) => b.score - a.score)
}
