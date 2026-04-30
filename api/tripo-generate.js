/**
 * POST /api/tripo-generate
 *
 * Receives the artisan's front photo as a base64 data-URL,
 * uploads it to Tripo, starts an image_to_model task,
 * and returns { taskId } for the frontend to poll.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const API_KEY = process.env.TRIPO_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'TRIPO_API_KEY is not configured on the server.' })
  }

  const { imageDataUrl } = req.body || {}

  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
    return res.status(400).json({ error: 'imageDataUrl is required and must be a data-URL' })
  }

  try {
    // ── 1. Decode the base64 image ──────────────────────────────────────────
    const mimeMatch = imageDataUrl.match(/^data:(image\/[\w+]+);base64,/)
    const mimeType  = mimeMatch?.[1] ?? 'image/jpeg'
    const ext       = mimeType.split('/')[1].replace('jpeg', 'jpg')
    const base64    = imageDataUrl.replace(/^data:image\/[\w+]+;base64,/, '')
    const buffer    = Buffer.from(base64, 'base64')

    // ── 2. Upload to Tripo ──────────────────────────────────────────────────
    const formData = new FormData()
    formData.append('file', new Blob([buffer], { type: mimeType }), `craft.${ext}`)

    const uploadRes = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method:  'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body:    formData,
    })

    if (!uploadRes.ok) {
      const msg = await uploadRes.text()
      throw new Error(`Tripo upload failed (${uploadRes.status}): ${msg}`)
    }

    const uploadData = await uploadRes.json()
    const fileToken  = uploadData?.data?.image_token
    if (!fileToken) throw new Error('No image_token in Tripo upload response')

    // ── 3. Create image_to_model task ───────────────────────────────────────
    const taskRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'image_to_model',
        file: { type: ext === 'png' ? 'png' : 'jpg', file_token: fileToken },
      }),
    })

    if (!taskRes.ok) {
      const msg = await taskRes.text()
      throw new Error(`Tripo task creation failed (${taskRes.status}): ${msg}`)
    }

    const taskData = await taskRes.json()
    const taskId   = taskData?.data?.task_id
    if (!taskId) throw new Error('No task_id in Tripo task response')

    return res.status(200).json({ taskId })
  } catch (err) {
    console.error('[api/tripo-generate]', err)
    return res.status(500).json({ error: err.message })
  }
}
