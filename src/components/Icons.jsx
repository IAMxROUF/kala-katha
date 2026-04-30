// Small icon set, hand-tuned strokes to feel sketchy.
// All icons share the same API: { className, size }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconCamera({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M3 8h3l2-3h8l2 3h3v11H3z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export function IconMic({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
      <path d="M9 21h6" />
    </svg>
  )
}

export function IconType({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 7V5h16v2" />
      <path d="M9 5v14" />
      <path d="M15 5v14" />
      <path d="M7 19h10" />
    </svg>
  )
}

export function IconQuestion({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />
      <path d="M12 17.2v.1" />
    </svg>
  )
}

export function IconCheck({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 12.5L9.5 18 20 7" />
    </svg>
  )
}

export function IconArrow({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export function IconCube({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12L4 7.5" />
      <path d="M12 12v9" />
    </svg>
  )
}

export function IconAR({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 8V5h3" />
      <path d="M17 5h3v3" />
      <path d="M20 16v3h-3" />
      <path d="M7 19H4v-3" />
      <path d="M12 8l5 3v5l-5 3-5-3v-5z" />
    </svg>
  )
}

export function IconHeart({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 20s-7-4.5-9-9a4.5 4.5 0 0 1 8.2-2.6L12 9l.8-.6A4.5 4.5 0 0 1 21 11c-2 4.5-9 9-9 9z" />
    </svg>
  )
}

export function IconGlobe({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3 3 15 0 18" />
      <path d="M12 3c-3 3-3 15 0 18" />
    </svg>
  )
}

export function IconUser({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 5-6 8-6s7 2 8 6" />
    </svg>
  )
}

export function IconMenu({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

export function IconClose({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export function IconPlus({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconSearch({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

export function IconTrash({ className = '', size = 22 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  )
}
