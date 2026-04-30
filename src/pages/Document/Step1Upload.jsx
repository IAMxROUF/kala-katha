import { useLang } from '../../context/LanguageContext.jsx'
import ImageUploader from '../../components/ImageUploader.jsx'
import { Leaf } from '../../components/Decorations.jsx'

export default function Step1Upload({ data, update }) {
  const { t } = useLang()
  const images = data.images || [null, null, null, null]

  function setImage(i, url) {
    const next = [...images]
    next[i] = url
    update({ images: next })
  }

  return (
    <div>
      <p className="font-hand text-2xl text-terracotta-500">{t('doc.step1.title')}</p>
      <h2 className="font-display text-3xl mt-1">Photos</h2>
      <p className="text-ink-700 mt-2 max-w-xl">{t('doc.step1.sub')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ImageUploader
          label={t('doc.step1.front')}
          required
          value={images[0]}
          onChange={(url) => setImage(0, url)}
        />
        <ImageUploader
          label={t('doc.step1.back')}
          value={images[1]}
          onChange={(url) => setImage(1, url)}
          accent="mustard"
        />
        <ImageUploader
          label={t('doc.step1.top')}
          value={images[2]}
          onChange={(url) => setImage(2, url)}
          accent="leaf"
        />
        <ImageUploader
          label={t('doc.step1.bottom')}
          value={images[3]}
          onChange={(url) => setImage(3, url)}
          accent="terracotta"
        />
      </div>

      <div className="mt-8 paper p-5 bg-leaf-200/20 border-leaf-200">
        <div className="flex items-center gap-2">
          <Leaf size={22} className="text-leaf-400" />
          <h3 className="font-display text-lg">{t('doc.step1.guideTitle')}</h3>
        </div>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-ink-700">
          <Tip>{t('doc.step1.g1')}</Tip>
          <Tip>{t('doc.step1.g2')}</Tip>
          <Tip>{t('doc.step1.g3')}</Tip>
          <Tip>{t('doc.step1.g4')}</Tip>
        </ul>
      </div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-leaf-400" />
      <span>{children}</span>
    </li>
  )
}
