import { useState } from 'react'
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

  if (!craft) return <NotFound />

  const cover = craft.images?.[activeImage] || craft.images?.[0]

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
                <div className="aspect-square overflow-hidden rounded-2xl bg-parchment">
                  {cover ? (
                    <img src={cover} alt={craft.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-ink-300">
                      <Paisley size={120} />
                    </div>
                  )}
                </div>
                {craft.images?.length > 1 && (
                  <div className="mt-3 flex gap-2">
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

          <div className="mt-4 paper p-4 inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-mustard-200 grid place-content-center font-display">
              {craft.maker?.name?.[0] || '?'}
            </div>
            <div>
              <div className="text-xs text-ink-500">{t('craft.shareCredit')}</div>
              <div className="font-medium">{craft.maker?.name || '—'}</div>
            </div>
          </div>

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
