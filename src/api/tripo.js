// Tripo 3D integration — routes through /.netlify/functions/ so the API key
// stays on the server. Falls back to a sample GLB if the functions aren't
// reachable (e.g. plain `npm run dev` without `netlify dev`).

const FUNCTIONS_BASE = '/api'

const FALLBACK_MODELS = [
  'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Avocado/glTF-Binary/Avocado.glb',
  'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
  'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Lantern/glTF-Binary/Lantern.glb',
  'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Duck/glTF-Binary/Duck.glb',
  'https://modelviewer.dev/shared-assets/models/glTF-Sample-Models/2.0/Horse/glTF-Binary/Horse.glb',
]

/**
 * Main entry — called by Step4Processing.
 *
 * @param {{ images: string[], onProgress: (n:number)=>void }} options
 * @returns {Promise<{ url: string, format: 'glb' }>}
 */
export async function generate3DModel({ images = [], onProgress } = {}) {
  const frontImage = images.find(Boolean) // first non-null image

  if (!frontImage) {
    // No image to work with — return a deterministic fallback immediately
    onProgress?.(100)
    return { url: FALLBACK_MODELS[0], format: 'glb' }
  }

  try {
    // ── Step 1: Start the Tripo task ────────────────────────────────────────
    onProgress?.(5)
    const taskId = await startTask(frontImage)
    onProgress?.(10)

    // ── Step 2: Poll until done ─────────────────────────────────────────────
    const modelUrl = await pollUntilDone(taskId, onProgress)
    return { url: modelUrl, format: 'glb' }
  } catch (err) {
    console.warn('[tripo] Falling back to sample model:', err.message)
    onProgress?.(100)
    const idx = (frontImage.length ?? 0) % FALLBACK_MODELS.length
    return { url: FALLBACK_MODELS[idx], format: 'glb' }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function startTask(imageDataUrl) {
  // Resize before sending to keep payload under Netlify's 6 MB limit
  const resized = await resizeImage(imageDataUrl, 1024)

  const res = await fetch(`${FUNCTIONS_BASE}/tripo-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageDataUrl: resized }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `tripo-generate returned ${res.status}`)
  }

  const { taskId } = await res.json()
  if (!taskId) throw new Error('No taskId returned from tripo-generate')
  return taskId
}

/**
 * Polls every 3 seconds for up to TIMEOUT_MS. Reports Tripo's native
 * progress (0-100) through the onProgress callback.
 */
async function pollUntilDone(taskId, onProgress) {
  const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes
  const INTERVAL_MS = 3_000
  const started = Date.now()

  while (Date.now() - started < TIMEOUT_MS) {
    await sleep(INTERVAL_MS)

    const res = await fetch(
      `${FUNCTIONS_BASE}/tripo-poll?taskId=${encodeURIComponent(taskId)}`,
    )

    if (!res.ok) continue // transient network error — keep trying

    const { status, progress, modelUrl } = await res.json()

    // Tripo reports 0-100; we reserve the first 10% for the upload step above.
    const displayProgress = 10 + Math.round((progress ?? 0) * 0.88)
    onProgress?.(Math.min(98, displayProgress))

    if (status === 'success') {
      if (!modelUrl) throw new Error('Tripo returned success but no modelUrl')
      onProgress?.(100)
      return modelUrl
    }

    if (status === 'failed' || status === 'cancelled') {
      throw new Error(`Tripo task ${status}`)
    }

    // status is "queued" or "running" — keep polling
  }

  throw new Error('Tripo task timed out after 3 minutes')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Resize an image data-URL to maxSize×maxSize using a canvas.
 * Returns the resized data-URL (JPEG, quality 0.88).
 * No-ops on the server or if the image is already small enough.
 */
function resizeImage(dataUrl, maxSize) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.onload = () => {
      if (img.width <= maxSize && img.height <= maxSize) {
        resolve(dataUrl)
        return
      }
      const scale = maxSize / Math.max(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.onerror = () => resolve(dataUrl) // can't decode — send original
    img.src = dataUrl
  })
}
