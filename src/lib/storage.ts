import { supabase } from '@/lib/supabaseClient'

const MAX_RESUME_SIZE = 10 * 1024 * 1024 // 10 MB

interface UploadResumeArgs {
  applicantId: string
  jobId: string
  file: File
}

interface UploadResumeResult {
  url: string | null
  error: Error | null
}

export async function uploadResumeFile({
  applicantId,
  jobId,
  file,
}: UploadResumeArgs): Promise<UploadResumeResult> {
  if (!file) return { url: null, error: new Error('No file provided') }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { url: null, error: new Error('Resume must be a PDF file') }
  }

  if (file.size > MAX_RESUME_SIZE) {
    return { url: null, error: new Error('Resume is too large (max 10 MB)') }
  }

  const path = `${applicantId}/${jobId}/${Date.now()}.pdf`

  const { error } = await supabase.storage
    .from('resumes')
    .upload(path, file, { contentType: 'application/pdf', cacheControl: '3600', upsert: false })

  if (error) {
    const isBucketMissing =
      // @ts-expect-error statusCode exists on StorageError at runtime
      error?.statusCode === 404 || /bucket/i.test(error.message ?? '')
    const wrapped = Object.assign(new Error(error.message || 'Resume upload failed'), {
      code: isBucketMissing ? 'RESUME_BUCKET_NOT_FOUND' : 'RESUME_UPLOAD_ERROR',
      original: error,
    })
    return { url: null, error: wrapped }
  }

  return { url: path, error: null }
}
