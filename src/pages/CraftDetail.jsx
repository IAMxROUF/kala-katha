import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCrafts } from '../context/CraftsContext.jsx'
import { useLang } from '../context/LanguageContext.jsx'
import ModelViewer from '../components/ModelViewer.jsx'
import { Divider, Paisley } from '../components/Decorations.jsx'
import { IconAR, IconCube } from '../components/Icons.jsx'
import NotFound from './NotFound.jsx'

export default function CraftDetail() {
  const { id } = useParams()
  const { getCraft } = useCrafts()
  const { t } = useLang()
  const craft = getCraft(id)
  const [activeImage, setActiveImage] = useState(0)
  const [tab, setTab] = useState('photos') // 'photos' | '3d'
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // ESC closes lightbox
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  if (!craft) return <NotFound />

  const cover = craft.images?.[activeImage] || craft.images?.[0]
  const makerKey = encodeURIComponent(craft.maker?.phone || craft.maker?.id || craft.maker?.name || '')

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/explore" className="text-sm text-ink-500 hover:text-terracotta-600">
        ← {t('explore.title')}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Media */}
        <div>
          <div className="paper p-3">
            <div className="flex gap-1 mb-3">
              <TabButton active={tab === 'photos'} onClick={() => setTab('photos')}>
                {t('craft.gallery')}
              </TabButton>
              <TabButton active={tab === '3d'} onClick={() => setTab('3d')}>
                <IconCube size={16} />
                {t('craft.threeD')}
              </TabButton>
            </div>

            {tab === 'photos' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => cover && setLightboxOpen(true)}
                  className="block w-full overflow-hidden rounded-2xl bg-parchment cursor-zoom-in group"
                  aria-label="Open full photo"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={craft.title}
                      className="w-full max-h-[640px] object-contain transition-transform group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="aspect-square w-full flex items-center justify-center text-ink-300">
                      <Paisley size={120} />
                    </div>
                  )}
                </button>
                {craft.images?.length > 1 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {craft.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                          i === activeImage ? 'border-terracotta-400' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === '3d' && (
              <div className="relative">
                <ModelViewer
                  src={craft.modelSrc}
                  poster={cover}
                  alt={craft.title}
                  height={500}
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-500 px-1">
                  <IconAR size={16} className="text-leaf-400" />
                  <span>Tap “View in your room” for AR (mobile).</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meta + Story */}
        <div>
          <div className="chip">{craft.craft}</div>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl leading-tight">{craft.title}</h1>
          <p className="mt-2 text-ink-500">{craft.region}</p>

          {makerKey ? (
            <Link
              to={`/artisan/${makerKey}`}
              className="mt-4 paper p-4 inline-flex items-center gap-3 hover:bg-parchment transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-mustard-200 grid place-content-center font-display">
                {craft.maker?.name?.[0] || '?'}
              </div>
              <div>
                <div className="text-xs text-ink-500">{t('craft.shareCredit')}</div>
                <div className="font-medium">{craft.maker?.name || '—'} <span className="text-ink-300 text-xs ml-1">→</span></div>
              </div>
            </Link>
          ) : (
            <div className="mt-4 paper p-4 inline-flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-mustard-200 grid place-content-center font-display">
                {craft.maker?.name?.[0] || '?'}
              </div>
              <div>
                <div className="text-xs text-ink-500">{t('craft.shareCredit')}</div>
                <div className="font-medium">{craft.maker?.name || '—'}</div>
              </div>
            </div>
          )}

          <Divider className="mt-8" />

          <h2 className="font-display text-2xl mt-6">{t('craft.story')}</h2>
          <p className="mt-2 text-ink-700 leading-relaxed whitespace-pre-line">
            {craft.description}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Fact label={t('craft.materials')} value={craft.materials} />
            <Fact label={t('craft.technique')} value={craft.technique} />
            <Fact label={t('craft.time')} value={craft.time} />
            <Fact label={t('craft.origin')} value={craft.region} />
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxOpen && cover && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out animate-fade-up"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-content-center text-2xl"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
          >
            ✕
          </button>
          <img
            src={cover}
            alt={craft.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm transition ${
        active
          ? 'bg-terracotta-500 text-ivory'
          : 'bg-parchment text-ink-700 hover:bg-mustard-100'
      }`}
    >
      {children}
    </button>
  )
}

function Fact({ label, value }) {
  return (
    <div className="paper p-4">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-ink-900">{value || '—'}</div>
    </div>
  )
}
