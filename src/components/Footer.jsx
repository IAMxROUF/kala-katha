import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { Divider, Sun } from './Decorations.jsx'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="mt-20">
      <Divider className="mx-auto max-w-5xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-3 items-start">
          <div>
            <div className="flex items-center gap-2">
              <Sun size={28} className="text-mustard-300" />
              <span className="font-display text-lg">{t('brand.name')}</span>
            </div>
            <p className="mt-2 text-sm text-ink-700 max-w-sm font-hand text-base">
              {t('brand.tagline')}
            </p>
          </div>
          <div className="text-sm text-ink-700">
            <div className="font-medium mb-2">For makers</div>
            <ul className="space-y-1.5">
              <li>Document a craft</li>
              <li>Voice support</li>
              <li>Drafts & autosave</li>
            </ul>
          </div>
          <div className="text-sm text-ink-700">
            <div className="font-medium mb-2">For everyone</div>
            <ul className="space-y-1.5">
              <li>Browse the archive</li>
              <li>3D and AR viewing</li>
              <li>Always credited to the maker</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-ink-500">
            A community archive. Every entry credits its maker. © {new Date().getFullYear()}.
          </p>
          <Link to="/design-system" className="text-xs text-ink-300 hover:text-terracotta-500 transition">
            Design system →
          </Link>
        </div>
      </div>
    </footer>
  )
}
