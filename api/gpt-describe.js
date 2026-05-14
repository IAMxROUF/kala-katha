/**
 * POST /api/gpt-describe
 *
 * Takes an artisan's free-form notes about their craft product and produces
 * structured English documentation focused on the PRODUCT itself.
 *
 * Primary: OpenAI Chat Completions (gpt-4o-mini by default).
 * Fallback: Google Gemini if OPENAI_API_KEY isn't configured but GEMINI_API_KEY is.
 *
 * Response: { description, materials, technique, time }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const {
    rawStory    = '',
    productName = '',
    craft       = '',
    region      = '',
    materials   = '',
    technique   = '',
  } = req.body || {}

  // Prefer Gemini (free); fall back to OpenAI only if Gemini fails or isn't configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await callGemini({ rawStory, productName, craft, region, materials, technique })
      return res.status(200).json(result)
    } catch (err) {
      console.error('[gpt-describe] Gemini failed:', err.message)
      // fall through to OpenAI fallback
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await callOpenAI({ rawStory, productName, craft, region, materials, technique })
      return res.status(200).json(result)
    } catch (err) {
      console.error('[gpt-describe] OpenAI failed:', err.message)
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(500).json({
    error: 'Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured on the server.',
  })
}

// ── OpenAI implementation (primary) ─────────────────────────────────────
async function callOpenAI({ rawStory, productName, craft, region, materials, technique }) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const system = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
The artisan has shared free-form notes about a craft product (possibly in Hindi, English, Hinglish, or any Indian language).
Your job: write polished English documentation focused on the PRODUCT itself — what it is, what it's used for, its cultural significance.
Be factual and respectful. Don't focus on the artisan's personal story unless directly relevant to the product.
Return ONLY a valid JSON object.`

  const user = `Document this Indian craft product.

Product name:    ${productName || '(unknown)'}
Craft tradition: ${craft || '(unknown)'}
Region:          ${region || '(unknown)'}
Materials:       ${materials || '(not provided)'}
Technique:       ${technique || '(not provided — describe based on the tradition)'}

Artisan's notes about the product (any language — translate to English):
"""
${rawStory || 'A beautiful handcrafted piece made with traditional techniques.'}
"""

Return a JSON object with EXACTLY these four keys (all in English):
- "description" : 2-3 informative sentences ABOUT THE PRODUCT — what it is, what it's used for, its cultural significance, and a hint of how it's made. Focus on the product, not the artisan personally.
- "materials"   : Comma-separated list of materials. If the artisan provided some, refine that list; otherwise infer from the craft tradition.
- "technique"   : 1-2 clear English sentences describing the making process. If the artisan provided a technique, polish it; otherwise describe the typical process for this tradition.
- "time"        : Estimated time to make one piece (e.g. "3-5 days", "2 weeks").`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 600,
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`OpenAI ${resp.status}: ${errText.slice(0, 300)}`)
  }

  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('OpenAI returned no content')

  const parsed = JSON.parse(text)
  return {
    description: parsed.description ?? parsed.Description ?? '',
    materials:   parsed.materials   ?? parsed.Materials   ?? materials,
    technique:   parsed.technique   ?? parsed.Technique   ?? technique,
    time:        parsed.time        ?? parsed.Time        ?? parsed.time_to_make ?? '',
  }
}

// ── Gemini implementation (primary, free) ───────────────────────────────
async function callGemini({ rawStory, productName, craft, region, materials, technique }) {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  const systemInstruction = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
The artisan has shared free-form notes about a craft product (possibly in Hindi, English, Hinglish, or any Indian language).
Your job: write polished English documentation focused on the PRODUCT itself — what it is, what it's used for, its cultural significance.
Be factual and respectful. Don't focus on the artisan's personal story unless directly relevant to the product.
Return ONLY a valid JSON object.`

  const userPrompt = `Document this Indian craft product.

Product name:    ${productName || '(unknown)'}
Craft tradition: ${craft || '(unknown)'}
Region:          ${region || '(unknown)'}
Materials:       ${materials || '(not provided)'}
Technique:       ${technique || '(not provided — describe based on the tradition)'}

Artisan's notes about the product (any language — translate to English):
"""
${rawStory || 'A beautiful handcrafted piece made with traditional techniques.'}
"""

Return a JSON object with EXACTLY these four keys (all in English):
- "description" : 2-3 informative sentences ABOUT THE PRODUCT — what it is, what it's used for, its cultural significance, and a hint of how it's made.
- "materials"   : Comma-separated list of materials. If the artisan provided some, refine that list; otherwise infer from the craft tradition.
- "technique"   : 1-2 clear English sentences describing the making process.
- "time"        : Estimated time to make one piece (e.g. "3-5 days", "2 weeks").`

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 600 },
    }),
  })

  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${(await resp.text()).slice(0, 300)}`)
  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no text')
  const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text)
  return {
    description: parsed.description ?? '',
    materials:   parsed.materials   ?? materials,
    technique:   parsed.technique   ?? technique,
    time:        parsed.time        ?? parsed.time_to_make ?? '',
  }
}
