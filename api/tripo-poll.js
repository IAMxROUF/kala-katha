/**
 * GET /api/tripo-poll?taskId=task_xxx
 *
 * Returns the current status of a Tripo 3D generation task.
 * The frontend calls this every 3 s until status === "success" | "failed".
 *
 * Response: { status, progress, modelUrl, renderedImage }
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const taskId = req.query.taskId
  if (!taskId) {
    return res.status(400).json({ error: 'taskId query param is required' })
  }

  const API_KEY = process.env.TRIPO_API_KEY
  if (!API_KEY) {
    return res.status(500).json({ error: 'TRIPO_API_KEY is not configured' })
  }

  try {
    const response = await fetch(
      `https://api.tripo3d.ai/v2/openapi/task/${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    )

    if (!response.ok) {
      const msg = await response.text()
      throw new Error(`Tripo poll failed (${response.status}): ${msg}`)
    }

    const data = await response.json()
    const { status, output, progress } = data?.data ?? {}

    return res.status(200).json({
      status:        status ?? 'unknown',
      progress:      typeof progress === 'number' ? progress : 0,
      modelUrl:      output?.model          ?? null,
      renderedImage: output?.rendered_image ?? null,
    })
  } catch (err) {
    console.error('[api/tripo-poll]', err)
    return res.status(500).json({ error: err.message })
  }
}
