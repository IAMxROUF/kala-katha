/**
 * POST /api/generate-images
 *
 * Generates 4 polished product images for a craft using a free image
 * generation service (Pollinations.ai by default — no API key needed,
 * no billing, no rate limits to speak of for our usage).
 *
 * Body: { craftId }
 *
 * Response: { urls: string[], cached?: boolean }
 *
 * Lazy generation: if the craft already has 4+ generated images, returns
 * them from cache. Safe to call repeatedly.
 *
 * Tunables (set in Vercel env vars):
 *   IMAGE_PROVIDER          — "pollinations" (default, FREE) | "openai"
 *   POLLINATIONS_MODEL      — "flux" (default) | "flux-realism" | "turbo"
 *   OPENAI_API_KEY          — only needed if IMAGE_PROVIDER=openai
 *   OPENAI_IMAGE_MODEL      — only used if IMAGE_PROVIDER=openai
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '4mb' } },
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { craftId } = req.body || {}
  if (!craftId) return res.status(400).json({ error: 'craftId required' })

  try {
    const { data: craft, error: fetchErr } = await supabase
      .from('crafts')
      .select('*')
      .eq('id', craftId)
      .single()
    if (fetchErr || !craft) {
      return res.status(404).json({ error: 'Craft not found' })
    }

    // Return cached if we already have 4 generated images
    if (Array.isArray(craft.generated_extras) && craft.generated_extras.length >= 4) {
      return res.status(200).json({ urls: craft.generated_extras, cached: true })
    }

    // Build 4 prompt variations
    const base = buildBasePrompt(craft)
    const prompts = [
      `${base}. Professional product photograph, front view, clean studio lighting, neutral background, sharp focus, high resolution catalogue shot.`,
      `${base}. Close-up detail shot showing craftsmanship and texture, soft natural lighting, shallow depth of field.`,
      `${base}. Lifestyle photo in a culturally appropriate ${craft.region || 'Indian'} setting, warm natural lighting, tasteful composition.`,
      `${base}. Three-quarter angle product shot, museum-quality lighting, minimal background, fine art photography style.`,
    ]

    // Pick provider — defaults to Pollinations (free)
    const provider = (process.env.IMAGE_PROVIDER || 'pollinations').toLowerCase()
    const generator = provider === 'openai' ? generateOpenAI : generatePollinations

    const generated = await Promise.all(
      prompts.map((p) => generateAndStore(p, craftId, generator)),
    )
    const validUrls = generated.filter(Boolean)

    if (validUrls.length === 0) {
      return res.status(500).json({ error: `All ${provider} generations failed` })
    }

    await supabase
      .from('crafts')
      .update({ generated_extras: validUrls })
      .eq('id', craftId)

    return res.status(200).json({ urls: validUrls, provider })
  } catch (e) {
    console.error('[generate-images]', e)
    return res.status(500).json({ error: e.message })
  }
}

function buildBasePrompt(craft) {
  const parts = []
  if (craft.title) parts.push(`"${craft.title}"`)
  parts.push(`a ${craft.craft || 'traditional Indian handcraft'}`)
  if (craft.region) parts.push(`from ${craft.region}`)
  if (craft.materials) parts.push(`made from ${craft.materials}`)
  if (craft.description) parts.push(craft.description)
  return parts.join(', ').slice(0, 500)
}

// Shared wrapper that calls a provider function and stores the result
async function generateAndStore(prompt, craftId, generator) {
  try {
    const buffer = await generator(prompt)
    if (!buffer) return null

    const filename = `generated/${craftId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`
    const { error: upErr } = await supabase.storage
      .from('craft-images')
      .upload(filename, buffer, { contentType: 'image/jpeg', upsert: false })
    if (upErr) {
      console.warn('[generate-images] Supabase upload', upErr.message)
      return null
    }
    const { data: pub } = supabase.storage.from('craft-images').getPublicUrl(filename)
    return pub?.publicUrl || null
  } catch (e) {
    console.warn('[generate-images] generateAndStore', e.message)
    return null
  }
}

// ── Provider: Pollinations.ai (FREE, no API key) ────────────────────────
async function generatePollinations(prompt) {
  const model = process.env.POLLINATIONS_MODEL || 'flux'
  const seed = Math.floor(Math.random() * 1_000_000)
  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model,
    seed: String(seed),
    nologo: 'true',
    enhance: 'true',
    private: 'true',
  })
  const encoded = encodeURIComponent(prompt.slice(0, 1500))
  const url = `https://image.pollinations.ai/prompt/${encoded}?${params}`

  // Pollinations can take 20-40s to generate, so give it a generous timeout
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 50_000)
  try {
    const resp = await fetch(url, { signal: controller.signal })
    if (!resp.ok) {
      console.warn('[pollinations]', resp.status, await resp.text().catch(() => ''))
      return null
    }
    return Buffer.from(await resp.arrayBuffer())
  } finally {
    clearTimeout(timer)
  }
}

// ── Provider: OpenAI gpt-image-* (paid, requires verified org) ──────────
async function generateOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[openai-image] OPENAI_API_KEY missing')
    return null
  }
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'

  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: prompt.slice(0, 3900),
      n: 1,
      size: '1024x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'medium',
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    console.error(`[openai-image] ${model} FAILED:`, resp.status, errText.slice(0, 500))
    return null
  }

  const data = await resp.json()
  const b64 = data?.data?.[0]?.b64_json
  const url = data?.data?.[0]?.url
  if (b64) return Buffer.from(b64, 'base64')
  if (url) {
    const r = await fetch(url)
    if (!r.ok) return null
    return Buffer.from(await r.arrayBuffer())
  }
  return null
}
