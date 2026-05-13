/**
 * POST /api/whatsapp-webhook
 *
 * Kalā Kathā — WhatsApp craft documentation bot.
 *
 * Flow (5 steps, matches the reference design):
 *   1. Craft name       (free text or voice)
 *   2. Photos           (multiple, then "Done")
 *   3. Details          (free-form: materials, process, region, story)
 *   4. AI processing    (OpenAI extracts structured fields + translates)
 *   5. Success summary  (View / Share / New)
 *
 * Navigation uses typed "action words" that work like buttons:
 *   Start · Done · Next · View · Share · New · Start Over · Help · Hi
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
}

// ── Server-side Supabase client ─────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null

// ── State machine ───────────────────────────────────────────────────────
const S = {
  IDLE: 'idle',
  AWAITING_MENU: 'awaiting_menu',
  AWAITING_NAME: 'awaiting_name',
  AWAITING_PHOTOS: 'awaiting_photos',
  AWAITING_DETAILS: 'awaiting_details',
  PUBLISHED: 'published',
}

// "Buttons" — action words that work like tappable options
const ACTIONS = {
  start:     ['start', 'begin', 'new', 'start new', 'start new documentation', '1'],
  myCrafts:  ['my crafts', 'my docs', 'my documentations', 'archive', '2'],
  how:       ['how', 'how it works', 'info', 'about', '3'],
  help:      ['help', 'support', '4'],
  done:      ['done', 'finished', 'finish'],
  next:      ['next', 'continue', 'proceed', 'go'],
  view:      ['view', 'see', 'open'],
  share:     ['share'],
  startOver: ['start over', 'restart', 'reset', 'cancel'],
}

function matches(input, list) {
  const t = input.toLowerCase().trim()
  return list.some((w) => t === w)
}

// ════════════════════════════════════════════════════════════════════════
// HANDLER
// ════════════════════════════════════════════════════════════════════════
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  if (!supabase) {
    console.error('[whatsapp] Supabase env vars missing')
    return sendTwiML(res, '😅 Server setup incomplete.')
  }

  const body = req.body || {}
  const phone = body.From || ''
  const profileName = (body.ProfileName || 'friend').trim()
  const numMedia = parseInt(body.NumMedia || '0', 10)
  let text = (body.Body || '').trim()
  let lower = text.toLowerCase()
  let isVoiceNote = false

  console.log('[whatsapp]', { phone, text: text.slice(0, 60), numMedia })

  try {
    // ── 1) If audio, transcribe → treat as text ─────────────────────────
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
          return sendTwiML(res, `😅 I couldn't understand the voice note. Please type instead, or try recording again.`)
        }
      } else if (firstMime.startsWith('image/')) {
        return await handlePhotos({ res, phone, profileName, body, numMedia })
      }
    }

    // ── 2) Global commands ─────────────────────────────────────────────
    if (matches(lower, ACTIONS.startOver)) {
      const conv = await loadConv(phone)
      if (conv?.draft_id) await deleteDraft(conv.draft_id)
      await setConv(phone, S.IDLE, null)
      return sendTwiML(res, `🔄 Started fresh.\n\nType *Hi* to begin.`)
    }
    if (matches(lower, ACTIONS.help)) {
      return sendTwiML(res, helpText())
    }

    // "Hi" anywhere reopens the menu (preserves draft if mid-flow)
    if (['hi', 'hello', 'namaste', 'hey'].includes(lower)) {
      const conv = await loadConv(phone)
      await setConv(phone, S.AWAITING_MENU, conv?.draft_id || null)
      return sendTwiML(res, welcomeMenu(profileName))
    }

    // ── 3) State machine ───────────────────────────────────────────────
    const conv = await loadConv(phone)
    const state = conv?.state || S.IDLE
    const draftId = conv?.draft_id

    switch (state) {
      // ─── IDLE ───
      case S.IDLE:
        await setConv(phone, S.AWAITING_MENU, null)
        return sendTwiML(res, welcomeMenu(profileName))

      // ─── MENU ───
      case S.AWAITING_MENU:
        if (matches(lower, ACTIONS.start)) {
          await setConv(phone, S.AWAITING_NAME, null)
          return sendTwiML(res, step1Prompt())
        }
        if (matches(lower, ACTIONS.myCrafts)) {
          return sendTwiML(res, await myCraftsText(phone))
        }
        if (matches(lower, ACTIONS.how)) {
          return sendTwiML(res, howItWorksText())
        }
        return sendTwiML(
          res,
          `I didn't catch that. Reply with:\n\n` +
            `▶️ *Start* — begin documentation\n` +
            `📚 *My Crafts* — see archive\n` +
            `ℹ️ *Info* — how it works\n` +
            `❓ *Help* — get support`,
        )

      // ─── STEP 1: Name ───
      case S.AWAITING_NAME: {
        if (!text) return sendTwiML(res, 'Please send the craft name.')
        // Create draft now (so we have a draftId for next steps)
        const heardNote = isVoiceNote ? `\n_(I heard: "${text}")_\n` : ''
        const { data, error } = await supabase
          .from('crafts')
          .insert({
            status: 'draft',
            maker_phone: phone,
            maker_name: profileName,
            title: text,
            last_step: 1,
          })
          .select()
          .single()
        if (error) throw error
        await setConv(phone, S.AWAITING_PHOTOS, data.id)
        return sendTwiML(res, step2Prompt(text, heardNote))
      }

      // ─── STEP 2: Photos ───
      case S.AWAITING_PHOTOS:
        if (matches(lower, ACTIONS.done)) {
          if (!draftId) return sendTwiML(res, 'Send at least one photo first 📸')
          const { data: d } = await supabase
            .from('crafts')
            .select('images')
            .eq('id', draftId)
            .single()
          if (!d?.images?.length) {
            return sendTwiML(res, `Please send at least one photo before continuing 📸`)
          }
          await setConv(phone, S.AWAITING_DETAILS, draftId)
          return sendTwiML(res, step3Prompt(d.images.length))
        }
        return sendTwiML(
          res,
          `Send a *photo* 📸 of your craft, or type *Done* if you've added enough.`,
        )

      // ─── STEP 3: Details (free-form) ───
      case S.AWAITING_DETAILS: {
        if (matches(lower, ACTIONS.next)) {
          // Check there's actually something to process
          const draft = await getDraft(draftId)
          if (!draft?.story?.trim()) {
            return sendTwiML(
              res,
              `Please share some details first — materials, process, story.\n\nYou can type or send voice notes in any language.`,
            )
          }
          // Process + publish
          return await processAndPublish({ res, draftId, phone })
        }
        if (!text) return sendTwiML(res, 'Tell me about your craft, or type *Next* to continue.')

        // Append to the running "story" field
        const current = await getDraft(draftId)
        const combined = (current?.story || '') + (current?.story ? '\n\n' : '') + text
        await updateDraft(draftId, { story: combined })

        const ack = isVoiceNote
          ? `🎤 *Voice note received.*\n_(I heard: "${text.slice(0, 100)}${text.length > 100 ? '…' : ''}")_\n`
          : `✍️ *Got it.*`
        return sendTwiML(
          res,
          `${ack}\n\nSend more details if you like (voice or text), or type *Next* when you're ready.`,
        )
      }

      default:
        await setConv(phone, S.IDLE, null)
        return sendTwiML(res, `Let's start fresh. Type *Hi* to begin.`)
    }
  } catch (err) {
    console.error('[whatsapp] error:', err)
    return sendTwiML(res, `😅 Something went wrong. Type *Start Over* to restart.`)
  }
}

// ════════════════════════════════════════════════════════════════════════
// PHOTO HANDLING
// ════════════════════════════════════════════════════════════════════════
async function handlePhotos({ res, phone, profileName, body, numMedia }) {
  const conv = await loadConv(phone)
  let draftId = conv?.draft_id

  // Only accept photos when we're in the photos step (or auto-advance if not started)
  if (conv?.state !== S.AWAITING_PHOTOS) {
    // If they sent a photo before naming the craft, gently redirect
    if (!conv || conv.state === S.IDLE) {
      await setConv(phone, S.AWAITING_MENU, null)
      return sendTwiML(
        res,
        `📸 Lovely photo!\n\nLet's start properly. Type *Hi* to see the menu, then *Start* to begin.`,
      )
    }
    if (conv.state === S.AWAITING_MENU) {
      return sendTwiML(res, `Type *Start* to begin documentation, then I'll ask for photos.`)
    }
    if (conv.state === S.AWAITING_NAME) {
      return sendTwiML(res, `Please tell me the *name* of your craft first (as text or voice).`)
    }
    if (conv.state === S.AWAITING_DETAILS) {
      return sendTwiML(
        res,
        `You're past the photo step. Type *Start Over* if you want to add more photos.`,
      )
    }
  }

  // Save each photo
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

  // Add to existing draft images
  const { data: existing } = await supabase
    .from('crafts')
    .select('images')
    .eq('id', draftId)
    .single()
  const combined = [...(existing?.images || []), ...newUrls]
  await supabase.from('crafts').update({ images: combined }).eq('id', draftId)

  const count = combined.length
  return sendTwiML(
    res,
    `📸 *Photo ${count} received.*\n\nSend more photos if you'd like, or type *Done* when finished.`,
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
// VOICE NOTE TRANSCRIPTION (Whisper)
// ════════════════════════════════════════════════════════════════════════
async function transcribeAudio(twilioAudioUrl, mime) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !twilioAudioUrl) return null

  const auth = twilioAuthHeader()
  const dl = await fetch(twilioAudioUrl, { headers: { Authorization: auth } })
  if (!dl.ok) throw new Error(`Twilio audio fetch ${dl.status}`)
  const audioBuf = await dl.arrayBuffer()

  const ext = (mime.split('/')[1] || 'ogg').split(';')[0]
  const blob = new Blob([audioBuf], { type: mime })
  const form = new FormData()
  form.append('file', blob, `voice.${ext}`)
  form.append('model', 'whisper-1')
  form.append('response_format', 'text')

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Whisper ${resp.status}: ${err.slice(0, 200)}`)
  }
  return (await resp.text()).trim()
}

// ════════════════════════════════════════════════════════════════════════
// AI STRUCTURING (extracts craft, region, materials, technique, time, description)
// ════════════════════════════════════════════════════════════════════════
async function structureWithAI(draft) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !draft?.story?.trim()) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const system = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
An artisan has shared their craft's name and free-form details in any language (Hindi, English, Hinglish, regional Indian languages).
Extract structured fields, translate to English, and write polished documentation that honors the artisan's voice.
Don't invent facts. If something isn't stated, infer from the craft tradition's general knowledge or leave it general.
Return ONLY a valid JSON object.`

  const user = `Document this Indian craft for a public cultural archive.

Craft name: ${draft.title || 'Untitled'}

Artisan's free-form details (any language):
"""
${draft.story}
"""

Return a JSON object with EXACTLY these 6 keys, all in English:
- "craft"       : The craft tradition or category (e.g. "Madhubani", "Warli Painting", "Bamboo Craft", "Traditional Wind Instrument")
- "region"      : The Indian state or region. If not mentioned, leave as empty string ""
- "description" : A warm 2-3 sentence English description honoring the artisan's voice
- "materials"   : Comma-separated list of primary materials
- "technique"   : 1-2 sentences describing the making process
- "time"        : Estimated time to make one piece (e.g. "3-5 days", "2 weeks")`

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
    console.warn('[whatsapp] OpenAI error:', resp.status, await resp.text())
    return null
  }
  const data = await resp.json()
  const txt = data?.choices?.[0]?.message?.content
  if (!txt) return null

  try {
    const p = JSON.parse(txt)
    return {
      craft: p.craft || '',
      region: p.region || '',
      description: p.description || '',
      materials: p.materials || '',
      technique: p.technique || '',
      time: p.time || '',
    }
  } catch {
    return null
  }
}

// ════════════════════════════════════════════════════════════════════════
// PROCESS + PUBLISH
// ════════════════════════════════════════════════════════════════════════
async function processAndPublish({ res, draftId, phone }) {
  const draft = await getDraft(draftId)
  if (!draft) throw new Error('Draft not found')

  // Run AI structuring
  let ai = null
  try {
    ai = await structureWithAI(draft)
  } catch (e) {
    console.warn('[whatsapp] AI failed:', e.message)
  }

  // Build update
  const update = {
    status: 'published',
    published_at: new Date().toISOString(),
  }
  if (ai) {
    if (ai.craft) update.craft = ai.craft
    if (ai.region) update.region = ai.region
    if (ai.description) update.description = ai.description
    if (ai.materials) update.materials = ai.materials
    if (ai.technique) update.technique = ai.technique
    if (ai.time) update.time_to_make = ai.time
  }

  const { data: published, error } = await supabase
    .from('crafts')
    .update(update)
    .eq('id', draftId)
    .select()
    .single()
  if (error) throw error

  await setConv(phone, S.IDLE, null)

  return sendTwiML(res, successSummary(published))
}

// ════════════════════════════════════════════════════════════════════════
// COPY / PROMPTS
// ════════════════════════════════════════════════════════════════════════
function welcomeMenu(name) {
  return (
    `👋 *Hello, ${name}!*\n\n` +
    `*Welcome to Kalā Kathā.*\n\n` +
    `I'm your craft documentation assistant. I'll help you preserve and share your craft story.\n\n` +
    `📌 *What would you like to do?*\n\n` +
    `▶️ *Start* — begin a new documentation\n` +
    `📚 *My Crafts* — see your archive\n` +
    `ℹ️ *Info* — how it works\n` +
    `❓ *Help* — support\n\n` +
    `_(Reply with one of the words above)_`
  )
}

function step1Prompt() {
  return (
    `Great! We'll go through *5 simple steps* to document your craft. ✨\n\n` +
    `*Step 1 of 5* — Craft Name\n\n` +
    `Please tell me the *name* of your craft.\n\n` +
    `💡 _You can type or send a voice note in any language._`
  )
}

function step2Prompt(name, heardNote = '') {
  return (
    `Lovely — *"${name}"*.${heardNote}\n` +
    `*Step 2 of 5* — Photos\n\n` +
    `Please send *photos* of your craft 📸\n\n` +
    `You can send multiple — of the finished piece, tools, materials, or you making it.\n\n` +
    `Type *Done* when you've sent enough.`
  )
}

function step3Prompt(photoCount) {
  return (
    `Wonderful! *${photoCount} photo${photoCount > 1 ? 's' : ''} received.* 📸\n\n` +
    `*Step 3 of 5* — Details\n\n` +
    `Please tell me about your craft. You can type or send voice notes in *any language*.\n\n` +
    `🪶 *Please share:*\n` +
    `• Materials you use\n` +
    `• How you make it\n` +
    `• Where you're from / region\n` +
    `• Who taught you\n` +
    `• The story behind it\n` +
    `• Anything special about your craft\n\n` +
    `Send multiple messages if you like. When finished, type *Next*.`
  )
}

function successSummary(craft) {
  const url = process.env.PUBLIC_APP_URL || 'https://kala-katha.vercel.app'
  const fields = []
  if (craft.title) fields.push(`🏷️ *Name:* ${craft.title}`)
  if (craft.craft) fields.push(`🎨 *Tradition:* ${craft.craft}`)
  if (craft.region) fields.push(`📍 *Region:* ${craft.region}`)
  if (craft.materials) fields.push(`🪵 *Materials:* ${craft.materials}`)
  if (craft.technique) fields.push(`⚒️ *Process:* ${craft.technique}`)
  if (craft.time_to_make) fields.push(`⏱️ *Time:* ${craft.time_to_make}`)
  if (craft.description) fields.push(`📖 *Story:* ${craft.description}`)

  return (
    `*Step 5 of 5* — Success! 🎉\n\n` +
    `Your craft has been documented successfully.\n\n` +
    `━━━━━ *Summary* ━━━━━\n\n` +
    fields.join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━\n\n` +
    `📌 *What's next?*\n\n` +
    `👁️ *View* — see your craft on the website\n` +
    `📤 *Share* — get a shareable link\n` +
    `▶️ *New* — document another craft\n\n` +
    `🔗 ${url}/craft/${craft.id}\n\n` +
    `🙏 _Thank you for preserving your craft with us._`
  )
}

async function myCraftsText(phone) {
  const { data: crafts } = await supabase
    .from('crafts')
    .select('id, title, craft, region, published_at')
    .eq('maker_phone', phone)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  const url = process.env.PUBLIC_APP_URL || 'https://kala-katha.vercel.app'
  if (!crafts || crafts.length === 0) {
    return (
      `📚 *Your Archive*\n\n` +
      `You haven't documented any crafts yet.\n\n` +
      `Type *Start* to document your first one! ✨`
    )
  }

  const list = crafts
    .map((c, i) => `${i + 1}. *${c.title || 'Untitled'}*${c.craft ? ` _(${c.craft})_` : ''}`)
    .join('\n')

  return (
    `📚 *Your Archive — ${crafts.length} craft${crafts.length > 1 ? 's' : ''}*\n\n` +
    list +
    `\n\n👉 See all: ${url}/explore\n\n` +
    `Type *Start* to document a new craft.`
  )
}

function howItWorksText() {
  return (
    `ℹ️ *How Kalā Kathā Works*\n\n` +
    `In just 5 steps, your craft becomes part of India's cultural archive:\n\n` +
    `1️⃣ *Name* — Tell me what your craft is called\n` +
    `2️⃣ *Photos* — Send pictures of your craft\n` +
    `3️⃣ *Details* — Share materials, process, and story (in any language, type or voice)\n` +
    `4️⃣ *AI Magic* — I'll structure your story into English documentation\n` +
    `5️⃣ *Live* — Your craft is published online forever\n\n` +
    `🎤 _You can speak in Hindi, English, Hinglish, or any Indian language — I'll understand._\n\n` +
    `Type *Start* to begin!`
  )
}

function helpText() {
  return (
    `❓ *Kalā Kathā — Help*\n\n` +
    `*Main commands:*\n` +
    `• *Hi* — open the menu\n` +
    `• *Start* — begin a new craft\n` +
    `• *Done* — finish adding photos\n` +
    `• *Next* — proceed to processing\n` +
    `• *My Crafts* — see your archive\n` +
    `• *Start Over* — discard and restart\n\n` +
    `*Inputs:*\n` +
    `• 📷 Photos — send images directly\n` +
    `• 🎤 Voice notes — speak in any language\n` +
    `• ✍️ Text — type in any language\n\n` +
    `*Trouble?* Type *Start Over* to reset.`
  )
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

async function loadConv(phone) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('phone', phone)
    .maybeSingle()
  if (error) console.error('[whatsapp] loadConv:', error.message)
  return data || null
}

async function setConv(phone, state, draftId) {
  const { error } = await supabase
    .from('conversations')
    .upsert(
      { phone, state, draft_id: draftId, updated_at: new Date().toISOString() },
      { onConflict: 'phone' },
    )
  if (error) console.error('[whatsapp] setConv:', error.message)
}

async function updateDraft(draftId, patch) {
  if (!draftId) return
  const { error } = await supabase.from('crafts').update(patch).eq('id', draftId)
  if (error) console.error('[whatsapp] updateDraft:', error.message)
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
