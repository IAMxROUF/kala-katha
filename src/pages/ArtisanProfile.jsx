import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCrafts } from '../context/CraftsContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import CraftCard from '../components/CraftCard.jsx'
import { Divider, Paisley } from '../components/Decorations.jsx'
import { IconUser, IconArrow } from '../components/Icons.jsx'
import NotFound from './NotFound.jsx'

/**
 * /artisan/:key
 *
 * Profile page for an artisan. The `key` is URL-encoded — it's whatever
 * identifies the maker (their phone number, demo id, or name slug).
 *
 * Profile data is derived from all crafts the maker has published. If a
 * dedicated maker profile exists in localStorage (`kk.makers`), that
 * overrides/augments the derived data.
 */
export default function ArtisanProfile() {
  const { key } = useParams()
  const decodedKey = decodeURIComponent(key || '')
  const { crafts } = useCrafts()
  const { user } = useAuth()

  // Find all crafts by this maker (match on phone, id, or name)
  const myCrafts = useMemo(
    () =>
      crafts.filter((c) => {
        const m = c.maker || {}
        return (
          (m.phone && m.phone === decodedKey) ||
          (m.id && m.id === decodedKey) ||
          (m.name && m.name === decodedKey)
        )
      }),
    [crafts, decodedKey],
  )

  // Maker profile = first craft's maker info (most recent crafts first)
  const profile = useMemo(() => {
    if (myCrafts.length === 0) return null
    const first = myCrafts[0].maker || {}
    // Try to load extra profile fields from localStorage
    let extra = {}
    try {
      const map = JSON.parse(localStorage.getItem('kk.makers') || '{}')
      extra = map[decodedKey] || {}
    } catch {}
    return {
      name: extra.name || first.name || decodedKey || 'Anonymous Artisan',
      region: extra.region || first.region || '',
      type: extra.type || 'individual', // 'individual' | 'community' | 'ngo'
      contact: extra.contact || '',
      bio: extra.bio || '',
    }
  }, [myCrafts, decodedKey])

  if (!profile) return <NotFound />

  const isOwnProfile =
    user &&
    (user.phone === decodedKey ||
      user.id === decodedKey ||
      user.name === decodedKey)

  const typeLabel = {
    individual: 'Individual Artisan',
    community: 'Representing a Craft Community',
    ngo: 'NGO / Cultural Organisation',
  }[profile.type] || 'Individual Artisan'

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
            <p className="font-hand text-xl text-terracotta-500">Documented by</p>
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
              <Link
                to="/dashboard?editProfile=1"
                className="btn-secondary mt-5 text-sm inline-flex"
              >
                Edit my profile <IconArrow size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <Divider className="mt-10" />

      <h2 className="mt-8 font-display text-2xl">Their crafts</h2>
      <p className="text-sm text-ink-500 mt-1">
        Every piece documented by {profile.name} in the Kalā Kathā archive.
      </p>

      {myCrafts.length === 0 ? (
        <div className="paper mt-6 p-10 text-center">
          <p className="text-ink-700">No crafts yet.</p>
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
