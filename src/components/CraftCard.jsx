import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { Paisley } from './Decorations.jsx'

export default function CraftCard({ craft, accent = 'terracotta' }) {
  const { t } = useLang()
  const cover = craft.images?.[0]
  const accentClass = {
    terracotta: 'before:bg-terracotta-100',
    mustard: 'before:bg-mustard-100',
    leaf: 'before:bg-leaf-200',
  }[accent]

  return (
    <Link
      to={`/craft/${craft.id}`}
      className={`group relative block paper overflow-hidden transition transform hover:-translate-y-1 hover:shadow-soft`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
        {cover ? (
          <img
            src={cover}
            alt={craft.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-300">
            <Paisley size={64} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-900/60 to-transparent" />
        <div className="absolute left-3 top-3 chip text-xs bg-ivory/85">
          {craft.craft}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg leading-tight">{craft.title}</h3>
        <div className="mt-1 text-xs text-ink-500">{craft.region}</div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-ink-700">
            <span className="text-ink-300">{t('explore.makerLabel')} </span>
            <span className="font-medium">{craft.maker?.name || '—'}</span>
          </span>
          <span className="text-xs text-terracotta-500 group-hover:translate-x-0.5 transition">→</span>
        </div>
      </div>
    </Link>
  )
}
