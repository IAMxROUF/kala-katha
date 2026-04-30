/**
 * POST /.netlify/functions/gpt-describe
 *
 * Body: { rawStory, productName, craft, region }
 *
 * Calls Google Gemini to turn the artisan's raw story into structured
 * craft documentation.  Uses responseMimeType:"application/json" so
 * Gemini always returns parseable output — no markdown fences, no prose.
 *
 * Response: { description, materials, technique, time }
 *
 * Gemini API reference:
 *   https://ai.google.dev/api/generate-content
 */
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    return json(500, { error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  let body = {}
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const { rawStory = '', productName = '', craft = '', region = '' } = body

  // Default to gemini-1.5-flash — fast, cheap, and perfectly capable for
  // structured text tasks.  Override with GEMINI_MODEL env var if needed
  // (e.g. "gemini-1.5-pro" or "gemini-2.0-flash").
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

  // ── Prompts ──────────────────────────────────────────────────────────────
  const systemInstruction = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
Your job is to take an artisan's raw description of their work and transform it into structured, respectful, and accurate craft documentation.
Always stay true to what the artisan said — do not invent facts.
If something is unclear or missing, draw on culturally appropriate general knowledge for that craft tradition.
Return ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.`

  const userPrompt = `Document this handcrafted piece for a public cultural archive.

Piece name: ${productName || 'Handcrafted piece'}
Craft tradition: ${craft || 'Indian traditional craft'}
Region: ${region || 'India'}
Artisan's story (in their own words):
"""
${rawStory || 'A beautiful handcrafted piece made with traditional techniques.'}
"""

Return a JSON object with exactly these four keys:
- "description"  : A warm, 2–3 sentence description that honours the artisan's voice. Mention the craft tradition and region.
- "materials"    : A comma-separated list of the primary materials used (e.g. "Cotton cloth, natural indigo dye, hand-carved teak blocks").
- "technique"    : One or two sentences describing the making process in plain language a general audience can understand.
- "time"         : Estimated time to make one piece (e.g. "3–5 days", "2 weeks").`

  // ── Gemini REST call ──────────────────────────────────────────────────────
  // Auth goes in the URL query-param, not the Authorization header.
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // System-level instruction (Gemini treats this separately from the user turn)
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        // User turn
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          // Tell Gemini to return valid JSON — equivalent to OpenAI's
          // response_format: { type: "json_object" }
          responseMimeType: 'application/json',
          temperature: 0.6,
          maxOutputTokens: 600,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API error (${res.status}): ${err}`)
    }

    const data = await res.json()

    // Gemini response path: candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      // Surface finish / safety filter — log and fallback
      const finishReason = data?.candidates?.[0]?.finishReason
      throw new Error(`Gemini returned no text. finishReason: ${finishReason ?? 'unknown'}`)
    }

    // With responseMimeType:"application/json" the text IS valid JSON,
    // but we still guard against unexpected prose just in case.
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      // Last-resort: try to extract a {...} block
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse JSON from Gemini response')
      parsed = JSON.parse(match[0])
    }

    // Normalise key capitalisation (Gemini occasionally returns Title Case keys)
    return json(200, {
      description: parsed.description ?? parsed.Description ?? '',
      materials:   parsed.materials   ?? parsed.Materials   ?? '',
      technique:   parsed.technique   ?? parsed.Technique   ?? '',
      time:        parsed.time        ?? parsed.Time        ?? parsed.time_to_make ?? '',
    })
  } catch (err) {
    console.error('[gpt-describe / Gemini]', err)
    return json(500, { error: err.message })
  }
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
