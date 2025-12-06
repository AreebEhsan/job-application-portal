import { supabase } from '@/lib/supabaseClient'

const MAX_RESUME_SIZE = 10 * 1024 * 1024 // 10 MB

export async function uploadResumeFile({ applicantId, jobId, file }) {
  if (!file) {
    return { url: null, error: new Error('No file provided') }
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { url: null, error: new Error('Resume must be a PDF file') }
  }

  if (file.size > MAX_RESUME_SIZE) {
    return { url: null, error: new Error('Resume is too large (max 10 MB)') }
  }

  const safeApplicantId = String(applicantId)
  const safeJobId = String(jobId)
  const timestamp = Date.now()
  const path = `${safeApplicantId}/${safeJobId}/${timestamp}.pdf`

  const { error } = await supabase.storage
    .from('resumes')
    .upload(path, file, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    // Normalize bucket-not-found into a friendly code we can handle in the UI
    const wrapped = new Error(error.message || 'Resume storage bucket not found')
    // @ts-ignore
    wrapped.code = error?.statusCode === 404 || /bucket/i.test(error.message || '')
      ? 'RESUME_BUCKET_NOT_FOUND'
      : error.code || 'RESUME_UPLOAD_ERROR'
    // @ts-ignore
    wrapped.original = error
    return { url: null, error: wrapped }
  }

  // We store the storage path; when reading, you can create signed URLs as needed
  return { url: path, error: null }
}
