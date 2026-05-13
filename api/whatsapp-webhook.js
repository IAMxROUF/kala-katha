/**
 * POST /api/whatsapp-webhook
 *
 * Receives WhatsApp messages from Twilio.
 * Twilio sends form-encoded POST requests to this URL whenever someone
 * messages your WhatsApp number.
 *
 * Phase 2A: simple echo bot — responds to a few keywords.
 * Phase 2B: full conversation state machine for craft documentation.
 * Phase 2C: triggers AI pipeline + replies with link to published craft.
 *
 * Reply format: TwiML (Twilio Markup Language) — XML that Twilio interprets
 * to send the WhatsApp message back to the sender.
 */

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  // Twilio sends application/x-www-form-urlencoded — Vercel auto-parses it
  const body = req.body || {}
  const fromNumber = body.From || ''             // 'whatsapp:+919876543210'
  const messageText = (body.Body || '').trim()
  const numMedia = parseInt(body.NumMedia || '0', 10)
  const mediaUrl = body.MediaUrl0 || ''
  const profileName = body.ProfileName || ''

  console.log('[whatsapp]', {
    from: fromNumber,
    name: profileName,
    text: messageText,
    media: numMedia,
  })

  // ── Build a reply based on what the user sent ─────────────────────────
  const lower = messageText.toLowerCase()
  let reply = ''

  if (numMedia > 0) {
    reply =
      `📸 *Got your photo!*\n\n` +
      `Thanks ${profileName || 'friend'}! In a few steps we'll turn this into a beautiful craft archive entry.\n\n` +
      `_(Phase 2A echo bot — full WhatsApp flow coming in Phase 2B!)_`
  } else if (lower === 'hi' || lower === 'hello' || lower === 'namaste' || lower === 'start') {
    reply =
      `🪡 *Namaste${profileName ? ', ' + profileName : ''}!*\n\n` +
      `Welcome to *Kalā Kathā* — India's living archive of indigenous crafts.\n\n` +
      `Send a *photo* of your craft to begin documenting it.\n\n` +
      `Type *help* anytime for commands.`
  } else if (lower === 'help') {
    reply =
      `*Kalā Kathā — Commands*\n\n` +
      `• *hi* — start a new craft\n` +
      `• send a *photo* — add it to your craft\n` +
      `• *done* — finish adding photos\n` +
      `• *publish* — submit to the archive\n` +
      `• *help* — this menu`
  } else if (!messageText) {
    reply = `I didn't catch that. Type *help* to see what I can do.`
  } else {
    reply =
      `You said: "${messageText}"\n\n` +
      `_(Phase 2A echo bot — I'm not smart yet! Type *hi* to start.)_`
  }

  // ── Send the reply via TwiML ──────────────────────────────────────────
  const twiml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Response>\n` +
    `  <Message>${escapeXml(reply)}</Message>\n` +
    `</Response>`

  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  return res.status(200).send(twiml)
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]),
  )
}
