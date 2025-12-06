// server/gemini-server.cjs
// Minimal Express backend for the "AI suggestion (beta)" feature.
require("dotenv").config();

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const app = express()
app.use(cors())
app.use(bodyParser.json())

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn(
    'GEMINI_API_KEY is not set. The /api/gemini/applicant-advice endpoint will return an error until you configure it.'
  )
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null

app.post('/api/gemini/applicant-advice', async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini API key is not configured.' })
    }

    const { jobTitle, jobDescription, applicants = [], chatHistory = [] } = req.body || {}

    if (!jobTitle || !Array.isArray(applicants)) {
      return res.status(400).json({ error: 'jobTitle and applicants are required.' })
    }

    const applicantSummaries = applicants
      .map((a, idx) => {
        const safeCover = (a.cover_letter || '').slice(0, 800) // truncate for safety
        return [
          `Candidate ${idx + 1}:`,
          `- id: ${a.id || ''}`,
          `- name: ${a.name || ''}`,
          `- email: ${a.email || ''}`,
          a.skills ? `- skills: ${a.skills}` : null,
          a.experience_level ? `- experience_level: ${a.experience_level}` : null,
          a.university ? `- university: ${a.university}` : null,
          safeCover ? `- cover_letter: ${safeCover}` : null,
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')

    const systemInstructions = `
You are an AI assistant helping a recruiter evaluate applicants for a job.
You must:
- Focus only on job-relevant criteria (skills, experience, education).
- Avoid any discrimination based on protected attributes (e.g. race, gender, age, religion, disability, etc.).
- Provide suggestions and reasoning, but do NOT make final decisions or state that anyone must be rejected or hired.
- Use cautious language like "appears stronger", "may be a stretch", "might be a good fit".
- Keep the response concise: 1–3 short paragraphs plus, if useful, a short bullet list.
- If asked to auto-reject or decide for the recruiter, refuse and explain you're advisory only.
`

    const userPrompt = `
Job title: ${jobTitle}
Job description: ${jobDescription || '(not provided)'}

Applicants:
${applicantSummaries}

Task:
- Briefly compare the candidates for this role.
- Suggest up to 2–3 candidates that appear strongest for interview, and explain why in terms of skills and experience.
- Point out any candidates that seem like a stretch and why, again focusing only on role-related criteria.
- Return your answer as JSON with this shape:

{
  "message": "natural language explanation for the recruiter",
  "topCandidates": ["application_id1", "application_id2"]
}

Where "topCandidates" is an array of the candidate ids from the input (or empty if no clear standouts).
`

    const historyText =
      Array.isArray(chatHistory) && chatHistory.length
        ? `\nPrevious conversation context (you may optionally use this for nuance):\n${chatHistory
            .map((m) => `${m.role || 'user'}: ${m.content || ''}`)
            .join('\n')}\n`
        : ''

    const prompt = systemInstructions + '\n' + userPrompt + historyText

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // If the model didn't return strict JSON, wrap into the expected shape
      parsed = {
        message: text,
        topCandidates: [],
      }
    }

    const message =
      typeof parsed.message === 'string'
        ? parsed.message
        : text || 'No suggestion generated.'
    const topCandidates = Array.isArray(parsed.topCandidates)
      ? parsed.topCandidates.filter((id) => typeof id === 'string')
      : []

    return res.json({ message, topCandidates })
  } catch (err) {
    console.error('Error in /api/gemini/applicant-advice:', err)
    return res.status(500).json({ error: 'Failed to get AI suggestion.' })
  }
})

const PORT = 4000
app.listen(PORT, () => {
  console.log(`Gemini applicant advisor server listening on http://localhost:${PORT}`)
})