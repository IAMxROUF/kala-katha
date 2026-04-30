/**
 * GET /.netlify/functions/tripo-poll?taskId=task_xxx
 *
 * Returns the current status of a Tripo task.
 * The frontend calls this every 3 s until status === "success" | "failed".
 *
 * Response: {
 *   status:        "queued" | "running" | "success" | "failed" | "cancelled"
 *   progress:      0-100
 *   modelUrl:      string | null   (.glb URL, present when status === "success")
 *   renderedImage: string | null
 * }
 */
export const handler = async (event) => {
  const taskId = event.queryStringParameters?.taskId
  if (!taskId) return json(400, { error: 'taskId query param is required' })

  const API_KEY = process.env.TRIPO_API_KEY
  if (!API_KEY) return json(500, { error: 'TRIPO_API_KEY is not configured' })

  try {
    const res = await fetch(
      `https://api.tripo3d.ai/v2/openapi/task/${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    )

    if (!res.ok) {
      const msg = await res.text()
      throw new Error(`Tripo poll failed (${res.status}): ${msg}`)
    }

    const data = await res.json()
    const { status, output, progress } = data?.data ?? {}

    return json(200, {
      status: status ?? 'unknown',
      progress: typeof progress === 'number' ? progress : 0,
      modelUrl: output?.model ?? null,
      renderedImage: output?.rendered_image ?? null,
    })
  } catch (err) {
    console.error('[tripo-poll]', err)
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
