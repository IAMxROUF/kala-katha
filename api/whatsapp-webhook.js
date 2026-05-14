/**
 * POST /api/whatsapp-webhook
 *
 * Kalā Kathā — WhatsApp craft documentation bot.
 *
 * Flow (7 input steps + AI processing + success):
 *   1. Product name        (free text or voice)
 *   2. Craft tradition     (free text or voice)
 *   3. Region              (free text or voice)
 *   4. Materials           (free text or voice)
 *   5. Technique           (optional — type "Skip" and AI fills)
 *   6. Photos              (1 required, up to 4 total)
 *   7. Story / Details     (free text or voice — context for AI)
 *   → AI processes + publishes → success summary
 *
 * Welcome menu uses real WhatsApp Quick Reply buttons (via Twilio Content
 * Template), with a text fallback if TWILIO_MENU_CONTENT_SID isn't set.
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

// ── Constants ───────────────────────────────────────────────────────────
const MAX_PHOTOS = 4
const MIN_PHOTOS = 1

const S = {
  IDLE: 'idle',
  AWAITING_MENU: 'awaiting_menu',
  AWAITING_PRODUCT_NAME: 'awaiting_product_name',
  AWAITING_CRAFT_NAME: 'awaiting_craft_name',
  AWAITING_REGION: 'awaiting_region',
  AWAITING_MATERIALS: 'awaiting_materials',
  AWAITING_TECHNIQUE: 'awaiting_technique',
  AWAITING_PHOTOS: 'awaiting_photos',
  AWAITING_STORY: 'awaiting_story',
}

const ACTIONS = {
  start:     ['start', 'start new', 'start new documentation', 'begin', 'new'],
  myCrafts:  ['my crafts', 'my documentations', 'my docs', 'archive'],
  how:       ['how it works', 'how', 'info', 'about'],
  help:      ['help', 'help / support', 'support'],
  done:      ['done', 'finished', 'finish', 'next', 'continue'],
  skip:      ['skip', 'no', 'none', '-'],
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
        } else {
          return sendTwiML(res, `😅 I couldn't understand the voice note. Please type instead.`)
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
    if (['hi', 'hello', 'namaste', 'hey'].includes(lower)) {
      const conv = await loadConv(phone)
      await setConv(phone, S.AWAITING_MENU, conv?.draft_id || null)
      return await showWelcomeMenu(res, phone, profileName)
    }

    // ── 3) State machine ───────────────────────────────────────────────
    const conv = await loadConv(phone)
    const state = conv?.state || S.IDLE
    const draftId = conv?.draft_id
    const heard = isVoiceNote ? `\n_(I heard: "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}")_\n` : ''

    switch (state) {
      // ─── IDLE ───
      case S.IDLE:
        await setConv(phone, S.AWAITING_MENU, null)
        return await showWelcomeMenu(res, phone, profileName)

      // ─── MENU ───
      case S.AWAITING_MENU:
        if (matches(lower, ACTIONS.start)) {
          await setConv(phone, S.AWAITING_PRODUCT_NAME, null)
          return sendTwiML(res, step1Prompt())
        }
        if (matches(lower, ACTIONS.myCrafts)) {
          return sendTwiML(res, await myCraftsText(phone))
        }
        if (matches(lower, ACTIONS.how)) {
          return sendTwiML(res, howItWorksText())
        }
        return await showWelcomeMenu(res, phone, profileName, /*retry*/ true)

      // ─── STEP 1: Product Name ───
      case S.AWAITING_PRODUCT_NAME: {
        if (!text) return sendTwiML(res, 'Please send the craft product name.')
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
        await setConv(phone, S.AWAITING_CRAFT_NAME, data.id)
        return sendTwiML(res, step2Prompt(text, heard))
      }

      // ─── STEP 2: Craft Tradition ───
      case S.AWAITING_CRAFT_NAME: {
        if (!text) return sendTwiML(res, 'Please send the craft tradition.')
        await updateDraft(draftId, { craft: text })
        await setConv(phone, S.AWAITING_REGION, draftId)
        return sendTwiML(res, step3Prompt(text, heard))
      }

      // ─── STEP 3: Region ───
      case S.AWAITING_REGION: {
        if (!text) return sendTwiML(res, 'Please send the region.')
        await updateDraft(draftId, { region: text })
        await setConv(phone, S.AWAITING_MATERIALS, draftId)
        return sendTwiML(res, step4Prompt(text, heard))
      }

      // ─── STEP 4: Materials ───
      case S.AWAITING_MATERIALS: {
        if (!text) return sendTwiML(res, 'Please send the materials.')
        await updateDraft(draftId, { materials: text })
        await setConv(phone, S.AWAITING_TECHNIQUE, draftId)
        return sendTwiML(res, step5Prompt(text, heard))
      }

      // ─── STEP 5: Technique (optional) ───
      case S.AWAITING_TECHNIQUE: {
        if (matches(lower, ACTIONS.skip)) {
          // Leave blank — AI will fill on publish
          await setConv(phone, S.AWAITING_PHOTOS, draftId)
          return sendTwiML(res, step6Prompt(/*skipped*/ true))
        }
        if (!text) return sendTwiML(res, 'Type the technique, or send *Skip*.')
        await updateDraft(draftId, { technique: text })
        await setConv(phone, S.AWAITING_PHOTOS, draftId)
        return sendTwiML(res, step6Prompt(false, heard))
      }

      // ─── STEP 6: Photos ───
      case S.AWAITING_PHOTOS:
        if (matches(lower, ACTIONS.done)) {
          if (!draftId) return sendTwiML(res, 'Send at least one photo first 📸')
          const { data: d } = await supabase
            .from('crafts')
            .select('images')
            .eq('id', draftId)
            .single()
          const count = d?.images?.length || 0
          if (count < MIN_PHOTOS) {
            return sendTwiML(
              res,
              `Please send at least *${MIN_PHOTOS} photo* before continuing 📸`,
            )
          }
          await setConv(phone, S.AWAITING_STORY, draftId)
          return sendTwiML(res, step7Prompt(count))
        }
        return sendTwiML(
          res,
          `Send a *photo* 📸 of your craft, or type *Done* when finished.`,
        )

      // ─── STEP 7: Story ───
      case S.AWAITING_STORY: {
        if (matches(lower, ACTIONS.done)) {
          const draft = await getDraft(draftId)
          if (!draft?.story?.trim()) {
            return sendTwiML(
              res,
              `Please share your story first — what does this craft mean to you?\n\nYou can type or send voice notes.`,
            )
          }
          return await processAndPublish({ res, draftId, phone })
        }
        if (!text) return sendTwiML(res, 'Tell me your story, or type *Done* when finished.')

        const current = await getDraft(draftId)
        const combined = (current?.story || '') + (current?.story ? '\n\n' : '') + text
        await updateDraft(draftId, { story: combined })

        const ack = isVoiceNote
          ? `🎤 *Voice note received.*${heard}`
          : `✍️ *Got it.*`
        return sendTwiML(
          res,
          `${ack}\nSend more, or type *Done* when finished.`,
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
  const state = conv?.state
  const draftId = conv?.draft_id

  // Photos only valid in AWAITING_PHOTOS state (step 6)
  if (state !== S.AWAITING_PHOTOS) {
    if (!conv || state === S.IDLE) {
      await setConv(phone, S.AWAITING_MENU, null)
      return sendTwiML(
        res,
        `📸 Lovely photo!\n\nLet's start properly — type *Hi* to see the menu.`,
      )
    }
    if (state === S.AWAITING_MENU) {
      return sendTwiML(res, `Tap *Start New* first, then I'll guide you through the steps.`)
    }
    return sendTwiML(
      res,
      `Photos come at *Step 6 of 7*. Please answer the current question first 🙏`,
    )
  }

  if (!draftId) {
    return sendTwiML(res, `Something went wrong. Type *Start Over* to restart.`)
  }

  // Check current count
  const { data: existing } = await supabase
    .from('crafts')
    .select('images')
    .eq('id', draftId)
    .single()
  const currentCount = existing?.images?.length || 0
  const remaining = MAX_PHOTOS - currentCount

  if (remaining <= 0) {
    return sendTwiML(
      res,
      `📸 You've already added *${MAX_PHOTOS} photos* (the maximum).\n\nType *Done* to continue.`,
    )
  }

  // Save up to remaining slots
  const newUrls = []
  for (let i = 0; i < Math.min(numMedia, remaining); i++) {
    const url = body[`MediaUrl${i}`]
    const mime = body[`MediaContentType${i}`] || 'image/jpeg'
    if (!url || !mime.startsWith('image/')) continue
    try {
      const publicUrl = await downloadAndStoreImage(url, mime, phone)
      newUrls.push(publicUrl)
    } catch (e) {
      console.error('[whatsapp] photo save failed:', e.message)
    }
  }

  if (newUrls.length === 0) {
    return sendTwiML(res, `Sorry, I couldn't save those photos. Try again?`)
  }

  const combined = [...(existing?.images || []), ...newUrls]
  await supabase.from('crafts').update({ images: combined }).eq('id', draftId)

  const total = combined.length
  const left = MAX_PHOTOS - total

  let reply = `📸 *Photo ${total} of ${MAX_PHOTOS} received.*\n\n`
  if (total === 1) {
    reply += `Great — you can add up to *3 more*, or type *Done* to continue.`
  } else if (left > 0) {
    reply += `Send up to *${left} more*, or type *Done* when finished.`
  } else {
    reply += `That's all ${MAX_PHOTOS}. Type *Done* to continue.`
  }
  return sendTwiML(res, reply)
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
// AI STRUCTURING (description + fill-in-blanks for technique/time)
// ════════════════════════════════════════════════════════════════════════
async function structureWithAI(draft) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const system = `You are a specialist in Indian indigenous crafts and cultural heritage documentation.
The artisan has provided structured details about their craft plus a free-form story (in any Indian language).
Your job: produce a polished English description and fill in missing fields.
Honor the artisan's voice. Don't invent facts you can't reasonably infer.
Return ONLY a valid JSON object.`

  const user = `Document this Indian craft.

Product name:    ${draft.title || '(unknown)'}
Craft tradition: ${draft.craft || '(unknown)'}
Region:          ${draft.region || '(unknown)'}
Materials:       ${draft.materials || '(unknown)'}
Technique:       ${draft.technique || '(not provided — please describe based on the tradition)'}

Artisan's story (any language — translate to English in your response):
"""
${draft.story || ''}
"""

Return JSON with EXACTLY these 3 keys (all in English):
- "description" : 2-3 warm sentences honoring the artisan's voice, mentioning the craft, region, and a hint of the story.
- "technique"   : If the artisan provided a technique above, polish it into 1-2 clear English sentences. If empty, describe the typical making process for this craft tradition.
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
      max_tokens: 500,
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
      description: p.description || '',
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

  let ai = null
  try {
    ai = await structureWithAI(draft)
  } catch (e) {
    console.warn('[whatsapp] AI failed:', e.message)
  }

  const update = {
    status: 'published',
    published_at: new Date().toISOString(),
  }
  if (ai) {
    if (ai.description) update.description = ai.description
    if (ai.technique && !draft.technique) update.technique = ai.technique
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
// WELCOME MENU (real buttons via Twilio Content Template, with text fallback)
// ════════════════════════════════════════════════════════════════════════
async function showWelcomeMenu(res, phone, profileName, isRetry = false) {
  const contentSid = process.env.TWILIO_MENU_CONTENT_SID

  if (contentSid) {
    try {
      await twilioApiSend(phone, {
        ContentSid: contentSid,
        ContentVariables: JSON.stringify({ 1: profileName }),
      })
      res.setHeader('Content-Type', 'text/xml; charset=utf-8')
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>')
    } catch (e) {
      console.warn('[whatsapp] interactive menu failed, falling back to text:', e.message)
    }
  }

  const prefix = isRetry ? `I didn't catch that. Please choose one:\n\n` : ''
  return sendTwiML(res, prefix + welcomeMenu(profileName))
}

async function twilioApiSend(to, params = {}) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const tok = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
  if (!sid || !tok) throw new Error('Twilio credentials missing')

  const data = new URLSearchParams({ To: to, From: from, ...params })
  const auth = Buffer.from(`${sid}:${tok}`).toString('base64')

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data,
    },
  )

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Twilio API ${resp.status}: ${err.slice(0, 200)}`)
  }
  return resp.json()
}

// ════════════════════════════════════════════════════════════════════════
// PROMPTS
// ════════════════════════════════════════════════════════════════════════
function welcomeMenu(name) {
  return (
    `👋 *Hello, ${name}!*\n\n` +
    `*Welcome to Kalā Kathā.*\n\n` +
    `I'm your craft documentation assistant.\n\n` +
    `📌 *What would you like to do?*\n\n` +
    `▶️ *Start New* — begin a new documentation\n` +
    `📚 *My Crafts* — see your archive\n` +
    `ℹ️ *How It Works* — learn more\n\n` +
    `_(Reply with one of the words above)_`
  )
}

