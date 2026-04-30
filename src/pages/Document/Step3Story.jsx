import { useState } from 'react'
import { useLang } from '../../context/LanguageContext.jsx'
import useVoiceInput from '../../hooks/useVoiceInput.js'
import { IconMic, IconQuestion, IconType } from '../../components/Icons.jsx'

export default function Step3Story({ data, update }) {
  const { t, lang } = useLang()
  const [tab, setTab] = useState('type')

  return (
    <div>
      <p className="font-hand text-2xl text-terracotta-500">{t('doc.step3.title')}</p>
      <h2 className="font-display text-3xl mt-1">Tell its story</h2>
      <p className="text-ink-700 mt-2 max-w-xl">{t('doc.step3.sub')}</p>

      <div className="mt-6 flex gap-2 flex-wrap">
        <ModeTab active={tab === 'type'} onClick={() => setTab('type')} icon={<IconType size={18} />}>
          {t('doc.step3.typeTab')}
        </ModeTab>
        <ModeTab active={tab === 'voice'} onClick={() => setTab('voice')} icon={<IconMic size={18} />}>
          {t('doc.step3.voiceTab')}
        </ModeTab>
        <ModeTab active={tab === 'guided'} onClick={() => setTab('guided')} icon={<IconQuestion size={18} />}>
          {t('doc.step3.guidedTab')}
        </ModeTab>
      </div>

      <div className="mt-5">
        {tab === 'type' && <TypeMode data={data} update={update} />}
        {tab === 'voice' && <VoiceMode data={data} update={update} lang={lang} />}
        {tab === 'guided' && <GuidedMode data={data} update={update} />}
      </div>

      <div className="mt-6">
        <label className="field-label">Your story so far</label>
        <textarea
          className="textarea"
          rows={6}
          value={data.story}
          onChange={(e) => update({ story: e.target.value })}
          placeholder={t('doc.step3.textPh')}
        />
        <p className="field-hint">You can edit anything here at any time.</p>
      </div>
    </div>
  )
}

function ModeTab({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active
          ? 'bg-terracotta-500 text-ivory shadow-soft'
          : 'bg-parchment text-ink-700 hover:bg-mustard-100'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function TypeMode({ data, update }) {
  const { t } = useLang()
  return (
    <textarea
      className="textarea"
      rows={6}
      placeholder={t('doc.step3.textPh')}
      value={data.story}
      onChange={(e) => update({ story: e.target.value })}
    />
  )
}

function VoiceMode({ data, update, lang }) {
  const { t } = useLang()
  const { supported, listening, transcript, start, stop, error, reset } = useVoiceInput(lang)

  if (!supported) {
    return (
      <div className="paper p-5 text-sm text-ink-700">{t('doc.step3.unsupported')}</div>
    )
  }

  function appendToStory() {
    if (!transcript.trim()) return
    update({ story: (data.story ? data.story + '\n\n' : '') + transcript.trim() })
    reset()
  }

  return (
    <div className="paper p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={listening ? stop : start}
          className={`relative h-20 w-20 rounded-full flex items-center justify-center transition ${
            listening
              ? 'bg-terracotta-500 text-ivory shadow-soft animate-pulse-soft'
              : 'bg-mustard-200 text-ink-900 hover:bg-mustard-300'
          }`}
        >
          <IconMic size={28} />
          {listening && (
            <span className="absolute -inset-2 rounded-full border-2 border-terracotta-300 animate-pulse-soft" />
          )}
        </button>
        <div>
          <div className="font-medium">
            {listening ? t('doc.step3.listening') : t('doc.step3.recordStart')}
          </div>
          {error && <div className="text-sm text-terracotta-600">{error}</div>}
        </div>
      </div>

      <div className="mt-5">
        <label className="field-label">Live transcript</label>
        <div className="paper-soft rounded-2xl p-4 min-h-[110px] text-ink-900 whitespace-pre-line border border-ink-300/15">
          {transcript || <span className="text-ink-300">Your words will appear here as you speak…</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={appendToStory} className="btn-secondary text-sm" disabled={!transcript.trim()}>
            Add to my story
          </button>
          <button onClick={reset} className="btn-ghost text-sm" disabled={!transcript}>
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

function GuidedMode({ data, update }) {
  const { t } = useLang()
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'].map((k) => t(`doc.step3.guided.${k}`))
  const [answers, setAnswers] = useState(() => questions.map(() => ''))

  function setAnswer(i, v) {
    setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)))
  }

  function compose() {
    const merged = questions
      .map((q, i) => (answers[i].trim() ? `${q}\n${answers[i].trim()}` : null))
      .filter(Boolean)
      .join('\n\n')
    if (!merged) return
    update({ story: (data.story ? data.story + '\n\n' : '') + merged })
  }

  return (
    <div className="paper p-5 space-y-4">
      {questions.map((q, i) => (
        <div key={i}>
          <label className="field-label">{q}</label>
          <textarea
            className="textarea"
            rows={2}
            value={answers[i]}
            onChange={(e) => setAnswer(i, e.target.value)}
            placeholder="A line or two is enough"
          />
        </div>
      ))}
      <button onClick={compose} className="btn-secondary text-sm">
        Add answers to my story
      </button>
    </div>
  )
}
