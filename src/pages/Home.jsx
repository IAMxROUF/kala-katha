import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext.jsx'
import { useCrafts } from '../context/CraftsContext.jsx'
import CraftCard from '../components/CraftCard.jsx'
import { Divider, HandArrow, Kolam, Leaf, Paisley, Sun } from '../components/Decorations.jsx'
import { IconCamera, IconCube, IconHeart, IconMic } from '../components/Icons.jsx'

export default function Home() {
  const { t } = useLang()
  const { crafts } = useCrafts()
  const featured = crafts.slice(0, 4)

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative">
        <Kolam
          size={420}
          className="absolute -left-32 -top-12 text-mustard-200 opacity-30 hidden md:block animate-sway"
        />
        <Sun
          size={220}
          className="absolute right-[-40px] top-10 text-terracotta-200 opacity-50 hidden md:block float-y"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 relative">
          <div className="max-w-3xl">
            <p className="font-hand text-2xl text-terracotta-500 mb-3">{t('home.eyebrow')}</p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-6 text-lg text-ink-700 max-w-2xl">{t('home.heroSub')}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth?role=artisan" className="btn-primary text-base">
                <IconCamera size={20} />
                {t('home.ctaArtisan')}
              </Link>
              <Link to="/explore" className="btn-secondary text-base">
                {t('home.ctaExplorer')}
                <HandArrow size={36} />
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3 text-ink-500 text-sm">
              <Leaf size={20} className="text-leaf-400" />
              <span>{t('brand.tagline')}</span>
            </div>
          </div>
        </div>
      </section>

      <Divider className="mx-auto max-w-5xl" />

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Pillar
            icon={<IconMic size={26} />}
            title={t('home.pillars.oneTitle')}
            body={t('home.pillars.one')}
            tone="terracotta"
          />
          <Pillar
            icon={<IconCube size={26} />}
            title={t('home.pillars.twoTitle')}
            body={t('home.pillars.two')}
            tone="mustard"
          />
          <Pillar
            icon={<IconHeart size={26} />}
            title={t('home.pillars.threeTitle')}
            body={t('home.pillars.three')}
            tone="leaf"
          />
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="font-hand text-xl text-terracotta-500">{t('home.featured')}</p>
            <h2 className="font-display text-3xl sm:text-4xl">From the archive</h2>
          </div>
          <Link to="/explore" className="text-sm text-terracotta-500 hover:text-terracotta-700 font-medium">
            {t('home.seeAll')} →
          </Link>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c, i) => (
            <CraftCard key={c.id} craft={c} accent={['terracotta', 'mustard', 'leaf'][i % 3]} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl sm:text-4xl mb-2">{t('home.howItWorks')}</h2>
        <p className="text-ink-500 max-w-xl mb-8">
          Designed for the way you already work — not the way software wants you to.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <HowStep n="01" icon={<IconCamera size={22} />} text={t('home.step1')} />
          <HowStep n="02" icon={<IconMic size={22} />} text={t('home.step2')} />
          <HowStep n="03" icon={<IconCube size={22} />} text={t('home.step3')} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        <div className="paper p-8 sm:p-12 relative overflow-hidden">
          <Paisley
            size={300}
            className="absolute -right-12 -bottom-16 text-terracotta-200 opacity-50 animate-sway"
          />
          <div className="relative max-w-2xl">
            <p className="font-hand text-2xl text-terracotta-500">For the makers</p>
            <h3 className="font-display text-3xl sm:text-4xl mt-1">
              Your story is the archive.
            </h3>
            <p className="mt-3 text-ink-700">
              No forms to fill. No grants to apply for. Just photos, your voice, and a few
              gentle questions. We’ll do the rest.
            </p>
            <Link to="/auth?role=artisan" className="btn-primary mt-6 text-base">
              {t('home.ctaArtisan')} <HandArrow size={36} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function Pillar({ icon, title, body, tone = 'terracotta' }) {
  const toneClass = {
    terracotta: 'bg-terracotta-100 text-terracotta-600',
    mustard: 'bg-mustard-100 text-mustard-500',
    leaf: 'bg-leaf-200 text-leaf-500',
  }[tone]
  return (
    <div className="paper p-6">
      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl ${toneClass}`}>
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-ink-700 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

function HowStep({ n, icon, text }) {
  return (
    <div className="paper p-6 flex items-start gap-4">
      <div className="font-hand text-3xl text-terracotta-500 leading-none">{n}</div>
      <div>
        <div className="text-ink-500 mb-2">{icon}</div>
        <p className="text-ink-900 font-medium">{text}</p>
      </div>
    </div>
  )
}