function step1Prompt() {
  return (
    `Great! We'll document your craft in *7 steps*. ✨\n\n` +
    `*Step 1 of 7* — Craft Product Name\n\n` +
    `What is the *name of your craft product*?\n` +
    `_e.g. "Serja", "Fish & Lotus Painting", "Assamese Xorai"_\n\n` +
    `💡 Type or send a voice note.`
  )
}

function step2Prompt(productName, heard = '') {
  return (
    `Got it: *"${productName}"* ✓${heard}\n` +
    `*Step 2 of 7* — Craft Tradition\n\n` +
    `What is the *craft tradition or category*?\n` +
    `_e.g. "Bodo Traditional Musical Instrument", "Madhubani Painting", "Block Printing"_\n\n` +
    `💡 Type or send a voice note.`
  )
}

function step3Prompt(craft, heard = '') {
  return (
    `Tradition: *${craft}* ✓${heard}\n` +
    `*Step 3 of 7* — Region\n\n` +
    `Which *region or state* is this craft from?\n` +
    `_e.g. "Bodoland, Assam", "Bihar", "Rajasthan"_\n\n` +
    `💡 Type or send a voice note.`
  )
}

function step4Prompt(region, heard = '') {
  return (
    `Region: *${region}* ✓${heard}\n` +
    `*Step 4 of 7* — Materials\n\n` +
    `What *materials* do you use to make this craft?\n` +
    `_e.g. "Bamboo, wood, animal hide, natural fibers"_\n\n` +
    `💡 Type or send a voice note.`
  )
}

