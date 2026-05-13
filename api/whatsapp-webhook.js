/**
 * POST /api/whatsapp-webhook
 *
 * Receives WhatsApp messages from Twilio and runs the conversation flow.
 *
 * Features (Phase 2B+):
 * - Numbered menu choices for craft/region (artisan taps "1", "2", etc.)
 * - Voice note transcription via OpenAI Whisper (any Indian language)
 * - On "publish", OpenAI structures the raw story into English documentation
 * - Falls back gracefully when API keys aren't configured
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
}

// ── Server-side Supabase client (service_role key) ──────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null

// ── Constants ───────────────────────────────────────────────────────────
const S = {
  IDLE: 'idle',
  AWAITING_PHOTOS: 'awaiting_photos',
  AWAITING_TITLE: 'awaiting_title',
  AWAITING_CRAFT: 'awaiting_craft',
  AWAITING_REGION: 'awaiting_region',
  AWAITING_STORY: 'awaiting_story',
}

const CRAFT_OPTIONS = [
  'Madhubani', 'Warli', 'Pattachitra', 'Dhokra',
  'Block Printing', 'Kutchi Embroidery', 'Phulkari',
  'Chikankari', 'Kantha', 'Pashmina Weaving',
  'Bidriware', 'Kalamkari',
]

const REGION_OPTIONS = [
  'Rajasthan', 'Gujarat', 'Bihar', 'Odisha',
  'Maharashtra', 'Chhattisgarh', 'West Bengal',
  'Tamil Nadu', 'Uttar Pradesh', 'Jammu & Kashmir',
  'Madhya Pradesh', 'Andhra Pradesh',
]

// ════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  if (!supabase) {
    console.error('[whatsapp] Supabase env vars missing on server')
    return sendTwiML(res, '😅 Server setup is incomplete. Please contact support.')
  }

  const body = req.body || {}
  const phone = body.From || ''
  const numMedia = parseInt(body.NumMedia || '0', 10)
  const profileName = (body.ProfileName || 'friend').trim()
  let text = (body.Body || '').trim()
  let lower = text.toLowerCase()
  let isVoiceNote = false

  console.log('[whatsapp]', { phone, text: text.slice(0, 60), numMedia })

  try {
    // ── Step 1: If media is audio, transcribe via Whisper ─────────────
    if (numMedia > 0) {
      const firstMime = body.MediaContentType0 || ''
      if (firstMime.startsWith('audio/')) {
        const transcript = await transcribeAudio(body.MediaUrl0, firstMime)
        if (transcript) {
          text = transcript
          lower = text.toLowerCase()
          isVoiceNote = true
          console.log('[whatsapp] transcribed:', text.slice(0, 80))
        } else {
          return sendTwiML(
            res,
            `😅 I couldn't understand the voice note. Please try again or type your message.`,
          )
        }
      } else if (firstMime.startsWith('image/')) {
        return await handlePhotos({ res, phone, profileName, body, numMedia })
      }
    }

    // ── Step 2: Global commands ───────────────────────────────────────
    if (lower === 'start over' || lower === 'restart' || lower === 'reset') {
      const conv = await loadConv(phone)
      if (conv?.draft_id) await deleteDraft(conv.draft_id)
      await setConv(phone, S.IDLE, null)
      return sendTwiML(res, '🔄 Started fresh.\n\nSend *hi* to begin a new craft.')
    }
    if (lower === 'help') {
      return sendTwiML(res, helpText())
    }

    // ── Step 3: State machine ─────────────────────────────────────────
    const conv = await loadConv(phone)
    const state = conv?.state || S.IDLE
    const draftId = conv?.draft_id
    const heardNote = isVoiceNote ? `\n_(I heard: "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}")_\n` : ''

    switch (state) {
      // ─── IDLE ───
      case S.IDLE:
        if (['hi', 'hello', 'namaste', 'start', 'hey'].includes(lower)) {
          await setConv(phone, S.AWAITING_PHOTOS, null)
          return sendTwiML(res, greeting(profileName))
        }
        return sendTwiML(res, `🪡 Send *hi* to start documenting a craft!`)

      // ─── AWAITING_PHOTOS ───
      case S.AWAITING_PHOTOS:
        if (lower === 'done') {
          if (!draftId) return sendTwiML(res, `Send me at least one photo first 📸`)
          await setConv(phone, S.AWAITING_TITLE, draftId)
          return sendTwiML(
            res,
            `Wonderful! ✨\n\n*Step 2 of 4*\n\nWhat's the name of this craft?\n_(e.g. "Fish & Lotus Painting")_\n\n💡 You can type or send a voice note.`,
          )
        }
        return sendTwiML(
          res,
          `Send a *photo* of your craft 📸\n\nOr type *done* if you've added enough.`,
        )

      // ─── AWAITING_TITLE ───
      case S.AWAITING_TITLE:
        if (!text) return sendTwiML(res, 'Please send the craft name.')
        await updateDraft(draftId, { title: text })
        await setConv(phone, S.AWAITING_CRAFT, draftId)
        return sendTwiML(
          res,
          `Lovely.${heardNote}\n*Step 3 of 4*\n\n${craftMenu()}`,
        )

      // ─── AWAITING_CRAFT ───
      case S.AWAITING_CRAFT: {
        if (!text) return sendTwiML(res, 'Please choose a craft tradition.')
        const chosen = parseChoice(text, CRAFT_OPTIONS)
        await updateDraft(draftId, { craft: chosen })
        await setConv(phone, S.AWAITING_REGION, draftId)
        return sendTwiML(
          res,
          `Got it: *${chosen}*.\n\n*Step 4 of 4*\n\n${regionMenu()}`,
        )
      }

      // ─── AWAITING_REGION ───
      case S.AWAITING_REGION: {
        if (!text) return sendTwiML(res, 'Please send the region name.')
        const chosen = parseChoice(text, REGION_OPTIONS)
        await updateDraft(draftId, { region: chosen })
        await setConv(phone, S.AWAITING_STORY, draftId)
        return sendTwiML(
          res,
          `Perfect — *${chosen}*. ✨\n\nNow the most important part:\n\n*Tell me the story of this craft.*\n\nHow do you make it? What materials? Who taught you? What does it mean to you?\n\n💡 Speak in *any language* — Hindi, English, Hinglish, regional — I'll understand. You can send voice notes too!\n\nSend multiple messages if you like. Type *publish* when you're done.`,
        )
      }

      // ─── AWAITING_STORY ───
      case S.AWAITING_STORY: {
        if (lower === 'publish') {
          const published = await publishDraft(draftId)
          await setConv(phone, S.IDLE, null)
          const url = process.env.PUBLIC_APP_URL || 'https://kala-katha.vercel.app'
          return sendTwiML(
            res,
            `🎉 *Published!*\n\nYour craft "_${published.title || 'Untitled'}_" is now in the Kalā Kathā archive.\n\n👉 ${url}/craft/${published.id}\n\n${published._aiNote || ''}Send *hi* to document another craft.`,
          )
        }
        if (!text) {
          return sendTwiML(res, 'Tell me more, or type *publish* when you\'re ready.')
        }
        const current = await getDraft(draftId)
        const newStory = (current?.story || '') + (current?.story ? '\n\n' : '') + text
        await updateDraft(draftId, { story: newStory })
        return sendTwiML(
          res,
          `✍️ Got it.${heardNote}\nSend more, or type *publish* to add this to the archive.`,
        )
      }

      default:
        await setConv(phone, S.IDLE, null)
        return sendTwiML(res, `Let's start fresh. Send *hi* to begin.`)
    }
  } catch (err) {
    console.error('[whatsapp] error:', err)
    return sendTwiML(res, `😅 Something went wrong. Type *start over* to restart.`)
  }
}

// ════════════════════════════════════════════════════════════════════════
// PHOTO HANDLING
// ════════════════════════════════════════════════════════════════════════
async function handlePhotos({ res, phone, profileName, body, numMedia }) {
  const conv = await loadConv(phone)
  let draftId = conv?.draft_id

  if (!conv || conv.state === S.IDLE) {
    await setConv(phone, S.AWAITING_PHOTOS, null)
  }

  const newUrls = []
  for (let i = 0; i < numMedia; i++) {
    const twilioUrl = body[`MediaUrl${i}`]
    const mime = body[`MediaContentType${i}`] || 'image/jpeg'
    if (!twilioUrl || !mime.startsWith('image/')) continue

    try {
      const publicUrl = await downloadAndStoreImage(twilioUrl, mime, phone)
      newUrls.push(publicUrl)
    } catch (e) {
      console.error('[whatsapp] photo save failed:', e.message)
    }
  }

  if (newUrls.length === 0) {
    return sendTwiML(res, `Sorry, I couldn't save those photos. Try again?`)
  }

  if (!draftId) {
    const { data, error } = await supabase
      .from('crafts')
      .insert({
        status: 'draft',
        maker_phone: phone,
        maker_name: profileName,
        images: newUrls,
        last_step: 1,
      })
      .select()
      .single()
    if (error) throw error
    draftId = data.id
    await setConv(phone, S.AWAITING_PHOTOS, draftId)
  } else {
    const { data: existing } = await supabase
      .from('crafts')
      .select('images')
      .eq('id', draftId)
      .single()
    const combined = [...(existing?.images || []), ...newUrls]
    await supabase.from('crafts').update({ images: combined }).eq('id', draftId)
  }

  const { data: latest } = await supabase
    .from('crafts')
    .select('images')
    .eq('id', draftId)
    .single()
  const count = latest?.images?.length || newUrls.length

  return sendTwiML(
    res,
    `📸 Got photo ${count}!\n\nSend more photos, or type *done* to continue.`,
  )
}

async function downloadAndStoreImage(twilioUrl, mime, phone) {
  const auth = twilioAuthHeader()
  const resp = await fetch(twilioUrl, { headers: { Authorization: auth } })
  if (!resp.ok) throw new Error(`Twilio media fetch ${resp.status}`)
  const arr = new Uint8Array(await resp.arrayBuffer())

  const ext = (mime.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '')
  const safePhone = phone.replace(/[^a-z0-9]/gi, '_')
  const path = `whatsapp/${safePhone}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

  const { error } = await supabase.storage
    .from('craft-images')
    .upload(path, arr, { contentType: mime, upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('craft-images').getPublicUrl(path)
  return data?.publicUrl
}

// ════════════════════════════════════════════════════════════════════════
// VOICE NOTE TRANSCRIPTION (OpenAI Whisper)
// ════════════════════════════════════════════════════════════════════════
async function transcribeAudio(twilioAudioUrl, mime) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('[whatsapp] OPENAI_API_KEY missing — cannot transcribe')
    return null
  }
  if (!twilioAudioUrl) return null

  // Download audio from Twilio (requires basic auth)
  const auth = twilioAuthHeader()
  const dl = await fetch(twilioAudioUrl, { headers: { Authorization: auth } })
  if (!dl.ok) throw new Error(`Twilio audio fetch ${dl.status}`)
  const audioBuf = await dl.arrayBuffer()

  // Build multipart form for Whisper
  const ext = (mime.split('/')[1] || 'ogg').split(';')[0]
  const blob = new Blob([audioBuf], { type: mime })
  const form = new FormData()
  form.append('file', blob, `voice.${ext}`)
  form.append('model', 'whisper-1')
  form.append('response_format', 'text')
  // Don't specify language — Whisper auto-detects (Hindi, English, etc.)

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Whisper API ${resp.status}: ${err.slice(0, 200)}`)
  }

  const transcript = (await resp.text()).trim()
  return transcript
}

// ════════════════════════════════════════════════════════════════════════
// AI STRUCTURING ON PUBLISH (OpenAI GPT)
// ════════════════════════════════════════════════════════════════════════
async function structureWithAI(draft) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  if (!draft?.story?.trim()) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const system = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
You receive an artisan's raw story — which may be in Hindi, English, Hinglish, or any Indian language — and produce structured, respectful, English-language craft documentation.
Honor the artisan's voice. Don't invent facts. If something is unclear, use culturally-appropriate general knowledge for that craft tradition.
Return ONLY a valid JSON object.`

  const user = `Document this handcrafted piece for a public cultural archive.

Title: ${draft.title || 'Untitled'}
Craft tradition: ${draft.craft || 'Indian traditional craft'}
Region: ${draft.region || 'India'}

Artisan's raw story (in their own words, possibly mixed languages):
"""
${draft.story}
"""

Return a JSON object with exactly these four keys, all in English:
- "description"  : A warm, 2–3 sentence description that honours the artisan's voice. Mention the craft tradition and region.
- "materials"    : A comma-separated list of the primary materials used.
- "technique"    : One or two sentences describing the making process in plain language.
- "time"         : Estimated time to make one piece (e.g. "3–5 days", "2 weeks").`

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
      max_tokens: 500,
    }),
  })

  if (!resp.ok) {
    console.warn('[whatsapp] OpenAI API error:', resp.status, await resp.text())
    return null
  }

  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    return {
      description: parsed.description || '',
      materials: parsed.materials || '',
      technique: parsed.technique || '',
      time: parsed.time || '',
    }
  } catch {
    return null
  }
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
function twilioAuthHeader() {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const tok = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !tok) throw new Error('Twilio credentials missing')
  return 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64')
}

function parseChoice(input, options) {
  const trimmed = input.trim()
  const num = parseInt(trimmed, 10)
  if (!isNaN(num) && num >= 1 && num <= options.length) {
    return options[num - 1]
  }
  return trimmed
}

function craftMenu() {
  return (
    `Which craft tradition is this?\n\n` +
    CRAFT_OPTIONS.map((c, i) => `${i + 1}. ${c}`).join('\n') +
    `\n\n💡 Reply with a number, or type a different craft name.`
  )
}

function regionMenu() {
  return (
    `Which region or state is this craft from?\n\n` +
    REGION_OPTIONS.map((r, i) => `${i + 1}. ${r}`).join('\n') +
    `\n\n💡 Reply with a number, or type your region.`
  )
}

async function loadConv(phone) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()
  if (error) console.error('[whatsapp] loadConv error:', error.message)
  return data || null
}

async function setConv(phone, state, draftId) {
  const { error } = await supabase
    .from('conversations')
    .upsert(
      { phone, state, draft_id: draftId, updated_at: new Date().toISOString() },
      { onConflict: 'phone' },
    )
  if (error) console.error('[whatsapp] setConv error:', error.message)
}

async function updateDraft(draftId, patch) {
  if (!draftId) return
  const { error } = await supabase.from('crafts').update(patch).eq('id', draftId)
  if (error) console.error('[whatsapp] updateDraft error:', error.message)
}

async function getDraft(draftId) {
  if (!draftId) return null
  const { data } = await supabase.from('crafts').select('*').eq('id', draftId).single()
  return data
}

async function deleteDraft(draftId) {
  if (!draftId) return
  await supabase.from('crafts').delete().eq('id', draftId)
}

async function publishDraft(draftId) {
  // Fetch the current draft
  const draft = await getDraft(draftId)
  if (!draft) throw new Error('Draft not found')

  // Try to structure with AI first
  let aiResult = null
  let aiNote = ''
  try {
    aiResult = await structureWithAI(draft)
    if (aiResult) {
      console.log('[whatsapp] AI structured the documentation')
      aiNote = '🤖 _AI has also added English documentation based on your story._\n\n'
    }
  } catch (e) {
    console.warn('[whatsapp] AI structuring failed:', e.message)
  }

  // Build update payload
  const update = {
    status: 'published',
    published_at: new Date().toISOString(),
  }
  if (aiResult) {
    if (aiResult.description) update.description = aiResult.description
    if (aiResult.materials) update.materials = aiResult.materials
    if (aiResult.technique) update.technique = aiResult.technique
    if (aiResult.time) update.time_to_make = aiResult.time
  }

  const { data, error } = await supabase
    .from('crafts')
    .update(update)
    .eq('id', draftId)
    .select()
    .single()
  if (error) throw error
  return { ...data, _aiNote: aiNote }
}

function greeting(name) {
  return (
    `🪡 *Namaste, ${name}!*\n\n` +
    `Welcome to *Kalā Kathā* — India's living archive of indigenous crafts.\n\n` +
    `Let's document your craft in 4 steps.\n\n` +
    `*Step 1 of 4*\n\nSend me a *photo* of your craft to begin 📸\n\n` +
    `💡 You can send photos, type messages, or send voice notes in *any language*.`
  )
}

function helpText() {
  return (
    `*Kalā Kathā Commands*\n\n` +
    `• *hi* — start a new craft\n` +
    `• send a *photo* — add to your craft\n` +
    `• send a *voice note* — speak in any language!\n` +
    `• *done* — finish adding photos\n` +
    `• *publish* — submit to the archive\n` +
    `• *start over* — discard and restart\n` +
    `• *help* — this menu`
  )
}

function sendTwiML(res, message) {
  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Response><Message>${escapeXml(message)}</Message></Response>`
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  return res.status(200).send(twiml)
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]),
  )
}
