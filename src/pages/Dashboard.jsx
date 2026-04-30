import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCrafts } from '../context/CraftsContext.jsx'
import { useLang } from '../context/LanguageContext.jsx'
import { Paisley, Sun } from '../components/Decorations.jsx'
import { IconPlus, IconTrash } from '../components/Icons.jsx'

export default function Dashboard() {
  const { t } = useLang()
  const { user } = useAuth()
  const { userCrafts, drafts, deleteDraft, deleteCraft } = useCrafts()
  const navigate = useNavigate()
  const isArtisan = user?.role === 'artisan'

  // For the demo, "my crafts" = anything published from this device. In a real
  // app you'd filter by maker.id from the server.
  const mine = userCrafts
  const myDrafts = drafts

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-hand text-xl text-terracotta-500">
            {t('dashboard.hello')}, {user?.name}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl">{t('dashboard.subtitle')}</h1>
        </div>
        {isArtisan && (
          <Link to="/document" className="btn-primary">
            <IconPlus /> {t('dashboard.addNew')}
          </Link>
        )}
      </div>

      {/* My Crafts */}
      <Section title={t('dashboard.myCrafts')} count={mine.length}>
        {mine.length === 0 ? (
          <EmptyState
            text={isArtisan ? t('dashboard.empty') : 'You haven’t saved any crafts yet — explore the archive to find some you love.'}
            actionLabel={isArtisan ? t('dashboard.addNew') : 'Browse the archive'}
            onAction={() => navigate(isArtisan ? '/document' : '/explore')}
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((c) => (
              <div key={c.id} className="paper overflow-hidden">
                <div className="aspect-[4/3] bg-parchment overflow-hidden">
                  {c.images?.[0] && (
                    <img src={c.images[0]} alt={c.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-4">
                  <div className="chip text-xs">{t('dashboard.published')}</div>
                  <h3 className="mt-2 font-display text-lg">{c.title || 'Untitled'}</h3>
                  <p className="text-sm text-ink-500">{c.region}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link to={`/craft/${c.id}`} className="ink-link text-sm">
                      View
                    </Link>
                    <button
                      className="text-ink-500 hover:text-terracotta-600"
                      onClick={() => {
                        if (confirm('Remove this craft from the archive?')) deleteCraft(c.id)
                      }}
                      aria-label="Delete craft"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Drafts */}
      {isArtisan && (
        <Section title={t('dashboard.drafts')} count={myDrafts.length}>
          {myDrafts.length === 0 ? (
            <EmptyState
              text="No drafts yet. Anything you start gets saved here automatically."
              actionLabel={t('dashboard.addNew')}
              onAction={() => navigate('/document')}
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {myDrafts.map((d) => (
                <div key={d.id} className="paper p-4">
                  <div className="chip text-xs bg-mustard-100/70">{t('dashboard.draft')}</div>
                  <h3 className="mt-2 font-display text-lg">{d.title || 'Untitled draft'}</h3>
                  <p className="text-sm text-ink-500">{d.craft || 'No tradition yet'}</p>
                  <p className="text-xs text-ink-300 mt-1">
                    Updated {new Date(d.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <Link
                      to={`/document?draft=${d.id}`}
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      {t('dashboard.continue')}
                    </Link>
                    <button
                      className="text-ink-500 hover:text-terracotta-600"
                      onClick={() => {
                        if (confirm('Delete this draft?')) deleteDraft(d.id)
                      }}
                      aria-label="Delete draft"
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="text-sm text-ink-300">{count}</span>
      </div>
      {children}
    </section>
  )
}

function EmptyState({ text, actionLabel, onAction }) {
  return (
    <div className="paper p-8 sm:p-10 text-center relative overflow-hidden">
      <Sun size={120} className="absolute right-[-30px] top-[-20px] text-mustard-200 opacity-50" />
      <Paisley size={80} className="mx-auto text-terracotta-300 animate-sway" />
      <p className="mt-3 font-hand text-xl text-terracotta-500">A blank page.</p>
      <p className="mt-1 max-w-md mx-auto text-ink-700">{text}</p>
      {actionLabel && (
        <button onClick={onAction} className="btn-primary mt-5 text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
