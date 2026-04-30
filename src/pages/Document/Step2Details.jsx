import { useLang } from '../../context/LanguageContext.jsx'
import { ALL_CRAFT_TRADITIONS, ALL_REGIONS } from '../../data/seedCrafts.js'

export default function Step2Details({ data, update }) {
  const { t } = useLang()

  return (
    <div>
      <p className="font-hand text-2xl text-terracotta-500">{t('doc.step2.title')}</p>
      <h2 className="font-display text-3xl mt-1">A few details</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">{t('doc.step2.productName')}</label>
          <input
            className="input"
            placeholder={t('doc.step2.productNamePh')}
            value={data.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div>
          <label className="field-label">{t('doc.step2.craftName')}</label>
          <input
            list="craft-suggestions"
            className="input"
            placeholder={t('doc.step2.craftNamePh')}
            value={data.craft}
            onChange={(e) => update({ craft: e.target.value })}
          />
          <datalist id="craft-suggestions">
            {ALL_CRAFT_TRADITIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <SuggestionsRow
            label={t('doc.step2.suggestions')}
            items={ALL_CRAFT_TRADITIONS.slice(0, 5)}
            onPick={(v) => update({ craft: v })}
          />
        </div>

        <div>
          <label className="field-label">{t('doc.step2.region')}</label>
          <input
            list="region-suggestions"
            className="input"
            placeholder={t('doc.step2.regionPh')}
            value={data.region}
            onChange={(e) => update({ region: e.target.value })}
          />
          <datalist id="region-suggestions">
            {ALL_REGIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <SuggestionsRow
            label={t('doc.step2.suggestions')}
            items={ALL_REGIONS.slice(0, 5)}
            onPick={(v) => update({ region: v })}
          />
        </div>
      </div>
    </div>
  )
}

function SuggestionsRow({ label, items, onPick }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-300">{label}:</span>
      {items.map((it) => (
        <button
          key={it}
          type="button"
          onClick={() => onPick(it)}
          className="text-xs rounded-full border border-ink-300/30 bg-ivory hover:bg-mustard-100 px-2.5 py-1"
        >
          {it}
        </button>
      ))}
    </div>
  )
}
