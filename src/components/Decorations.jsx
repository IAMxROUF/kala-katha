// Hand-drawn SVG decorations to keep the UI feeling crafted, not corporate.

export function Paisley({ className = '', size = 64, color = 'currentColor' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 50 C 8 38, 14 18, 30 14 C 50 10, 58 30, 46 44 C 38 52, 24 56, 18 50 Z" />
      <path d="M22 46 C 18 40, 22 28, 32 26 C 44 24, 48 36, 42 42" />
      <circle cx="34" cy="32" r="2.4" />
      <path d="M28 38 q 4 -2 8 0" />
    </svg>
  )
}

export function Sun({ className = '', size = 80, color = 'currentColor' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="40" cy="40" r="14" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x1 = 40 + Math.cos(a) * 20
        const y1 = 40 + Math.sin(a) * 20
        const x2 = 40 + Math.cos(a) * 30
        const y2 = 40 + Math.sin(a) * 30
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
    </svg>
  )
}

export function Leaf({ className = '', size = 48, color = 'currentColor' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M8 40 C 14 18, 32 8, 42 8 C 42 22, 30 40, 8 40 Z" />
      <path d="M14 36 C 22 26, 32 18, 40 12" />
    </svg>
  )
}

export function Kolam({ className = '', size = 120, color = 'currentColor' }) {
  // Simplified rangoli/kolam line motif — three petals and a center dot.
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke={color}
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <circle cx="60" cy="60" r="3" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 60 60)`}>
          <path d="M60 56 C 50 36, 70 36, 60 56" />
          <path d="M60 50 C 30 26, 90 26, 60 50" />
        </g>
      ))}
    </svg>
  )
}

export function Divider({ className = '' }) {
  return <div className={`ink-divider ${className}`} aria-hidden />
}

export function HandArrow({ className = '', size = 48 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.5}
      viewBox="0 0 48 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12 C 14 6, 28 18, 42 12" />
      <path d="M36 6 L 42 12 L 36 18" />
    </svg>
  )
}
