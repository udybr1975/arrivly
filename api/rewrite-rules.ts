import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const MODEL = 'gemini-2.0-flash'

const SYSTEM_PROMPT =
  "You rewrite short-term rental house rules to sound warm, friendly and welcoming to a guest. " +
  "Write in flowing prose — no bullet points, no numbered lists, no markdown, no headings. " +
  "Address the guest directly as 'you'. Keep it concise: one short paragraph, two at most. " +
  "Preserve every actual rule and constraint from the input exactly — do not add, remove, soften, or invent rules. " +
  "Write in the SAME language as the input. " +
  "Output only the rewritten text, with no preamble, labels, or quotation marks."

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)
  const { data: authData, error: authError } = await sb.auth.getUser(token)
  if (authError || !authData.user) return res.status(401).json({ error: 'Unauthorized' })

  if (!req.body) return res.status(400).json({ error: 'rawRules is required' })

  const { rawRules } = req.body as { rawRules?: string }
  if (!rawRules || typeof rawRules !== 'string' || !rawRules.trim()) {
    return res.status(400).json({ error: 'rawRules is required' })
  }

  const trimmed = rawRules.trim()
  if (trimmed.length > 5000) return res.status(400).json({ error: 'rules too long' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  try {
    const ai = new GoogleGenAI({ apiKey })

    let timer!: ReturnType<typeof setTimeout>
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), 10000)
    })

    const generatePromise = ai.models.generateContent({
      model: MODEL,
      contents: trimmed,
      config: { systemInstruction: SYSTEM_PROMPT },
    })

    const response = await Promise.race([generatePromise, timeoutPromise])
    clearTimeout(timer)
    const result = response.text?.trim() || trimmed

    return res.status(200).json({ result })
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string; status?: number; code?: string; statusText?: string }
    console.error('[rewrite-rules] gemini call failed', {
      name: e?.name,
      message: e?.message?.slice(0, 120),
      status: e?.status,
      statusText: e?.statusText,
      code: e?.code,
    })
    return res.status(502).json({ error: 'rewrite failed' })
  }
}
