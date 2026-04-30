import { useLang } from '../context/LanguageContext.jsx'

const STEPS = [
  { id: 1, key: 'doc.step1.title' },
  { id: 2, key: 'doc.step2.title' },
  { id: 3, key: 'doc.step3.title' },
  { id: 4, key: 'doc.step4.title' },
  { id: 5, key: 'doc.step5.title' },
  { id: 6, key: 'doc.step6.title' },
]

export default function Stepper({ current = 1 }) {
  const { t } = useLang()
  const total = STEPS.length

  return (
    <div className="paper-soft rounded-2xl px-4 py-3 border border-ink-300/15">
      <div className="flex items-center justify-between mb-2 text-xs text-ink-500">
        <span>{t('doc.stepOf', { n: current, total })}</span>
        <span className="font-hand text-ink-700 text-base">{t(STEPS[current - 1].key)}</span>
      </div>
      <ol className="grid grid-cols-6 gap-1.5">
        {STEPS.map((s) => {
          const state =
            s.id < current ? 'done' : s.id === current ? 'active' : 'pending'
          return (
            <li key={s.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full ${
                  state === 'done'
                    ? 'bg-terracotta-400'
                    : state === 'active'
                      ? 'bg-mustard-300 animate-pulse-soft'
                      : 'bg-ink-300/20'
                }`}
              />
              <span
                className={`text-[10px] font-medium tracking-wide uppercase ${
                  state === 'pending' ? 'text-ink-300' : 'text-ink-700'
                } hidden sm:block`}
              >
                {s.id}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export { STEPS }
