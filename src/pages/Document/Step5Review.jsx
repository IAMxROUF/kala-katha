import { useLang } from '../../context/LanguageContext.jsx'
import ModelViewer from '../../components/ModelViewer.jsx'
import { Divider } from '../../components/Decorations.jsx'

export default function Step5Review({ data, update }) {
  const { t } = useLang()
  const photos = (data.images || []).filter(Boolean)
  const cover = photos[0]

  return (
    <div>
      <p className="font-hand text-2xl text-terracotta-500">{t('doc.step5.title')}</p>
      <h2 className="font-display text-3xl mt-1">Look it over</h2>
      <p className="text-ink-700 mt-2 max-w-xl">{t('doc.step5.sub')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Media review */}
        <div>
          <div className="paper p-3">
            <ModelViewer src={data.modelSrc} poster={cover} alt={data.title} height={360} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-parchment">
                <img src={p} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4">
          <div>
            <label className="field-label">Title</label>
            <input
              className="input"
              value={data.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('craft.materials')}</label>
              <input
                className="input"
                value={data.materials}
                onChange={(e) => update({ materials: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">{t('doc.step5.timeLabel')}</label>
              <input
                className="input"
                value={data.time}
                onChange={(e) => update({ time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="field-label">{t('doc.step5.techniqueLabel')}</label>
            <textarea
              className="textarea"
              rows={3}
              value={data.technique}
              onChange={(e) => update({ technique: e.target.value })}
            />
          </div>

          <Divider />

          <div>
            <label className="field-label">{t('doc.step5.descLabel')}</label>
            <textarea
              className="textarea"
              rows={6}
              value={data.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
