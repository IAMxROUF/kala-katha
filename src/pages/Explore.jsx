import { useMemo, useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { useCrafts } from '../context/CraftsContext.jsx'
import CraftCard from '../components/CraftCard.jsx'
import { ALL_CRAFT_TRADITIONS, ALL_REGIONS } from '../data/seedCrafts.js'
import { IconSearch } from '../components/Icons.jsx'
import { Divider } from '../components/Decorations.jsx'

export default function Explore() {
  const { t } = useLang()
  const { crafts } = useCrafts()
  const [q, setQ] = useState('')
  const [region, setRegion] = useState('')
  const [tradition, setTradition] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return crafts.filter((c) => {
      if (region && !(c.region || '').toLowerCase().includes(region.toLowerCase())) return false
      if (tradition && !(c.craft || '').toLowerCase().includes(tradition.toLowerCase())) return false
      if (!term) return true
      const hay = `${c.title} ${c.craft} ${c.region} ${c.maker?.name || ''}`.toLowerCase()
      return hay.includes(term)
    })
  }, [crafts, q, region, tradition])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-hand text-xl text-terracotta-500">{t('explore.title')}</p>
          <h1 className="font-display text-4xl sm:text-5xl">A living archive</h1>
          <p className="mt-2 text-ink-700 max-w-2xl">{t('explore.sub')}</p>
        </div>
      </div>

      <Divider className="mt-6" />

      {/* Filters */}
      <div className="mt-6 paper p-4 sm:p-5 grid gap-3 grid-cols-1 sm:grid-cols-12">
        <div className="sm:col-span-5 relative">
          <IconSearch
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            className="input pl-11"
            placeholder={t('explore.searchPh')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <select
            className="select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">{t('explore.allRegions')}</option>
            {ALL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <select
            className="select"
            value={tradition}
            onChange={(e) => setTradition(e.target.value)}
          >
            <option value="">{t('explore.allCrafts')}</option>
            {ALL_CRAFT_TRADITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1 flex">
          <button
            className="btn-ghost w-full text-sm"
            onClick={() => {
              setQ('')
              setRegion('')
              setTradition('')
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 text-sm text-ink-500">
        Showing <span className="font-medium text-ink-900">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'craft' : 'crafts'}
      </div>

      {filtered.length === 0 ? (
        <div className="paper mt-4 p-10 text-center">
          <p className="font-hand text-2xl text-terracotta-500">{t('explore.empty')}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c, i) => (
            <CraftCard key={c.id} craft={c} accent={['terracotta', 'mustard', 'leaf'][i % 3]} />
          ))}
        </div>
      )}
    </div>
  )
}
