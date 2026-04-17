/**
 * Supabase Edge Function: notify-status-change
 *
 * Triggered by a Supabase Database Webhook when a row in the `application`
 * table is updated. Sends an email to the applicant when their application
 * status changes.
 *
 * Setup:
 * 1. Deploy:  supabase functions deploy notify-status-change
 * 2. Set secret: supabase secrets set RESEND_API_KEY=re_xxxx
 * 3. In the Supabase dashboard → Database → Webhooks, create a webhook:
 *    - Table: application
 *    - Events: UPDATE
 *    - URL: https://<project-ref>.supabase.co/functions/v1/notify-status-change
 *    - HTTP method: POST
 *    - Headers: Authorization: Bearer <service role key>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@jobwise.app'

const STATUS_LABELS: Record<string, string> = {
  submitted:  'Submitted',
  in_review:  'Under Review',
  interview:  'Interview Scheduled',
  offer:      'Offer Extended',
  rejected:   'Application Closed',
}

const STATUS_MESSAGES: Record<string, string> = {
  submitted:  'Your application has been received. We\'ll be in touch soon.',
  in_review:  'Great news — a recruiter is reviewing your application.',
  interview:  'Congratulations! You\'ve been selected for an interview. The recruiter will reach out shortly.',
  offer:      'Exciting news — you\'ve received a job offer! The recruiter will contact you with the details.',
  rejected:   'Thank you for applying. Unfortunately, the team has decided to move forward with other candidates. We encourage you to apply for future openings.',
}

interface WebhookPayload {
  type: 'UPDATE'
  table: string
  record: {
    application_id: string
    applicant_id: string
    job_id: string
    status: string
  }
  old_record: {
    status: string
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json() as WebhookPayload

    // Only act on status changes
    if (payload.record.status === payload.old_record.status) {
      return new Response(JSON.stringify({ skipped: 'status unchanged' }), { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch applicant email + name
    const { data: applicant, error: aErr } = await supabase
      .from('applicant')
      .select('name, email')
      .eq('applicant_id', payload.record.applicant_id)
      .single()
    if (aErr || !applicant?.email) {
      console.warn('Could not fetch applicant', aErr)
      return new Response(JSON.stringify({ skipped: 'no applicant email' }), { status: 200 })
    }

    // Fetch job title
    const { data: job } = await supabase
      .from('job')
      .select('title')
      .eq('job_id', payload.record.job_id)
      .single()

    const newStatus = payload.record.status
    const statusLabel = STATUS_LABELS[newStatus] ?? newStatus
    const message = STATUS_MESSAGES[newStatus] ?? `Your application status has been updated to "${newStatus}".`
    const jobTitle = job?.title ?? 'the position'

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — email not sent')
      return new Response(JSON.stringify({ skipped: 'no api key' }), { status: 200 })
    }

    const emailBody = {
      from: FROM_EMAIL,
      to: [applicant.email],
      subject: `Application update: ${statusLabel} — ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 8px;">Application Update</h2>
          <p>Hi ${applicant.name ?? 'there'},</p>
          <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
          <p style="padding: 12px 16px; background: #f4f4f5; border-radius: 6px; font-weight: 600;">
            Status: ${statusLabel}
          </p>
          <p>${message}</p>
          <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
            — The JobWise Team
          </p>
        </div>
      `,
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Resend error', res.status, text)
      return new Response(JSON.stringify({ error: 'email send failed' }), { status: 500 })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 })
  } catch (err) {
    console.error('notify-status-change error', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
