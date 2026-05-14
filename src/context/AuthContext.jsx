import { createContext, useContext, useEffect, useState } from 'react'
import { normalizePhone } from '../lib/phone.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'kk.user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  // Demo flow: phone-OTP without a real backend.
  // sendOtp returns immediately. Any 4-digit code verifies.
  function sendOtp(phone) {
    return new Promise((resolve) => setTimeout(() => resolve({ ok: true, phone }), 400))
  }

  function verifyOtp({ phone, otp, name, role = 'explorer', region = '' }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!/^\d{4,6}$/.test(otp)) {
          reject(new Error('Invalid code'))
          return
        }
        const next = {
          id: 'u_' + Math.random().toString(36).slice(2, 9),
          phone: normalizePhone(phone),  // canonical form for cross-channel matching
          name: name || 'Maker',
          role,
          region,
          joinedAt: new Date().toISOString(),
        }
        setUser(next)
        resolve(next)
      }, 400)
    })
  }

  function signOut() {
    setUser(null)
  }

  function updateProfile(patch) {
    setUser((u) => (u ? { ...u, ...patch } : u))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthed: !!user,
        sendOtp,
        verifyOtp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
