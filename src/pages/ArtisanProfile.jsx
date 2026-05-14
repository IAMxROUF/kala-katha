import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCrafts } from '../context/CraftsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import CraftCard from '../components/CraftCard.jsx'
import { Divider, Paisley } from '../components/Decorations.jsx'
import { IconUser } from '../components/Icons.jsx'
import NotFound from './NotFound.jsx'

/**
 * /artisan/:key
 *
 * The `key` is a URL-encoded identifier — phone, user id, or maker name.
 * Profile data: derived from crafts + extras stored in localStorage under
 * `kk.makers` (keyed by the same `key`). Eventually we'll migrate this to
 * a Supabase `makers` table.
 */
const TYPES = [
  { id: 'individual', label: 'Individual Artisan' },
  { id: 'maker',      label: 'Craft Maker' },
  { id: 'community',  label: 'Representing a Craft Community' },
  { id: 'ngo',        label: 'NGO / Cultural Organisation' },
]

function loadExtras(key) {
  try {
    const map = JSON.parse(localStorage.getItem('kk.makers') || '{}')
    return map[key] || {}
  } catch {
    return {}
  }
}

function saveExtras(key, patch) {
  try {
    const map = JSON.parse(localStorage.getItem('kk.makers') || '{}')
    map[key] = { ...(map[key] || {}), ...patch }
    localStorage.setItem('kk.makers', JSON.stringify(map))
  } catch {}
}

export default function ArtisanProfile() {
  const { key } = useParams()
  const decodedKey = decodeURIComponent(key || '')
  const { crafts } = useCrafts()
  const { user } = useAuth()

  // Is this the logged-in user's own profile?
  const isOwnProfile =
    !!user &&
    (user.phone === decodedKey || user.id === decodedKey || user.name === decodedKey)

  // When viewing own profile, match crafts against ALL identifiers
  // (id / phone / name) so we find every craft made on this account,
  // even ones created before we started storing phone in the maker info.
  const identifiers = isOwnProfile
    ? [user?.id, user?.phone, user?.name].filter(Boolean)
    : [decodedKey]

  const myCrafts = useMemo(
    () =>
      crafts.filter((c) => {
        const m = c.maker || {}
        return identifiers.some(
          (key) =>
            (m.phone && m.phone === key) ||
            (m.id && m.id === key) ||
            (m.name && m.name === key),
        )
      }),
    [crafts, identifiers.join('|')],
  )

  const firstMaker = myCrafts[0]?.maker || {}

  // Profile fields — derived + overridden by extras from localStorage
  const [extras, setExtras] = useState(() => loadExtras(decodedKey))
  useEffect(() => {
    setExtras(loadExtras(decodedKey))
  }, [decodedKey])

  // If this is the user's own profile and we don't have saved name/region
  // yet, fall back to their auth name / region so the page shows useful info.
  const fallbackName = isOwnProfile ? user?.name : ''
  const fallbackRegion = isOwnProfile ? user?.region : ''

  const profile = {
    name:    extras.name    || firstMaker.name    || fallbackName || decodedKey || 'Anonymous Artisan',
    region:  extras.region  || firstMaker.region  || fallbackRegion || '',
    type:    extras.type    || 'individual',
    contact: extras.contact || '',
    bio:     extras.bio     || '',
  }

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  useEffect(() => setForm(profile), [extras, firstMaker.name])

  // Only show 404 if there's truly nothing here — no crafts, no saved
  // profile, AND it isn't the current user's own profile.
  if (!myCrafts.length && !extras.name && !isOwnProfile) return <NotFound />

  function handleSave() {
    saveExtras(decodedKey, form)
    setExtras({ ...extras, ...form })
    setEditing(false)
  }

  const typeLabel = TYPES.find((t) => t.id === profile.type)?.label || 'Individual Artisan'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/explore" className="text-sm text-ink-500 hover:text-terracotta-600">
        ← Browse crafts
      </Link>

      <div className="mt-6 paper p-6 sm:p-8 relative overflow-hidden">
        <Paisley
          size={180}
          className="absolute -right-6 -top-6 text-terracotta-200 opacity-30 animate-sway"
        />

        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          <div className="h-20 w-20 rounded-full bg-mustard-200 grid place-content-center font-display text-3xl shrink-0">
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-hand text-xl text-terracotta-500">Artisan profile</p>

            {!editing ? (
              <>
                <h1 className="font-display text-4xl sm:text-5xl leading-tight">
                  {profile.name}
                </h1>
                {profile.region && (
                  <p className="mt-1 text-ink-700">{profile.region}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="chip">
                    <IconUser size={14} className="inline mr-1 -mt-0.5" />
                    {typeLabel}
                  </span>
                  <span className="chip bg-mustard-100 text-mustard-500">
                    {myCrafts.length} {myCrafts.length === 1 ? 'craft' : 'crafts'} documented
                  </span>
                </div>

                {profile.bio && (
                  <p className="mt-4 text-ink-700 leading-relaxed">{profile.bio}</p>
                )}
                {profile.contact && (
                  <p className="mt-3 text-sm text-ink-500">
                    <span className="text-ink-300">Contact:</span> {profile.contact}
                  </p>
                )}

                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-secondary mt-5 text-sm"
                  >
                    Edit my profile
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-4 mt-2">
                <div>
                  <label className="field-label">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Region</label>
                  <input
                    className="input"
                    placeholder="e.g. Bodoland, Assam"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">I am a / an…</label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.id })}
                        className={`text-left rounded-2xl border px-3 py-3 text-sm transition ${
                          form.type === t.id
                            ? 'bg-terracotta-100 border-terracotta-300 text-ink-900'
                            : 'bg-ivory border-ink-300/30 text-ink-700 hover:bg-parchment'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Contact number (optional)</label>
                  <input
                    className="input"
                    placeholder="+91 …"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                  <p className="field-hint">
                    Only shown on your public profile if you choose to share it.
                  </p>
                </div>

                <div>
                  <label className="field-label">A short bio (optional)</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="A few sentences about you and your craft journey."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSave} className="btn-primary">Save</button>
                  <button
                    onClick={() => { setForm(profile); setEditing(false) }}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Divider className="mt-10" />

      <h2 className="mt-8 font-display text-2xl">
        {isOwnProfile ? 'My crafts' : 'Their crafts'}
      </h2>
      <p className="text-sm text-ink-500 mt-1">
        {isOwnProfile
          ? 'Every piece you have documented in the Kalā Kathā archive.'
          : `Every piece documented by ${profile.name} in the Kalā Kathā archive.`}
      </p>

      {myCrafts.length === 0 ? (
        <div className="paper mt-6 p-10 text-center">
          <p className="text-ink-700">
            {isOwnProfile
              ? "You haven't documented any crafts yet."
              : `${profile.name} hasn't documented any crafts yet.`}
          </p>
          {isOwnProfile && (
            <Link to="/document" className="btn-primary mt-4 inline-flex text-sm">
              Document your first craft
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {myCrafts.map((c, i) => (
            <CraftCard
              key={c.id}
              craft={c}
              accent={['terracotta', 'mustard', 'leaf'][i % 3]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
