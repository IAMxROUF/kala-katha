import { useEffect, useRef, useState } from 'react'
import { useLang } from '../../context/LanguageContext.jsx'
import { generate3DModel } from '../../api/tripo.js'
import { describeCraft } from '../../api/gpt.js'
import { Sun } from '../../components/Decorations.jsx'
import { IconCheck } from '../../components/Icons.jsx'

// The Tripo task can take up to ~2 minutes, so we show an encouraging status
// line below the progress bar to keep the artisan from navigating away.
const PATIENCE_MESSAGES = [
  'Tripo is examining your craft in detail…',
  'Building the 3D mesh — this takes a minute or two.',
  'Almost there. The model is being rendered.',
  'Still going. Complex crafts take a little longer — worth it!',
  'Finalising details…',
]

const STAGES = [
  { key: 'building3d', labelKey: 'doc.step4.building3d' },
  { key: 'writingDesc', labelKey: 'doc.step4.writingDesc' },
]

export default function Step4Processing({ data, update, onDone }) {
  const { t } = useLang()
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [patienceIdx, setPatienceIdx] = useState(0)
  const timerRef = useRef(null)

  // Cycle the patience message every 18 s while the 3D stage is active
  useEffect(() => {
    if (stage !== 0 || done) return
    timerRef.current = setInterval(
      () => setPatienceIdx((i) => (i + 1) % PATIENCE_MESSAGES.length),
      18_000,
    )
    return () => clearInterval(timerRef.current)
  }, [stage, done])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // ── Stage 0: 3D model (long — up to 2-3 min) ───────────────────────
        setStage(0)
        setProgress(0)
        const model = await generate3DModel({
          images: data.images?.filter(Boolean) ?? [],
          onProgress: (p) => {
            if (!cancelled) setProgress(p)
          },
        })
        if (cancelled) return
        update({ modelSrc: model.url })

        // ── Stage 1: GPT description (fast — ~2-5 s) ───────────────────────
        clearInterval(timerRef.current)
        setStage(1)
        setProgress(0)
        const desc = await describeCraft({
          rawStory: data.story,
          productName: data.title,
          craft: data.craft,
          region: data.region,
        })
        if (cancelled) return
        // Only prefill fields the artisan hasn't already edited
        update({
          description: data.description?.trim() || desc.description,
          materials: data.materials?.trim() || desc.materials,
          technique: data.technique?.trim() || desc.technique,
          time: data.time?.trim() || desc.time,
        })
        setProgress(100)

        setDone(true)
        setTimeout(() => { if (!cancelled) onDone?.() }, 700)
      } catch (err) {
        if (!cancelled) {
          console.error('[Step4]', err)
          setError(err.message)
        }
      }
    }

    run()
    return () => {
      cancelled = true
      clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="text-center">
      <p className="font-hand text-2xl text-terracotta-500">{t('doc.step4.title')}</p>
      <h2 className="font-display text-3xl mt-1">A little magic</h2>
      <p className="text-ink-700 mt-2 max-w-xl mx-auto">{t('doc.step4.sub')}</p>

      {/* Animated sun */}
      <div className="my-8 inline-block relative">
        <Sun size={140} className={`text-mustard-300 ${done ? '' : 'animate-sway'}`} />
        {!done && (
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-terracotta-200 animate-spin [animation-duration:9s]" />
        )}
      </div>

      {/* Stage list */}
      <ul className="mx-auto max-w-md text-left space-y-3">
        {STAGES.map((s, i) => {
          const state = i < stage ? 'done' : i === stage ? 'active' : 'pending'
          return (
            <li key={s.key} className="paper p-4 flex items-start gap-3">
              <div
                className={`mt-0.5 h-8 w-8 shrink-0 grid place-content-center rounded-full ${
                  state === 'done'
                    ? 'bg-leaf-300 text-ivory'
                    : state === 'active'
                      ? 'bg-mustard-200 text-ink-900 animate-pulse-soft'
                      : 'bg-parchment text-ink-300'
                }`}
              >
                {state === 'done' ? <IconCheck size={18} /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t(s.labelKey)}</div>
                {state === 'active' && (
                  <>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-parchment overflow-hidden">
                      <div
                        className="h-full bg-terracotta-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-500 italic">
                      {i === 0 ? PATIENCE_MESSAGES[patienceIdx] : 'Working…'}
                    </p>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {/* Error state */}
      {error && (
        <div className="mx-auto mt-6 max-w-md paper p-4 text-sm text-terracotta-600">
          <p className="font-medium">Something went wrong:</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-ink-500">
            A sample 3D model has been used as fallback. You can still review and
            publish your craft — the model can be regenerated later.
          </p>
        </div>
      )}

      {done && (
        <p className="mt-6 font-hand text-2xl text-leaf-500">{t('doc.step4.done')}</p>
      )}
    </div>
  )
}
