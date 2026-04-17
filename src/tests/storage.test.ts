import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the supabase client before importing storage
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}))

import { uploadResumeFile } from '@/lib/storage'

const makeFile = (
  name: string,
  type: string,
  size: number,
): File => {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('uploadResumeFile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects non-PDF files', async () => {
    const file = makeFile('resume.docx', 'application/msword', 100)
    const result = await uploadResumeFile({ applicantId: 'a1', jobId: 'j1', file })
    expect(result.url).toBeNull()
    expect(result.error?.message).toMatch(/PDF/)
  })

  it('rejects files over 10 MB', async () => {
    const file = makeFile('resume.pdf', 'application/pdf', 11 * 1024 * 1024)
    const result = await uploadResumeFile({ applicantId: 'a1', jobId: 'j1', file })
    expect(result.url).toBeNull()
    expect(result.error?.message).toMatch(/10 MB/)
  })

  it('returns a storage path on success', async () => {
    const file = makeFile('resume.pdf', 'application/pdf', 500 * 1024)
    const result = await uploadResumeFile({ applicantId: 'a1', jobId: 'j1', file })
    expect(result.error).toBeNull()
    expect(result.url).toMatch(/^a1\/j1\/\d+\.pdf$/)
  })
})
