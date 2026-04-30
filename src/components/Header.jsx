import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { IconMenu, IconClose, IconUser } from './Icons.jsx'
import { Paisley } from './Decorations.jsx'

export default function Header() {
  const { t } = useLang()
  const { user, isAuthed, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/explore', label: t('nav.explore') },
  ]
  if (isAuthed) {
    links.push({ to: '/dashboard', label: t('nav.dashboard') })
    if (user?.role === 'artisan') {
      links.push({ to: '/document', label: t('nav.document') })
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-ivory/85 backdrop-blur supports-[backdrop-filter]:bg-ivory/70 border-b border-ink-300/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Paisley size={36} className="text-terracotta-500 group-hover:animate-sway" />
            <div className="leading-tight">
              <div className="font-display text-xl text-ink-900">
                {t('brand.name')}
              </div>
              <div className="hidden sm:block text-[11px] text-ink-500 -mt-0.5 font-hand">
                {t('brand.tagline')}
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full text-sm font-medium transition ${
                    isActive
                      ? 'bg-terracotta-100 text-terracotta-700'
                      : 'text-ink-700 hover:bg-parchment'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {isAuthed ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-parchment border border-ink-300/20">
                  <IconUser size={16} className="text-ink-700" />
                  <span className="text-sm">{user?.name}</span>
                </div>
                <button onClick={signOut} className="btn-ghost text-sm py-2 px-3">
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary text-sm py-2 px-4 hidden sm:inline-flex">
                {t('nav.signIn')}
              </Link>
            )}
            <button
              className="md:hidden btn-ghost p-2"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
            >
              {open ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 animate-fade-up">
            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive ? 'bg-terracotta-100 text-terracotta-700' : 'text-ink-700 hover:bg-parchment'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {!isAuthed ? (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-2 text-sm"
                >
                  {t('nav.signIn')}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    signOut()
                    setOpen(false)
                  }}
                  className="btn-secondary mt-2 text-sm"
                >
                  {t('nav.signOut')}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
