/**
 * POST /api/whatsapp-webhook
 *
 * Receives WhatsApp messages from Twilio and runs the conversation flow:
 *   idle → awaiting_photos → awaiting_title → awaiting_craft
 *        → awaiting_region → awaiting_story → published
 *
 * State per phone number is persisted in the `conversations` table.
 * Drafts are stored in the `crafts` table (status='draft') and updated
 * as the user progresses. When they type "publish", status flips to 'published'
 * and they get a link to the live craft page.
 */

import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
}

// ── Server-side Supabase client (uses service_role key) ──────────────────
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null

// ── Conversation states ──────────────────────────────────────────────────
const S = {
  IDLE: 'idle',
  AWAITING_PHOTOS: 'awaiting_photos',
  AWAITING_TITLE: 'awaiting_title',
  AWAITING_CRAFT: 'awaiting_craft',
  AWAITING_REGION: 'awaiting_region',
  AWAITING_STORY: 'awaiting_story',
}

// ────────────────────────────────────────────────────────────────────────
// HANDLER
// ────────────────────────────────────────────────────────────────────────
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
  const text = (body.Body || '').trim()
  const lower = text.toLowerCase()
  const numMedia = parseInt(body.NumMedia || '0', 10)
  const profileName = (body.ProfileName || 'friend').trim()

  console.log('[whatsapp]', { phone, text: text.slice(0, 60), numMedia, profile: profileName })

  try {
    // ── Global commands (work in any state) ────────────────────────────
    if (lower === 'start over' || lower === 'restart' || lower === 'reset') {
      const conv = await loadConv(phone)
      if (conv?.draft_id) await deleteDraft(conv.draft_id)
      await setConv(phone, S.IDLE, null)
      return sendTwiML(res, '🔄 Started fresh.\n\nSend *hi* to begin a new craft.')
    }
    if (lower === 'help') {
      return sendTwiML(res, helpText())
    }

    // ── Handle photos first (they can arrive in any state) ─────────────
    if (numMedia > 0) {
      return await handlePhotos({ res, phone, profileName, body, numMedia })
    }

    // ── State-driven text handling ─────────────────────────────────────
    const conv = await loadConv(phone)
    const state = conv?.state || S.IDLE
    const draftId = conv?.draft_id

    switch (state) {
      case S.IDLE:
        if (['hi', 'hello', 'namaste', 'start', 'hey'].includes(lower)) {
          await setConv(phone, S.AWAITING_PHOTOS, null)
          return sendTwiML(res, greeting(profileName))
        }
        return sendTwiML(res, `🪡 Send *hi* to start documenting a craft!`)

      case S.AWAITING_PHOTOS:
        if (lower === 'done') {
          if (!draftId) {
            return sendTwiML(res, `Send me at least one photo first 📸`)
          }
          await setConv(phone, S.AWAITING_TITLE, draftId)
          return sendTwiML(
            res,
            `Wonderful! ✨\n\n*Step 2 of 4*\n\nWhat's the name of this craft?\n_(e.g. "Fish & Lotus Painting")_`,
          )
        }
        return sendTwiML(
          res,
          `Send a *photo* of your craft 📸\n\nOr type *done* if you've added enough.`,
        )

      case S.AWAITING_TITLE:
        if (!text) return sendTwiML(res, 'Please send the craft name as text.')
        await updateDraft(draftId, { title: text })
        await setConv(phone, S.AWAITING_CRAFT, draftId)
        return sendTwiML(
          res,
          `Lovely.\n\n*Step 3 of 4*\n\nWhat craft tradition is this?\n_(e.g. Madhubani, Warli, Block Print, Kutchi Embroidery)_`,
        )

      case S.AWAITING_CRAFT:
        if (!text) return sendTwiML(res, 'Please send the craft tradition as text.')
        await updateDraft(draftId, { craft: text })
        await setConv(phone, S.AWAITING_REGION, draftId)
        return sendTwiML(
          res,
          `Got it.\n\n*Step 4 of 4*\n\nWhich region or state is this craft from?\n_(e.g. Bihar, Gujarat, Rajasthan)_`,
        )

      case S.AWAITING_REGION:
        if (!text) return sendTwiML(res, 'Please send the region as text.')
        await updateDraft(draftId, { region: text })
        await setConv(phone, S.AWAITING_STORY, draftId)
        return sendTwiML(
          res,
          `Perfect. ✨\n\nNow the most important part — *tell me the story.*\n\nIn your own words: How do you make it? What materials? Who taught you? What does it mean?\n\n_You can send multiple messages. When done, type *publish*._`,
        )

      case S.AWAITING_STORY:
        if (lower === 'publish') {
          const published = await publishDraft(draftId)
          await setConv(phone, S.IDLE, null)
          const url = process.env.PUBLIC_APP_URL || 'https://kala-katha.vercel.app'
          return sendTwiML(
            res,
            `🎉 *Published!*\n\nYour craft "_${published.title || 'Untitled'}_" is now in the Kalā Kathā archive.\n\n👉 ${url}/craft/${published.id}\n\nSend *hi* to document another craft.`,
          )
        }
        if (!text) {
          return sendTwiML(res, 'Tell me more, or type *publish* when you\'re ready.')
        }
        // Append to story
        const current = await getDraft(draftId)
        const newStory = (current?.story || '') + (current?.story ? '\n\n' : '') + text
        await updateDraft(draftId, { story: newStory })
        return sendTwiML(
          res,
          `✍️ Got it. Send more, or type *publish* to add this craft to the archive.`,
        )

      default:
        await setConv(phone, S.IDLE, null)
        return sendTwiML(res, `Let's start fresh. Send *hi* to begin.`)
    }
  } catch (err) {
    console.error('[whatsapp] error:', err)
    return sendTwiML(
      res,
      `😅 Something went wrong on my side. Type *start over* to restart.`,
    )
  }
}

