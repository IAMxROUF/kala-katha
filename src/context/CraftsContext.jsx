import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured, uploadImage } from '../lib/supabase.js'

const CraftsContext = createContext(null)
const STORAGE_KEY = 'kk.crafts'
const DRAFTS_KEY = 'kk.drafts'

// Generates a proper UUID v4 — Supabase's `id` column is `uuid` type
// so the value must match xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.
function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for very old browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// ── Map a Supabase row → frontend craft shape ────────────────────────────
function fromRow(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title || '',
    craft: row.craft || '',
    region: row.region || '',
    maker: {
      id: row.maker_phone || '',
      name: row.maker_name || '',
      phone: row.maker_phone || '',
      region: row.maker_region || '',
    },
    images: Array.isArray(row.images) ? row.images : [],
    story: row.story || '',
    description: row.description || '',
    materials: row.materials || '',
    technique: row.technique || '',
    time: row.time_to_make || '',
    modelSrc: row.model_src || '',
    generatedExtras: Array.isArray(row.generated_extras) ? row.generated_extras : [],
    lastStep: row.last_step || 1,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    status: row.status,
  }
}

// ── Map a frontend craft → Supabase row shape ────────────────────────────
function toRow(craft) {
  return {
    id: craft.id,
    title: craft.title || '',
    craft: craft.craft || '',
    region: craft.region || '',
    maker_name: craft.maker?.name || '',
    maker_phone: craft.maker?.phone || craft.maker?.id || '',
    maker_region: craft.maker?.region || '',
    images: (craft.images || []).filter(Boolean),
    story: craft.story || '',
    description: craft.description || '',
    materials: craft.materials || '',
    technique: craft.technique || '',
    time_to_make: craft.time || '',
    model_src: craft.modelSrc || '',
    generated_extras: craft.generatedExtras || [],
    last_step: craft.lastStep || 1,
  }
}

export function CraftsProvider({ children }) {
  // Local state (also used as offline cache)
  const [userCrafts, setUserCrafts] = useState(() => loadJSON(STORAGE_KEY, []))
  const [drafts, setDrafts] = useState(() => loadJSON(DRAFTS_KEY, []))

  // Hydrate from Supabase on first mount
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    ;(async () => {
      try {
        const { data: pub, error: pubErr } = await supabase
          .from('crafts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
        if (pubErr) throw pubErr

        const { data: drf, error: drfErr } = await supabase
          .from('crafts')
          .select('*')
          .eq('status', 'draft')
          .order('updated_at', { ascending: false })
        if (drfErr) throw drfErr

        if (!alive) return
        setUserCrafts((pub || []).map(fromRow))
        setDrafts((drf || []).map(fromRow))
      } catch (e) {
        console.warn('[Supabase] failed to fetch crafts:', e.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Persist local cache (offline fallback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userCrafts))
  }, [userCrafts])

  useEffect(() => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  }, [drafts])

  // Public catalog: only user-published crafts (no seed data)
  const crafts = useMemo(() => [...userCrafts], [userCrafts])

  function getCraft(id) {
    return crafts.find((c) => c.id === id) || drafts.find((d) => d.id === id)
  }

  // ── Helper: upload any data-URL images, return craft with URL images ────
  async function uploadImagesIfNeeded(craft) {
    if (!isSupabaseConfigured) return craft
    const uploaded = await Promise.all(
      (craft.images || []).map((img) => (img ? uploadImage(img, { folder: 'crafts' }) : null)),
    )
    return { ...craft, images: uploaded }
  }

  async function publishCraft(payload) {
    const id = payload.id || genId('craft')
    const withUploads = await uploadImagesIfNeeded({ ...payload, id })
    const next = {
      ...withUploads,
      id,
      publishedAt: new Date().toISOString(),
    }

    // Optimistic local update
    setUserCrafts((list) => [next, ...list.filter((c) => c.id !== next.id)])
    setDrafts((list) => list.filter((d) => d.id !== next.id))

    // Persist to Supabase
    if (isSupabaseConfigured) {
      const row = { ...toRow(next), status: 'published', published_at: next.publishedAt }
      const { error } = await supabase.from('crafts').upsert(row, { onConflict: 'id' })
      if (error) console.warn('[Supabase] publishCraft failed:', error.message)
    }
    return next
  }

  async function saveDraft(payload) {
    const id = payload.id || genId('draft')
    const withUploads = await uploadImagesIfNeeded({ ...payload, id })
    const next = { ...withUploads, id, updatedAt: new Date().toISOString() }

    setDrafts((list) => {
      const existing = list.findIndex((d) => d.id === id)
      if (existing >= 0) {
        const copy = [...list]
        copy[existing] = next
        return copy
      }
      return [next, ...list]
    })

    if (isSupabaseConfigured) {
      const row = { ...toRow(next), status: 'draft' }
      const { error } = await supabase.from('crafts').upsert(row, { onConflict: 'id' })
      if (error) console.warn('[Supabase] saveDraft failed:', error.message)
    }
    return next
  }

  async function deleteDraft(id) {
    setDrafts((list) => list.filter((d) => d.id !== id))
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('crafts').delete().eq('id', id)
      if (error) console.warn('[Supabase] deleteDraft failed:', error.message)
    }
  }

  async function deleteCraft(id) {
    setUserCrafts((list) => list.filter((c) => c.id !== id))
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('crafts').delete().eq('id', id)
      if (error) console.warn('[Supabase] deleteCraft failed:', error.message)
    }
  }

  function craftsByMaker(userId) {
    return userCrafts.filter((c) => c.maker?.id === userId || c.maker?.phone === userId)
  }

  function draftsByMaker(userId) {
    return drafts.filter((d) => d.maker?.id === userId || d.maker?.phone === userId)
  }

  return (
    <CraftsContext.Provider
      value={{
        crafts,
        userCrafts,
        drafts,
        getCraft,
        publishCraft,
        saveDraft,
        deleteDraft,
        deleteCraft,
        craftsByMaker,
        draftsByMaker,
      }}
    >
      {children}
    </CraftsContext.Provider>
  )
}

export function useCrafts() {
  const ctx = useContext(CraftsContext)
  if (!ctx) throw new Error('useCrafts must be used within CraftsProvider')
  return ctx
}
