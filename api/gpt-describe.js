/**
 * POST /api/gpt-describe
 *
 * Calls Google Gemini to turn the artisan's raw story + craft details
 * into structured documentation: { description, materials, technique, time }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const API_KEY = process.env.GEMINI_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' })
  }

  const {
    rawStory    = '',
    productName = '',
    craft       = '',
    region      = '',
  } = req.body || {}

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

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
- "materials"    : A comma-separated list of the primary materials used.
- "technique"    : One or two sentences describing the making process in plain language.
- "time"         : Estimated time to make one piece (e.g. "3–5 days", "2 weeks").`

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`

  try {
    const response = await fetch(endpoint, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature:      0.6,
          maxOutputTokens:  600,
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini API error (${response.status}): ${err}`)
    }

    const data   = await response.json()
    const text   = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      const reason = data?.candidates?.[0]?.finishReason
      throw new Error(`Gemini returned no text. finishReason: ${reason ?? 'unknown'}`)
    }

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Could not parse JSON from Gemini response')
      parsed = JSON.parse(match[0])
    }

    return res.status(200).json({
      description: parsed.description ?? parsed.Description ?? '',
      materials:   parsed.materials   ?? parsed.Materials   ?? '',
      technique:   parsed.technique   ?? parsed.Technique   ?? '',
      time:        parsed.time        ?? parsed.Time        ?? parsed.time_to_make ?? '',
    })
  } catch (err) {
    console.error('[api/gpt-describe]', err)
    return res.status(500).json({ error: err.message })
  }
}
