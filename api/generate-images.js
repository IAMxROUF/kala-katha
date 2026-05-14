/**
 * POST /api/generate-images
 *
 * Generates 4 polished product images for a craft using OpenAI's
 * `gpt-image-2` model (ChatGPT's latest image generator), uploads them to
 * Supabase Storage, and saves the permanent URLs in the craft's
 * `generated_extras` column.
 *
 * Body: { craftId }
 *
 * Response: { urls: string[], cached?: boolean }
 *
 * Lazy generation: if the craft already has 4+ generated images, returns
 * them from cache. So the endpoint is safe to call repeatedly.
 *
 * Tunables (set in Vercel env vars):
 *   OPENAI_API_KEY            — required
 *   OPENAI_IMAGE_MODEL        — defaults to "gpt-image-2".
 *                               Can be set to "gpt-image-1" as a fallback
 *                               if your account doesn't have access to v2.
 *   OPENAI_IMAGE_QUALITY      — "low" | "medium" (default) | "high"
 */

import { createClient } from '@supabase/supabase-js'

// Allow up to 60 seconds — DALL-E 3 + Supabase upload takes time
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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY missing' })

  const { craftId } = req.body || {}
  if (!craftId) return res.status(400).json({ error: 'craftId required' })

  try {
    // ── Load the craft ────────────────────────────────────────────────
    const { data: craft, error: fetchErr } = await supabase
      .from('crafts')
      .select('*')
      .eq('id', craftId)
      .single()
    if (fetchErr || !craft) {
      return res.status(404).json({ error: 'Craft not found' })
    }

    // ── Return cached if we already have 4 generated images ───────────
    if (Array.isArray(craft.generated_extras) && craft.generated_extras.length >= 4) {
      return res.status(200).json({ urls: craft.generated_extras, cached: true })
    }

    // ── Build 4 prompt variations ────────────────────────────────────
    const base = buildBasePrompt(craft)
    const prompts = [
      `${base}. Professional product photograph, front view, clean studio lighting, neutral background, sharp focus, high resolution catalogue shot.`,
      `${base}. Close-up detail shot showing craftsmanship and texture, soft natural lighting, shallow depth of field.`,
      `${base}. Lifestyle photo placed in a culturally appropriate ${craft.region || 'Indian'} setting, warm natural lighting, tasteful composition.`,
      `${base}. Three-quarter angle product shot, museum-quality lighting, minimal background, fine art photography style.`,
    ]

    // ── Generate in parallel ─────────────────────────────────────────
    const generated = await Promise.all(
      prompts.map((p) => generateAndStore(p, apiKey, craftId)),
    )
    const validUrls = generated.filter(Boolean)

    if (validUrls.length === 0) {
      return res.status(500).json({ error: 'All image generations failed' })
    }

    // ── Save URLs to the craft row ───────────────────────────────────
    await supabase
      .from('crafts')
      .update({ generated_extras: validUrls })
      .eq('id', craftId)

    return res.status(200).json({ urls: validUrls })
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
  return parts.join(', ').slice(0, 700) // DALL-E 3 prompt max ~4000 chars, keep it tight
}

async function generateAndStore(prompt, apiKey, craftId) {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2'
  try {
    // 1) Generate with OpenAI (gpt-image-2 by default; returns base64)
    const aiResp = await fetch('https://api.openai.com/v1/images/generations', {
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
        quality: process.env.OPENAI_IMAGE_QUALITY || 'medium', // low | medium | high
      }),
    })

    if (!aiResp.ok) {
      const errText = await aiResp.text()
      console.warn(`[generate-images] ${model}`, aiResp.status, errText.slice(0, 200))
      return null
    }

    const aiData = await aiResp.json()
    // gpt-image-* models return base64 in `b64_json`. Some older models
    // (DALL-E) may return a `url` instead — handle both for safety.
    let buffer
    const b64 = aiData?.data?.[0]?.b64_json
    const url = aiData?.data?.[0]?.url
    if (b64) {
      buffer = Buffer.from(b64, 'base64')
    } else if (url) {
      const imgResp = await fetch(url)
      if (!imgResp.ok) return null
      buffer = Buffer.from(await imgResp.arrayBuffer())
    } else {
      console.warn('[generate-images] response had no b64_json or url')
      return null
    }

    // 3) Upload to Supabase Storage (so the URL is permanent)
    const filename = `generated/${craftId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`
    const { error: upErr } = await supabase.storage
      .from('craft-images')
      .upload(filename, buffer, { contentType: 'image/png', upsert: false })
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
