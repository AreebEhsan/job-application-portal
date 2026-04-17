import { describe, it, expect } from 'vitest'
import { scoreJob, rankJobs } from '@/utils/recommend'
import type { ApplicantSkill, JobForRecommend } from '@/lib/types'

const skills: ApplicantSkill[] = [
  { skill_id: 'react',   proficiency_level: 5 },
  { skill_id: 'ts',      proficiency_level: 4 },
  { skill_id: 'sql',     proficiency_level: 2 },
]

describe('scoreJob', () => {
  it('returns 0 when the job has no required skills', () => {
    expect(scoreJob(skills, [])).toBe(0)
  })

  it('returns 1.000 when the applicant perfectly matches all required skills at max proficiency', () => {
    const perfectSkills: ApplicantSkill[] = [{ skill_id: 'react', proficiency_level: 5 }]
    expect(scoreJob(perfectSkills, ['react'])).toBe(1)
  })

  it('returns 0 when the applicant has none of the required skills', () => {
    expect(scoreJob(skills, ['java', 'kotlin'])).toBe(0)
  })

  it('computes a partial score correctly', () => {
    // react=5, ts=4 required; max = 2*5 = 10; sum = 5+4 = 9
    expect(scoreJob(skills, ['react', 'ts'])).toBe(0.9)
  })

  it('uses 0 for missing skills in a mixed required list', () => {
    // react=5, unknown=0; max = 2*5 = 10; sum = 5
    expect(scoreJob(skills, ['react', 'unknown'])).toBe(0.5)
  })
})

describe('rankJobs', () => {
  const jobs: JobForRecommend[] = [
    {
      job_id: '1', title: 'Frontend Dev', description: null, location: null,
      created_at: '', company: null,
      requiredSkills: ['react', 'ts'],
    },
    {
      job_id: '2', title: 'Backend Dev', description: null, location: null,
      created_at: '', company: null,
      requiredSkills: ['java', 'kotlin'],
    },
    {
      job_id: '3', title: 'Full Stack', description: null, location: null,
      created_at: '', company: null,
      requiredSkills: ['react', 'sql'],
    },
  ]

  it('returns jobs sorted by score descending', () => {
    const ranked = rankJobs(skills, jobs)
    expect(ranked[0].job_id).toBe('1') // react=5, ts=4 → 0.9
    expect(ranked[1].job_id).toBe('3') // react=5, sql=2 → 0.7
    expect(ranked[2].job_id).toBe('2') // no match   → 0
  })

  it('attaches a score property to every job', () => {
    const ranked = rankJobs(skills, jobs)
    for (const j of ranked) {
      expect(typeof j.score).toBe('number')
    }
  })

  it('returns an empty array when given no jobs', () => {
    expect(rankJobs(skills, [])).toEqual([])
  })

  it('returns 0 scores when applicant has no skills', () => {
    const ranked = rankJobs([], jobs)
    for (const j of ranked) {
      expect(j.score).toBe(0)
    }
  })
})
