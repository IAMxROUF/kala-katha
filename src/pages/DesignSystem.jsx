/**
 * /design-system  —  Kalā Kathā living style-guide
 *
 * Every token used in the app is rendered here so designers, developers
 * and future contributors can see the exact colours, fonts and components
 * in context.  No install needed — just visit /design-system in the browser.
 */

import { useState } from 'react'
import { Divider, Kolam, Leaf, Paisley, Sun } from '../components/Decorations.jsx'
import {
  IconAR, IconArrow, IconCamera, IconCheck, IconClose,
  IconCube, IconGlobe, IconHeart, IconMenu, IconMic,
  IconPlus, IconQuestion, IconSearch, IconTrash, IconType, IconUser,
} from '../components/Icons.jsx'

// ─── helpers ───────────────────────────────────────────────────────────────
function Section({ id, title, children }) {
  return (
    <section id={id} className="mb-20 scroll-mt-20">
      <h2 className="font-display text-3xl mb-1">{title}</h2>
      <Divider className="mb-8" />
      {children}
    </section>
  )
}
function Label({ children }) {
  return <p className="mt-2 text-xs text-ink-500 font-mono">{children}</p>
}
function Swatch({ hex, name, token, on = 'dark' }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="text-left group"
      onClick={() => { navigator.clipboard?.writeText(hex); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      title="Click to copy hex"
    >
      <div
        className="h-16 w-full rounded-2xl border border-ink-300/10 transition group-hover:scale-105"
        style={{ background: hex }}
      />
      <p className="mt-1.5 text-xs font-medium text-ink-900">{name}</p>
      <p className="text-[11px] text-ink-500 font-mono">{hex}</p>
      <p className="text-[11px] text-ink-300">{token}</p>
      {copied && <p className="text-[11px] text-leaf-500">Copied!</p>}
    </button>
  )
}

export default function DesignSystem() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">

      {/* Page header */}
      <div className="mb-14 relative">
        <Kolam size={320} className="absolute -right-16 -top-10 text-mustard-200 opacity-30 hidden md:block" />
        <p className="font-hand text-2xl text-terracotta-500">Kalā Kathā</p>
        <h1 className="font-display text-5xl sm:text-6xl">Design System</h1>
        <p className="mt-3 max-w-xl text-ink-700">
          A living reference for every visual token used in the platform.
          Rooted in craft, not corporate SaaS — warm, earthy, human.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2">
          {['colors','typography','spacing','shadows','components','icons','decorations','motion'].map(s => (
            <a key={s} href={`#${s}`}
              className="chip hover:bg-mustard-100 capitalize transition text-xs">{s}</a>
          ))}
        </nav>
      </div>

      {/* ── 1. COLORS ─────────────────────────────────────────────────── */}
      <Section id="colors" title="Colour palette">

        <h3 className="font-display text-xl mb-4">Base surfaces</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Swatch hex="#F8F1E5" name="Ivory" token="bg-ivory" />
          <Swatch hex="#F1E6D2" name="Parchment" token="bg-parchment" />
          <Swatch hex="#fbf6ec" name="Paper" token=".paper (bg)" />
          <Swatch hex="#2A1C12" name="Ink 900" token="text-ink-900" on="light" />
        </div>

        <h3 className="font-display text-xl mb-4">Terracotta — primary / CTA</h3>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-10">
          {[
            ['#FBEDE3','50'],['#F4D5BF','100'],['#E9AC8A','200'],['#D9825A','300'],
            ['#C76435','400'],['#B14E25','500 ★'],['#8E3C1B','600'],['#682A13','700'],
          ].map(([hex,n]) => <Swatch key={n} hex={hex} name={`TC-${n}`} token={`terracotta.${n.replace(' ★','')}`} />)}
        </div>

        <h3 className="font-display text-xl mb-4">Mustard — accents / highlights</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-10">
          {[
            ['#F6E2A8','100'],['#EFCC73','200'],['#E0B23C','300'],['#C99526','400'],['#A77719','500'],
          ].map(([hex,n]) => <Swatch key={n} hex={hex} name={`MY-${n}`} token={`mustard.${n}`} />)}
        </div>

        <h3 className="font-display text-xl mb-4">Leaf — success / nature</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            ['#B7C9A3','200'],['#8DA579','300'],['#647F4E','400'],['#445C32','500'],
          ].map(([hex,n]) => <Swatch key={n} hex={hex} name={`LF-${n}`} token={`leaf.${n}`} />)}
        </div>

        <h3 className="font-display text-xl mb-4">Ink — text hierarchy</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            ['#2A1C12','900 headings'],['#4B3621','700 body'],['#6B5237','500 secondary'],['#9C8466','300 muted/placeholder'],
          ].map(([hex,n]) => <Swatch key={n} hex={hex} name={`Ink ${n}`} token={`ink.${n.split(' ')[0]}`} />)}
        </div>

        <h3 className="font-display text-xl mb-4">Indigo Earth — deep accents (rarely used)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['#2E3A59','Earth'],['#1B2440','Deep']].map(([hex,n]) => (
            <Swatch key={n} hex={hex} name={`Indigo ${n}`} token={`indigo.${n.toLowerCase()}`} />
          ))}
        </div>

        <div className="mt-10 paper p-6">
          <h4 className="font-display text-lg mb-3">Background ambient gradients (body)</h4>
          <div className="h-32 w-full rounded-2xl"
            style={{backgroundImage:'radial-gradient(at 12% 8%, rgba(239,204,115,0.35) 0,transparent 45%),radial-gradient(at 88% 12%, rgba(217,130,90,0.25) 0,transparent 50%),radial-gradient(at 50% 92%, rgba(141,165,121,0.30) 0,transparent 55%)',backgroundColor:'#F8F1E5'}}
          />
          <p className="mt-2 text-xs text-ink-500 font-mono">
            3 radial-gradients composited over ivory — mustard NW · terracotta NE · leaf S
          </p>
        </div>
      </Section>

      {/* ── 2. TYPOGRAPHY ─────────────────────────────────────────────── */}
      <Section id="typography" title="Typography">

        <div className="space-y-10">

          {/* Display */}
          <div className="paper p-6">
            <div className="chip mb-3">Display · font-display</div>
            <p className="text-xs text-ink-500 font-mono mb-4">
              font-family: "Fraunces" → Georgia → serif &nbsp;|&nbsp; Google Fonts · optical-size 9–144
            </p>
            <p style={{fontFamily:'"Fraunces"',fontWeight:400}} className="text-6xl leading-none">Aa Bb Kk</p>
            <p style={{fontFamily:'"Fraunces"',fontWeight:500}} className="text-4xl mt-3 leading-snug">
              A living archive of India's craft
            </p>
            <p style={{fontFamily:'"Fraunces"',fontWeight:700}} className="text-2xl mt-3 leading-snug">
              Bold weight — sparingly
            </p>
            <div className="mt-5 grid gap-2">
              {[
                ['text-7xl / 4.5rem','Hero heading','font-400'],
                ['text-5xl / 3rem','Page title','font-500'],
                ['text-4xl / 2.25rem','Section heading','font-500'],
                ['text-3xl / 1.875rem','Card heading','font-500'],
                ['text-2xl / 1.5rem','Sub-heading','font-500'],
                ['text-xl / 1.25rem','Small heading','font-500'],
              ].map(([size,use,weight]) => (
                <div key={size} className="flex items-baseline gap-4">
                  <code className="text-[11px] w-36 shrink-0 text-ink-300">{size}</code>
                  <span style={{fontFamily:'"Fraunces"'}} className={size.split(' ')[0]}>{use}</span>
                  <code className="text-[11px] text-ink-300 ml-auto">{weight}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Hand */}
          <div className="paper p-6">
            <div className="chip mb-3">Hand · font-hand</div>
            <p className="text-xs text-ink-500 font-mono mb-4">
              font-family: "Caveat" → "Patrick Hand" → cursive &nbsp;|&nbsp; Google Fonts
            </p>
            <p style={{fontFamily:'"Caveat"',fontWeight:500}} className="text-4xl">
              Haath se bani. Aapki zubaani.
            </p>
            <p style={{fontFamily:'"Caveat"',fontWeight:700}} className="text-3xl mt-2 text-terracotta-500">
              Used for eyebrows and emotional pull-quotes only.
            </p>
            <div className="mt-4 grid gap-1">
              {[
                ['text-3xl / 1.875rem','Page eyebrow / section hook'],
                ['text-2xl / 1.5rem','Card accent line'],
                ['text-xl / 1.25rem','Small caption accent'],
              ].map(([size,use]) => (
                <div key={size} className="flex items-baseline gap-4">
                  <code className="text-[11px] w-36 shrink-0 text-ink-300">{size}</code>
                  <span style={{fontFamily:'"Caveat"',fontWeight:500}} className={size.split(' ')[0]}>{use}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Serif */}
          <div className="paper p-6">
            <div className="chip mb-3">Serif · font-serif</div>
            <p className="text-xs text-ink-500 font-mono mb-4">
              font-family: "Cormorant Garamond" → Georgia → serif &nbsp;|&nbsp; Google Fonts
            </p>
            <p style={{fontFamily:'"Cormorant Garamond"',fontWeight:400}} className="text-3xl">
              For long-form craft stories and pull-quotes.
            </p>
            <p style={{fontFamily:'"Cormorant Garamond"',fontWeight:600}} className="text-xl mt-2 italic">
              Italic semibold for emphasis within prose.
            </p>
          </div>

          {/* Sans */}
          <div className="paper p-6">
            <div className="chip mb-3">Sans · font-sans (body default)</div>
            <p className="text-xs text-ink-500 font-mono mb-4">
              font-family: "Inter" → system-ui → sans-serif &nbsp;|&nbsp; Google Fonts · variable
            </p>
            <div className="grid gap-2">
              {[
                ['text-base / 1rem · leading-relaxed','Body copy — craft descriptions, form hints'],
                ['text-sm / 0.875rem · font-medium','Labels, nav links, button text'],
                ['text-xs / 0.75rem · uppercase tracking-wide','Micro-labels, stat units, table headers'],
              ].map(([spec,use]) => (
                <div key={spec} className="flex items-start gap-4">
                  <code className="text-[11px] w-52 shrink-0 text-ink-300 mt-0.5">{spec}</code>
                  <span className="text-ink-900">{use}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Devanagari */}
          <div className="paper p-6">
            <div className="chip mb-3">Devanagari · font-deva</div>
            <p className="text-xs text-ink-500 font-mono mb-4">
              font-family: "Tiro Devanagari Hindi" → "Noto Serif Devanagari" → serif &nbsp;|&nbsp; Google Fonts
            </p>
            <p className="deva text-3xl">कलाकथा — भारत की हस्तकला का जीवंत संग्रह</p>
            <p className="deva text-xl mt-2 text-ink-700">कारीगर खुद अपनी कहानी कहें</p>
            <p className="mt-2 text-xs text-ink-500">Applied via <code>.deva</code> utility class on Hindi-script nodes.</p>
          </div>

        </div>
      </Section>

      {/* ── 3. SPACING ────────────────────────────────────────────────── */}
      <Section id="spacing" title="Spacing scale">
        <div className="paper p-6">
          <p className="text-sm text-ink-500 mb-6">
            Tailwind default 4px base. Highlighted values are the ones most
            frequently used in this UI.
          </p>
          <div className="space-y-3">
            {[
              ['1','4px','Tight icon gap'],
              ['2','8px','Badge padding'],
              ['3','12px','Chip / small padding'],
              ['4','16px','Card inner padding (mobile)','★'],
              ['5','20px','Button padding-x'],
              ['6','24px','Card inner padding (desktop)','★'],
              ['8','32px','Section gap (mobile)','★'],
              ['10','40px','Section gap (tablet)'],
              ['12','48px','Section gap (desktop)','★'],
              ['16','64px','Hero vertical padding'],
              ['20','80px','Footer top margin'],
              ['24','96px','Hero large screens'],
            ].map(([t,px,use,star]) => (
              <div key={t} className="flex items-center gap-4">
                <code className="w-8 text-sm font-mono text-ink-700">{t}</code>
                <div className="bg-terracotta-200 h-3 rounded" style={{width:parseInt(px)*0.8}} />
                <span className="text-xs font-mono text-ink-300">{px}</span>
                <span className="text-sm text-ink-700">{use}</span>
                {star && <span className="chip text-[10px] bg-mustard-100">common</span>}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 4. SHADOWS ────────────────────────────────────────────────── */}
      <Section id="shadows" title="Shadows & elevation">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-ivory rounded-2xl p-6 shadow-soft text-center">
            <p className="font-display text-lg">shadow-soft</p>
            <code className="text-xs text-ink-300 mt-1 block">0 6px 18px -8px rgba(75,54,33,0.25)</code>
            <p className="text-sm text-ink-500 mt-2">Buttons, floating chips</p>
          </div>
          <div className="paper p-6 text-center">
            <p className="font-display text-lg">shadow-paper</p>
            <code className="text-xs text-ink-300 mt-1 block">0 1px 0 + 0 8px 24px -12px</code>
            <p className="text-sm text-ink-500 mt-2">Cards, modals, dropdowns</p>
          </div>
          <div className="bg-ivory rounded-2xl p-6 text-center" style={{boxShadow:'inset 0 1px 2px rgba(75,54,33,0.08)'}}>
            <p className="font-display text-lg">inset_paper</p>
            <code className="text-xs text-ink-300 mt-1 block">inset 0 1px 2px rgba(75,54,33,0.08)</code>
            <p className="text-sm text-ink-500 mt-2">Input fields, text areas</p>
          </div>
        </div>
      </Section>

      {/* ── 5. COMPONENTS ─────────────────────────────────────────────── */}
      <Section id="components" title="Components">

        {/* Buttons */}
        <h3 className="font-display text-xl mb-4">Buttons</h3>
        <div className="paper p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center mb-5">
            <button className="btn-primary">Primary <IconArrow size={18}/></button>
            <button className="btn-secondary">Secondary</button>
            <button className="btn-ghost">Ghost</button>
            <button className="btn-primary" disabled>Disabled</button>
          </div>
          <div className="grid gap-2 text-sm">
            {[
              ['.btn-primary','terracotta-500 bg · ivory text · shadow-soft · hover →-600'],
              ['.btn-secondary','parchment bg · ink-900 text · ink-300/30 border · hover →mustard-100'],
              ['.btn-ghost','transparent bg · ink-700 text · hover →parchment/70'],
            ].map(([cls,spec]) => (
              <div key={cls} className="flex gap-3">
                <code className="text-[12px] font-mono text-terracotta-600 w-32 shrink-0">{cls}</code>
                <span className="text-ink-500 text-xs">{spec}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-300">All buttons: rounded-full · px-5 py-3 · focus:ring-4 ring-mustard-200/60 · active:scale-[0.98]</p>
        </div>

        {/* Inputs */}
        <h3 className="font-display text-xl mb-4">Form fields</h3>
        <div className="paper p-6 mb-6 space-y-4">
          <div>
            <label className="field-label">Text input</label>
            <input className="input" placeholder="e.g. Mirror-work jacket" defaultValue="" />
            <p className="field-hint">Hint text sits below in text-xs ink-500</p>
          </div>
          <div>
            <label className="field-label">Textarea</label>
            <textarea className="textarea" placeholder="Your story…" rows={3} />
          </div>
          <div>
            <label className="field-label">Select</label>
            <select className="select">
              <option>All regions</option>
              <option>Kutch, Gujarat</option>
            </select>
          </div>
          <p className="text-xs text-ink-300 font-mono">
            rounded-2xl · border ink-300/30 · bg ivory/70 · focus:border-terracotta-300 · focus:ring-4 ring-terracotta-100/70
          </p>
        </div>

        {/* Cards */}
        <h3 className="font-display text-xl mb-4">Card surfaces</h3>
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="paper p-5">
            <p className="font-display text-lg">.paper</p>
            <p className="text-sm text-ink-500 mt-1">bg #fbf6ec + paper-grain SVG noise + shadow-paper + 1px border ink-300/8. Used for all cards, modals, panels.</p>
          </div>
          <div className="paper-soft rounded-2xl p-5 border border-ink-300/15">
            <p className="font-display text-lg">.paper-soft</p>
            <p className="text-sm text-ink-500 mt-1">Same background without the shadow. Used for inset areas inside a card.</p>
          </div>
        </div>

        {/* Chip / badge */}
        <h3 className="font-display text-xl mb-4">Chip / Badge</h3>
        <div className="paper p-5 flex flex-wrap gap-3 mb-6 items-center">
          <span className="chip">Madhubani</span>
          <span className="chip bg-mustard-100 border-mustard-300/30">Draft</span>
          <span className="chip bg-leaf-200/60 border-leaf-300/30">Published</span>
          <span className="chip bg-terracotta-100 border-terracotta-200/50 text-terracotta-700">Featured</span>
          <p className="text-xs text-ink-300 w-full mt-1 font-mono">
            rounded-full · border ink-300/30 · bg parchment/60 · px-3 py-1 · text-sm
          </p>
        </div>

        {/* Sketch border */}
        <h3 className="font-display text-xl mb-4">Sketch border (image upload drop zones)</h3>
        <div className="paper p-5 mb-6">
          <div className="sketch-border border-ink-300/40 bg-parchment/30 h-24 flex items-center justify-center text-ink-400 text-sm">
            .sketch-border — organic asymmetric radius
          </div>
          <p className="mt-2 text-xs text-ink-300 font-mono">border-radius: 22px 26px 24px 28px / 26px 22px 28px 24px</p>
        </div>

        {/* Divider */}
        <h3 className="font-display text-xl mb-4">Hand-drawn divider</h3>
        <div className="paper p-5">
          <Divider className="my-2" />
          <p className="text-xs text-ink-300 font-mono mt-3">SVG sinusoidal path repeated-x · terracotta-600 stroke · opacity 0.55</p>
        </div>

      </Section>

      {/* ── 6. ICONS ──────────────────────────────────────────────────── */}
      <Section id="icons" title="Icon set">
        <div className="paper p-6">
          <p className="text-sm text-ink-500 mb-6">
            All hand-tuned inline SVGs. Stroke-only, <code>strokeWidth 1.6</code>,
            <code>strokeLinecap round</code>. Default size 22 × 22. Colour inherits from <code>currentColor</code>.
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6">
            {[
              [<IconCamera />, 'Camera'],
              [<IconMic />, 'Mic'],
              [<IconType />, 'Type'],
              [<IconQuestion />, 'Question'],
              [<IconCheck />, 'Check'],
              [<IconArrow />, 'Arrow'],
              [<IconCube />, 'Cube'],
              [<IconAR />, 'AR'],
              [<IconHeart />, 'Heart'],
              [<IconGlobe />, 'Globe'],
              [<IconUser />, 'User'],
              [<IconMenu />, 'Menu'],
              [<IconClose />, 'Close'],
              [<IconPlus />, 'Plus'],
              [<IconSearch />, 'Search'],
              [<IconTrash />, 'Trash'],
            ].map(([icon, name]) => (
              <div key={name} className="flex flex-col items-center gap-2 text-ink-700">
                {icon}
                <span className="text-[11px] text-ink-300">{name}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink-300">
            All live in <code>src/components/Icons.jsx</code>. Add new ones following the same props signature: <code>{'{ className, size }'}</code>.
          </p>
        </div>
      </Section>

      {/* ── 7. DECORATIONS ────────────────────────────────────────────── */}
      <Section id="decorations" title="Decorative elements">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [<Paisley size={96} className="text-terracotta-400" />, 'Paisley', 'Brand mark, hero, CTAs'],
            [<Sun size={96} className="text-mustard-300" />, 'Sun', 'Empty states, loading screens'],
            [<Kolam size={96} className="text-mustard-300" />, 'Kolam', 'Page backgrounds, auth'],
            [<Leaf size={64} className="text-leaf-400" />, 'Leaf', 'Photo tips, nature accents'],
          ].map(([el, name, use]) => (
            <div key={name} className="paper p-6 flex flex-col items-center text-center gap-3">
              {el}
              <div>
                <p className="font-display text-lg">{name}</p>
                <p className="text-sm text-ink-500">{use}</p>
              </div>
            </div>
          ))}
          <div className="paper p-6 flex flex-col items-center text-center gap-3">
            <Divider className="w-full" />
            <div>
              <p className="font-display text-lg">Divider</p>
              <p className="text-sm text-ink-500">Section breaks</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-ink-400">All in <code>src/components/Decorations.jsx</code>. Props: <code>size</code>, <code>className</code>, <code>color</code>.</p>
      </Section>

      {/* ── 8. MOTION ─────────────────────────────────────────────────── */}
      <Section id="motion" title="Motion & animation">
        <div className="paper p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimBox label="animate-sway" sub="6s ease-in-out infinite · ±1.5° rotation · decorations">
              <Paisley size={56} className="text-terracotta-400 animate-sway" />
            </AnimBox>
            <AnimBox label="animate-fade-up" sub="0.5s ease-out · opacity 0→1 + translateY 8px→0 · page transitions">
              <div className="h-12 w-full rounded-xl bg-mustard-200 animate-fade-up" />
            </AnimBox>
            <AnimBox label="animate-pulse-soft" sub="2s ease-in-out infinite · opacity 1→0.55 · loading states">
              <div className="h-12 w-full rounded-xl bg-terracotta-200 animate-pulse-soft" />
            </AnimBox>
            <AnimBox label=".float-y" sub="7s ease-in-out infinite · translateY 0→-6px · hero elements">
              <Sun size={56} className="text-mustard-300 float-y" />
            </AnimBox>
          </div>
          <div className="mt-6 grid gap-2 text-xs text-ink-500">
            <p><strong className="text-ink-700">Principle:</strong> all motion is slow, organic and non-distracting. Max speed 0.5 s.</p>
            <p><strong className="text-ink-700">Focus rings:</strong> <code>ring-4 ring-mustard-200/60</code> — visible, warm, not harsh.</p>
            <p><strong className="text-ink-700">Button press:</strong> <code>active:scale-[0.98]</code> — subtle tactile feedback.</p>
          </div>
        </div>
      </Section>

      {/* ── Border radius ─────────────────────────────────────────────── */}
      <Section id="radius" title="Border radius">
        <div className="paper p-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {[
              ['rounded-full','9999px','Buttons, chips, avatars'],
              ['rounded-2xl','16px','Cards, inputs, images'],
              ['rounded-xl','12px','Thumbnails, tabs'],
              ['sketch-border','22-28px asymmetric','Drop zones, organic areas'],
            ].map(([cls,val,use]) => (
              <div key={cls} className="text-center">
                <div className={`mx-auto h-16 w-16 bg-mustard-200 ${cls === 'sketch-border' ? 'sketch-border border-mustard-300' : cls}`} />
                <code className="text-[11px] block mt-2 text-ink-700">{cls}</code>
                <p className="text-[11px] text-ink-300">{val}</p>
                <p className="text-[11px] text-ink-500">{use}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* footer note */}
      <div className="text-center mt-10 text-sm text-ink-400">
        All tokens live in <code className="bg-parchment px-1.5 py-0.5 rounded-lg">tailwind.config.js</code> and <code className="bg-parchment px-1.5 py-0.5 rounded-lg">src/index.css</code>.
        This page is <code className="bg-parchment px-1.5 py-0.5 rounded-lg">src/pages/DesignSystem.jsx</code>.
      </div>

    </div>
  )
}

function AnimBox({ label, sub, children }) {
  return (
    <div className="paper-soft rounded-2xl border border-ink-300/15 p-4 flex flex-col gap-3 items-center text-center">
      <div className="h-16 flex items-center justify-center w-full">
        {children}
      </div>
      <div>
        <code className="text-xs font-mono text-terracotta-600">{label}</code>
        <p className="text-[11px] text-ink-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
