// Craft description via Google Gemini — routes through
// /.netlify/functions/gpt-describe so the API key stays on the server.
// Falls back to heuristic strings when the function isn't reachable
// (e.g. plain `npm run dev` without `netlify dev`).

const FUNCTIONS_BASE = '/api'

/**
 * Turn the artisan's raw story + basic details into structured documentation.
 * Calls the Gemini-backed serverless function.
 *
 * @returns {{ description, materials, technique, time }}
 */
export async function describeCraft({
  rawStory = '',
  productName = '',
  craft = '',
  region = '',
} = {}) {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/gpt-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawStory, productName, craft, region }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `gpt-describe returned ${res.status}`)
    }

    const data = await res.json()

    // Validate we got something usable
    if (!data.description && !data.materials) {
      throw new Error('Gemini returned an empty result')
    }

    return data
  } catch (err) {
    console.warn('[gemini] Falling back to heuristics:', err.message)
    return heuristicDescribe({ rawStory, productName, craft, region })
  }
}

/**
 * Placeholder for future Gemini Imagen / image-generation support.
 * Currently echoes the reference image so the gallery always has content.
 *
 * To enable real image generation, wire a new Netlify function that calls:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict
 * and return the generated image URLs here.
 */
// Returns an empty array now — actual AI image generation happens
// server-side via /api/generate-images (gpt-image-2) once the craft is
// published, NOT here. This used to echo the user's reference photo as a
// "generated image", which caused duplicate thumbnails in the gallery.
export async function generateSupportingImages() {
  return []
}

// ── Offline / fallback heuristics ────────────────────────────────────────────
// Used when the Netlify function is unreachable (local dev without netlify dev,
// or if the Gemini API is temporarily unavailable).

function heuristicDescribe({ rawStory, productName, craft, region }) {
  const cleaned = (rawStory || '').trim()
  const intro = cleaned
    ? cleaned[0].toUpperCase() + cleaned.slice(1)
    : `${productName || 'A piece'} in the ${craft || 'traditional'} craft tradition from ${region || 'India'}.`

  return {
    description: `${intro}${cleaned.endsWith('.') || !cleaned ? '' : '.'} A piece of ${
      craft || 'indigenous craft'
    } from ${region || 'India'}, documented in the maker's own words.`,
    materials: guessMaterials(craft),
    technique: guessTechnique(craft),
    time: guessTime(craft),
  }
}

function guessMaterials(craft = '') {
  const c = craft.toLowerCase()
  if (c.includes('madhubani'))  return 'Handmade paper, natural pigments, bamboo twigs'
  if (c.includes('mirror') || c.includes('kutch')) return 'Cotton cloth, silk thread, abhla mirrors'
  if (c.includes('pattachitra')) return 'Cotton cloth, tamarind gum, mineral pigments'
  if (c.includes('dhokra'))     return 'Beeswax, riverbed clay, scrap brass'
  if (c.includes('block') || c.includes('sanganer')) return 'Cotton, natural dyes, teakwood blocks'
  if (c.includes('warli'))      return 'Rice paste, bamboo stick, cow-dung washed surface'
  if (c.includes('phulkari') || c.includes('embroidery')) return 'Khadi cloth, silk floss thread'
  if (c.includes('chikankari')) return 'Muslin cloth, white cotton thread'
  if (c.includes('kantha'))     return 'Old saris, cotton thread'
  if (c.includes('pashmina') || c.includes('weav')) return 'Pashmina wool, silk warp'
  return '—'
}

function guessTechnique(craft = '') {
  const c = craft.toLowerCase()
  if (c.includes('madhubani'))
    return 'Outlines drawn in lampblack with twigs; colour filled with cotton swabs. Every space is filled with motifs.'
  if (c.includes('mirror') || c.includes('kutch'))
    return 'Counted-thread surface satin stitch; each mirror fixed with herringbone anchors.'
  if (c.includes('pattachitra'))
    return 'Cloth treated with tamarind and chalk; mineral pigments applied, then sealed with resin varnish.'
  if (c.includes('dhokra'))
    return 'Lost-wax casting: wax thread model wrapped in clay, fired, brass poured in.'
  if (c.includes('block') || c.includes('sanganer'))
    return 'Hand-carved teak blocks dipped in dye and stamped onto pre-treated cloth, then steam-set.'
  if (c.includes('warli'))
    return 'Rice paste applied with a chewed bamboo stick on a cow-dung washed surface.'
  return '—'
}

function guessTime(craft = '') {
  const c = craft.toLowerCase()
  if (c.includes('dhokra') || c.includes('pattachitra')) return '7–14 days'
  if (c.includes('mirror') || c.includes('kutch') || c.includes('chikankari')) return '6–10 days'
  if (c.includes('madhubani') || c.includes('kantha')) return '3–5 days'
  if (c.includes('warli') || c.includes('block')) return '1–3 days'
  if (c.includes('pashmina') || c.includes('weav')) return '2–4 weeks'
  return '—'
}