function step5Prompt(materials, heard = '') {
  return (
    `Materials: *${materials}* ✓${heard}\n` +
    `*Step 5 of 7* — Technique _(optional)_\n\n` +
    `Briefly, *how is this craft made*? What's the process?\n\n` +
    `💡 You can also type *Skip* and AI will describe this for you.`
  )
}

function step6Prompt(skipped, heard = '') {
  const prefix = skipped
    ? `_(AI will describe the technique for you)_\n\n`
    : `Technique noted ✓${heard}\n`
  return (
    `${prefix}` +
    `*Step 6 of 7* — Photos\n\n` +
    `Please send *photos* of your craft 📸\n\n` +
    `• *1 photo is required*\n` +
    `• Up to *3 more* are optional (4 total max)\n\n` +
    `Type *Done* when finished.`
  )
}

function step7Prompt(photoCount) {
  return (
    `Wonderful! *${photoCount} photo${photoCount > 1 ? 's' : ''} received.* 📸\n\n` +
    `*Step 7 of 7* — Story\n\n` +
    `Tell me the *story* behind this craft. You can *type* or send a *voice note* in any language.\n\n` +
    `🪶 *Please share:*\n` +
    `• Who taught you this craft\n` +
    `• Why it matters to you\n` +
    `• Cultural or family significance\n` +
    `• Any special memories\n\n` +
    `Send multiple messages if you like. Type *Done* when finished.`
  )
}

