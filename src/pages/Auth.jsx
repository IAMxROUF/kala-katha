import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../context/LanguageContext.jsx'
import { Kolam, Paisley } from '../components/Decorations.jsx'
import { IconArrow, IconCamera, IconUser } from '../components/Icons.jsx'

export default function Auth() {
  const { t } = useLang()
  const { sendOtp, verifyOtp, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const initialRole = params.get('role') === 'artisan' ? 'artisan' : 'explorer'

  const [mode, setMode] = useState('signup') // 'signin' | 'signup'
  const [stage, setStage] = useState('phone') // 'phone' | 'otp'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [role, setRole] = useState(initialRole)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthed) {
      const target = location.state?.from || (role === 'artisan' ? '/document' : '/explore')
      navigate(target, { replace: true })
    }
  }, [isAuthed, navigate, location.state, role])

  async function handleSendOtp(e) {
    e.preventDefault()
    setError(null)
    if (!/^\+?\d{7,15}$/.test(phone.trim())) {
      setError('Please enter a valid phone number.')
      return
    }
    setBusy(true)
    try {
      await sendOtp(phone)
      setStage('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyOtp({ phone, otp, name, role, region })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <Kolam
        size={420}
        className="absolute -left-32 top-12 text-mustard-200 opacity-25 hidden md:block"
      />
      <Paisley
        size={260}
        className="absolute right-[-50px] bottom-12 text-terracotta-200 opacity-50 hidden md:block animate-sway"
      />

      <div className="mx-auto max-w-md px-4 py-16 relative">
        <div className="paper p-7 sm:p-9">
          <p className="font-hand text-xl text-terracotta-500">
            {mode === 'signup' ? t('auth.newHere') : t('auth.welcomeBack')}
          </p>
          <h1 className="font-display text-3xl mt-1">
            {mode === 'signup' ? 'Create your studio' : 'Sign in'}
          </h1>

          <p className="mt-3 text-sm text-ink-500">{t('auth.hint')}</p>

          {/* Phone stage */}
          {stage === 'phone' && (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="field-label">{t('auth.name')}</label>
                  <input
                    className="input"
                    placeholder="eg. Hira Ben"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div>
                <label className="field-label">{t('auth.phone')}</label>
                <input
                  className="input"
                  inputMode="tel"
                  placeholder="+91 98xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="field-label">{t('auth.role')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <RoleOption
                        active={role === 'artisan'}
                        onClick={() => setRole('artisan')}
                        icon={<IconCamera size={20} />}
                        label={t('auth.artisan')}
                      />
                      <RoleOption
                        active={role === 'explorer'}
                        onClick={() => setRole('explorer')}
                        icon={<IconUser size={20} />}
                        label={t('auth.explorer')}
                      />
                    </div>
                  </div>
                  {role === 'artisan' && (
                    <div>
                      <label className="field-label">{t('auth.regionLabel')}</label>
                      <input
                        className="input"
                        placeholder={t('auth.regionPh')}
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

              {error && <p className="text-sm text-terracotta-600">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? t('common.loading') : t('auth.sendOtp')}
                <IconArrow size={18} />
              </button>
            </form>
          )}

          {/* OTP stage */}
          {stage === 'otp' && (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <p className="text-sm text-ink-700">
                Code sent to <span className="font-medium">{phone}</span>{' '}
                <button
                  type="button"
                  className="ink-link text-sm"
                  onClick={() => setStage('phone')}
                >
                  change
                </button>
              </p>
              <div>
                <label className="field-label">{t('auth.otp')}</label>
                <input
                  className="input tracking-[0.4em] text-center text-xl"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="field-hint">{t('auth.demoOtp')}</p>
              </div>

              {error && <p className="text-sm text-terracotta-600">{error}</p>}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? t('common.loading') : t('auth.verify')}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm text-ink-700 hover:text-terracotta-600"
              onClick={() => {
                setMode((m) => (m === 'signup' ? 'signin' : 'signup'))
                setStage('phone')
                setError(null)
              }}
            >
              {mode === 'signup' ? t('auth.switchToSignIn') : t('auth.switchToSignUp')}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          By continuing you agree to credit makers and treat the archive with care.
        </p>
        <p className="mt-2 text-center text-xs">
          <Link to="/" className="ink-link">← Back home</Link>
        </p>
      </div>
    </div>
  )
}

function RoleOption({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm transition ${
        active
          ? 'bg-terracotta-100 border-terracotta-300 text-ink-900'
          : 'bg-ivory border-ink-300/30 text-ink-700 hover:bg-parchment'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
