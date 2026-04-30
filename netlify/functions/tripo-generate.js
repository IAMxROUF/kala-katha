/**
 * POST /.netlify/functions/tripo-generate
 *
 * Body: { imageDataUrl: "data:image/jpeg;base64,..." }
 *
 * 1. Converts the data-URL to a binary buffer.
 * 2. Uploads it to Tripo's /upload endpoint (gets a file_token).
 * 3. Creates an image_to_model task (gets a task_id).
 * 4. Returns { taskId } so the frontend can start polling.
 *
 * We deliberately keep this function fast (~1-2 s) and let the frontend
 * poll separately — Netlify free-tier functions have a 10-second timeout.
 */
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const API_KEY = process.env.TRIPO_API_KEY
  if (!API_KEY) {
    return json(500, { error: 'TRIPO_API_KEY is not configured on the server.' })
  }

  let imageDataUrl
  try {
    ;({ imageDataUrl } = JSON.parse(event.body || '{}'))
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
    return json(400, { error: 'imageDataUrl is required and must be a data-URL' })
  }

  try {
    // ── 1. Decode base64 ────────────────────────────────────────────────────
    const mimeMatch = imageDataUrl.match(/^data:(image\/[\w+]+);base64,/)
    const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg')
    const base64 = imageDataUrl.replace(/^data:image\/[\w+]+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    // ── 2. Upload to Tripo ──────────────────────────────────────────────────
    const formData = new FormData()
    formData.append(
      'file',
      new Blob([buffer], { type: mimeType }),
      `craft.${ext}`,
    )

    const uploadRes = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: formData,
    })

    if (!uploadRes.ok) {
      const msg = await uploadRes.text()
      throw new Error(`Tripo upload failed (${uploadRes.status}): ${msg}`)
    }

    const uploadData = await uploadRes.json()
    const fileToken = uploadData?.data?.image_token
    if (!fileToken) throw new Error('No image_token in Tripo upload response')

    // ── 3. Create image_to_model task ───────────────────────────────────────
    const taskRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
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
    const taskId = taskData?.data?.task_id
    if (!taskId) throw new Error('No task_id in Tripo task response')

    return json(200, { taskId })
  } catch (err) {
    console.error('[tripo-generate]', err)
    return json(500, { error: err.message })
  }
}

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}