// ────────────────────────────────────────────────────────────────────────
// PHOTO HANDLING
// ────────────────────────────────────────────────────────────────────────
async function handlePhotos({ res, phone, profileName, body, numMedia }) {
  const conv = await loadConv(phone)
  let draftId = conv?.draft_id

  // If they sent photos without saying "hi" first, auto-start the flow
  if (!conv || conv.state === S.IDLE) {
    await setConv(phone, S.AWAITING_PHOTOS, null)
  }

  const newUrls = []
  for (let i = 0; i < numMedia; i++) {
    const twilioUrl = body[`MediaUrl${i}`]
    const mime = body[`MediaContentType${i}`] || 'image/jpeg'
    if (!twilioUrl) continue
    if (!mime.startsWith('image/')) continue // skip audio/video for now

    try {
      const publicUrl = await downloadAndStore(twilioUrl, mime, phone)
      newUrls.push(publicUrl)
    } catch (e) {
      console.error('[whatsapp] photo save failed:', e.message)
    }
  }

  if (newUrls.length === 0) {
    return sendTwiML(res, `Sorry, I couldn't save those photos. Try again?`)
  }

  // Create or update the draft
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

  // Reply
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

async function downloadAndStore(twilioUrl, mime, phone) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const tok = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !tok) throw new Error('Twilio credentials missing')

  const auth = Buffer.from(`${sid}:${tok}`).toString('base64')
  const resp = await fetch(twilioUrl, { headers: { Authorization: `Basic ${auth}` } })
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

// ────────────────────────────────────────────────────────────────────────
// CONVERSATION + DRAFT HELPERS
// ────────────────────────────────────────────────────────────────────────
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
  const { data, error } = await supabase
    .from('crafts')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', draftId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ────────────────────────────────────────────────────────────────────────
// COPY
// ────────────────────────────────────────────────────────────────────────
function greeting(name) {
  return (
    `🪡 *Namaste, ${name}!*\n\n` +
    `Welcome to *Kalā Kathā* — India's living archive of indigenous crafts.\n\n` +
    `Let's document your craft in 4 steps.\n\n` +
    `*Step 1 of 4*\n\nSend me a *photo* of your craft to begin 📸`
  )
}

function helpText() {
  return (
    `*Kalā Kathā Commands*\n\n` +
    `• *hi* — start a new craft\n` +
    `• send a *photo* — add it to your craft\n` +
    `• *done* — finish adding photos\n` +
    `• *publish* — submit to the archive\n` +
    `• *start over* — discard and restart\n` +
    `• *help* — this menu`
  )
}

// ────────────────────────────────────────────────────────────────────────
// TWIML REPLY
// ────────────────────────────────────────────────────────────────────────
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
