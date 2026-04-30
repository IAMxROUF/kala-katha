import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { seedCrafts } from '../data/seedCrafts.js'

const CraftsContext = createContext(null)
const STORAGE_KEY = 'kk.crafts'
const DRAFTS_KEY = 'kk.drafts'

function genId(prefix = 'craft') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function CraftsProvider({ children }) {
  const [userCrafts, setUserCrafts] = useState(() => loadJSON(STORAGE_KEY, []))
  const [drafts, setDrafts] = useState(() => loadJSON(DRAFTS_KEY, []))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userCrafts))
  }, [userCrafts])

  useEffect(() => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  }, [drafts])

  // Public catalog: seed + user-published
  const crafts = useMemo(() => [...userCrafts, ...seedCrafts], [userCrafts])

  function getCraft(id) {
    return crafts.find((c) => c.id === id) || drafts.find((d) => d.id === id)
  }

  function publishCraft(payload) {
    const next = {
      id: payload.id || genId('craft'),
      ...payload,
      publishedAt: new Date().toISOString(),
    }
    setUserCrafts((list) => [next, ...list.filter((c) => c.id !== next.id)])
    setDrafts((list) => list.filter((d) => d.id !== next.id))
    return next
  }

  function saveDraft(payload) {
    const id = payload.id || genId('draft')
    const next = { ...payload, id, updatedAt: new Date().toISOString() }
    setDrafts((list) => {
      const existing = list.findIndex((d) => d.id === id)
      if (existing >= 0) {
        const copy = [...list]
        copy[existing] = next
        return copy
      }
      return [next, ...list]
    })
    return next
  }

  function deleteDraft(id) {
    setDrafts((list) => list.filter((d) => d.id !== id))
  }

  function deleteCraft(id) {
    setUserCrafts((list) => list.filter((c) => c.id !== id))
  }

  function craftsByMaker(userId) {
    return userCrafts.filter((c) => c.maker?.id === userId)
  }

  function draftsByMaker(userId) {
    return drafts.filter((d) => d.maker?.id === userId)
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
