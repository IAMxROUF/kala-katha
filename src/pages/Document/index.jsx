import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCrafts } from '../../context/CraftsContext.jsx'
import { useLang } from '../../context/LanguageContext.jsx'
import Stepper from '../../components/Stepper.jsx'
import { IconArrow } from '../../components/Icons.jsx'

import Step1Upload from './Step1Upload.jsx'
import Step2Details from './Step2Details.jsx'
import Step3Story from './Step3Story.jsx'
import Step4Processing from './Step4Processing.jsx'
import Step5Review from './Step5Review.jsx'
import Step6Publish from './Step6Publish.jsx'

const EMPTY = {
  id: null,
  title: '',
  craft: '',
  region: '',
  images: [null, null, null, null], // [front, back, top, bottom]
  story: '',
  description: '',
  materials: '',
  technique: '',
  time: '',
  modelSrc: '',
  generatedExtras: [],
}

export default function DocumentFlow() {
  const { t } = useLang()
  const { user } = useAuth()
  const { drafts, userCrafts, saveDraft, publishCraft } = useCrafts()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [step, setStep] = useState(1)
  const [data, setData] = useState(EMPTY)
  const [savingDraft, setSavingDraft] = useState(false)

  // Hydrate from ?edit= (published craft) or ?draft= (saved draft)
  useEffect(() => {
    const editId = params.get('edit')
    if (editId) {
      const c = userCrafts.find((x) => x.id === editId)
      if (c) {
        setData({ ...EMPTY, ...c, images: c.images?.length ? c.images : EMPTY.images })
        setStep(5) // Jump straight to the review form with all fields editable
        return
      }
    }
    const draftId = params.get('draft')
    if (!draftId) return
    const d = drafts.find((x) => x.id === draftId)
    if (d) {
      setData({ ...EMPTY, ...d, images: d.images?.length ? d.images : EMPTY.images })
      setStep(d.lastStep || 1)
    }
  }, [params, drafts, userCrafts])

  // Inject maker info from the logged-in user.
  useEffect(() => {
    if (user) {
      setData((d) => ({
        ...d,
        maker: { id: user.id, name: user.name, region: user.region || '' },
      }))
    }
  }, [user])

  function update(patch) {
    setData((d) => ({ ...d, ...patch }))
  }

  function next() {
    setStep((s) => Math.min(6, s + 1))
  }
  function back() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSaveDraft() {
    setSavingDraft(true)
    try {
      const saved = await saveDraft({ ...data, lastStep: step })
      if (saved?.id) setData((d) => ({ ...d, id: saved.id }))
      navigate('/dashboard')
    } finally {
      setSavingDraft(false)
    }
  }

  async function handlePublish() {
    try {
      const published = await publishCraft(data)
      if (published?.id) update({ id: published.id })
      setStep(6)
    } catch (e) {
      console.error('[Document] publish failed:', e)
      alert('Could not publish — please check your connection and try again.')
    }
  }

  // Step 1 needs at least the front image to advance.
  const canAdvance =
    (step === 1 && !!data.images?.[0]) ||
    (step === 2 && data.title.trim() && data.craft.trim() && data.region.trim()) ||
    (step === 3 && data.story.trim().length > 0) ||
    step === 4 ||
    step === 5

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Stepper current={step} />

      <div className="mt-6 paper p-5 sm:p-8 animate-fade-up">
        {step === 1 && <Step1Upload data={data} update={update} />}
        {step === 2 && <Step2Details data={data} update={update} />}
        {step === 3 && <Step3Story data={data} update={update} />}
        {step === 4 && <Step4Processing data={data} update={update} onDone={next} />}
        {step === 5 && <Step5Review data={data} update={update} />}
        {step === 6 && <Step6Publish data={data} />}
      </div>

      {/* Footer controls */}
      {step !== 6 && (
        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {step > 1 && step !== 4 && (
              <button onClick={back} className="btn-secondary">
                ← {t('doc.back')}
              </button>
            )}
            {step !== 4 && (
              <button onClick={handleSaveDraft} className="btn-ghost text-sm" disabled={savingDraft}>
                {savingDraft ? t('common.loading') : t('doc.saveDraft')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 && (
              <button onClick={next} disabled={!canAdvance} className="btn-primary">
                {t('doc.next')} <IconArrow size={18} />
              </button>
            )}
            {step === 5 && (
              <button onClick={handlePublish} className="btn-primary">
                {t('doc.publish')} <IconArrow size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