function successSummary(craft) {
  const url = process.env.PUBLIC_APP_URL || 'https://kala-katha.vercel.app'
  const fields = []
  if (craft.title) fields.push(`🏷️ *Product:* ${craft.title}`)
  if (craft.craft) fields.push(`🎨 *Tradition:* ${craft.craft}`)
  if (craft.region) fields.push(`📍 *Region:* ${craft.region}`)
  if (craft.materials) fields.push(`🪵 *Materials:* ${craft.materials}`)
  if (craft.technique) fields.push(`⚒️ *Technique:* ${craft.technique}`)
  if (craft.time_to_make) fields.push(`⏱️ *Time:* ${craft.time_to_make}`)
  if (craft.description) fields.push(`📖 *Story:* ${craft.description}`)

  return (
    `🎉 *Success!*\n\n` +
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
      `Type *Start New* to document your first one! ✨`
    )
  }

  const list = crafts
    .map((c, i) => `${i + 1}. *${c.title || 'Untitled'}*${c.craft ? ` _(${c.craft})_` : ''}`)
    .join('\n')

  return (
    `📚 *Your Archive — ${crafts.length} craft${crafts.length > 1 ? 's' : ''}*\n\n` +
    list +
    `\n\n👉 See all: ${url}/explore\n\n` +
    `Type *Start New* to document a new craft.`
  )
}

