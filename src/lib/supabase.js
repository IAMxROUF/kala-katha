// Supabase client — connects the frontend to your Supabase project.
//
// The URL and anon key come from environment variables set in Vercel:
//   VITE_SUPABASE_URL       e.g. https://abcdefg.supabase.co
//   VITE_SUPABASE_ANON_KEY  the long "anon · public" key
//
// When these aren't set (e.g. local preview without env vars), the rest of
// the app falls back to localStorage automatically.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Diagnostic logging (Phase 1 debugging) ──────────────────────────────
// Prints what the build received from Vercel env vars so we can diagnose
// "Invalid API key" errors. Safe to leave in — only prints prefix/length.
if (typeof window !== 'undefined') {
  console.log('[Kalā Kathā] env check →')
  console.log('  VITE_SUPABASE_URL      :', url || '(missing)')
  console.log('  VITE_SUPABASE_ANON_KEY :', anonKey ? `${anonKey.slice(0, 25)}...${anonKey.slice(-10)}` : '(missing)')
  console.log('  anon key length        :', anonKey?.length || 0, '(should be ~220)')
  console.log('  anon key dots          :', (anonKey?.match(/\./g) || []).length, '(should be exactly 2)')
}

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: false },
    })
  : null

// ── Helper: upload a data-URL image to the `craft-images` Storage bucket ──
// Returns the public URL. Falls back to the original data-URL if Storage
// isn't configured or upload fails (so the existing demo flow still works).
export async function uploadImage(dataUrl, opts = {}) {
  if (!isSupabaseConfigured || !dataUrl) return dataUrl
  if (!dataUrl.startsWith('data:')) return dataUrl // already a URL

  try {
    const [meta, b64] = dataUrl.split(',')
    const mime = meta.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
    const ext = mime.split('/')[1] || 'jpg'
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const path = `${opts.folder || 'uploads'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage
      .from('craft-images')
      .upload(path, bytes, { contentType: mime, upsert: false })
    if (error) throw error

    const { data } = supabase.storage.from('craft-images').getPublicUrl(path)
    return data?.publicUrl || dataUrl
  } catch (e) {
    console.warn('[Supabase] image upload failed, keeping data-URL:', e.message)
    return dataUrl
  }
}
