import { useEffect, useRef, useState } from 'react'

const LANG_TO_BCP47 = {
  en: 'en-IN',
  hi: 'hi-IN',
  hien: 'en-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
}

export default function useVoiceInput(lang = 'en') {
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)

  const supported = !!Recognition
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!supported) return
    const r = new Recognition()
    r.continuous = true
    r.interimResults = true
    r.lang = LANG_TO_BCP47[lang] || 'en-IN'

    r.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript
        if (event.results[i].isFinal) final += piece + ' '
        else interim += piece
      }
      setTranscript((prev) => (final ? prev + final : prev))
      // Note: we ignore interim here to keep state simple. Consumers can
      // expose it with a separate state slice if they need live captions.
    }
    r.onerror = (e) => setError(e?.error || 'Voice error')
    r.onend = () => setListening(false)

    recognitionRef.current = r
    return () => {
      try {
        r.stop()
      } catch {}
    }
  }, [lang, supported])

  function start() {
    setError(null)
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
      setListening(true)
    } catch (e) {
      setError(e?.message || 'Could not start')
    }
  }

  function stop() {
    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
  }

  function reset() {
    setTranscript('')
  }

  return { supported, listening, transcript, error, start, stop, reset, setTranscript }
}