function howItWorksText() {
  return (
    `ℹ️ *How Kalā Kathā Works*\n\n` +
    `In *7 simple steps*, your craft becomes part of India's cultural archive:\n\n` +
    `1️⃣ Product name (e.g. "Serja")\n` +
    `2️⃣ Craft tradition (e.g. "Bodo Musical Instrument")\n` +
    `3️⃣ Region (e.g. "Assam")\n` +
    `4️⃣ Materials used\n` +
    `5️⃣ Technique _(optional — AI can fill)_\n` +
    `6️⃣ Photos _(1 required, up to 4)_\n` +
    `7️⃣ Story behind the craft\n\n` +
    `🎤 _Type or speak in any language — Hindi, English, Hinglish, regional — I'll understand._\n\n` +
    `Type *Start New* to begin!`
  )
}

function helpText() {
  return (
    `❓ *Kalā Kathā — Help*\n\n` +
    `*Main commands:*\n` +
    `• *Hi* — open the menu\n` +
    `• *Start New* — begin a new craft\n` +
    `• *Done* — finish current step\n` +
    `• *Skip* — skip optional steps (only technique)\n` +
    `• *My Crafts* — see your archive\n` +
    `• *Start Over* — discard and restart\n\n` +
    `*Inputs:*\n` +
    `• 📷 Photos — send images directly\n` +
    `• 🎤 Voice notes — speak in any language\n` +
    `• ✍️ Text — type in any language\n\n` +
    `*Stuck?* Type *Start Over* to reset.`
  )
}

// ════════════════════════════════════════════════════════════════════════
// DATABASE HELPERS
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

// ════════════════════════════════════════════════════════════════════════
// TWIML REPLY
// ════════════════════════════════════════════════════════════════════════
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
