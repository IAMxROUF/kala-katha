import { Link } from 'react-router-dom'
import { useLang } from '../../context/LanguageContext.jsx'
import { Kolam, Paisley } from '../../components/Decorations.jsx'
import { IconCheck } from '../../components/Icons.jsx'

export default function Step6Publish({ data }) {
  const { t } = useLang()

  return (
    <div className="relative text-center py-6">
      <Kolam size={260} className="absolute -left-10 -top-10 text-mustard-200 opacity-40" />
      <Paisley size={180} className="absolute -right-6 -bottom-6 text-terracotta-200 opacity-50 animate-sway" />

      <div className="relative">
        <div className="mx-auto h-20 w-20 rounded-full bg-leaf-300 text-ivory grid place-content-center shadow-soft">
          <IconCheck size={36} />
        </div>
        <p className="mt-4 font-hand text-2xl text-terracotta-500">{t('doc.step6.publishedTitle')}</p>
        <h2 className="font-display text-4xl mt-1">{data.title || 'Your craft'}</h2>
        <p className="mt-2 text-ink-700 max-w-md mx-auto">{t('doc.step6.publishedSub')}</p>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          {data.id && (
            <Link to={`/craft/${data.id}`} className="btn-primary">
              {t('doc.step6.viewIt')}
            </Link>
          )}
          <Link to="/document" reloadDocument className="btn-secondary">
            {t('doc.step6.anotherOne')}
          </Link>
          <Link to="/dashboard" className="btn-ghost">
            {t('nav.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
