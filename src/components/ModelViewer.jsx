// Wrapper around <model-viewer> (loaded as a global custom element from
// index.html). Keeps the API React-friendly and centralises styling.

export default function ModelViewer({
  src,
  poster,
  alt = '',
  ar = true,
  className = '',
  height = 420,
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-ink-300/30 bg-parchment/40 text-ink-500 text-sm ${className}`}
        style={{ height }}
      >
        3D model not yet generated
      </div>
    )
  }

  // model-viewer is a Web Component — kebab-case attributes are passed
  // through verbatim by React 18.
  const arProps = ar ? { ar: '' } : {}
  return (
    <model-viewer
      src={src}
      poster={poster}
      alt={alt}
      camera-controls=""
      touch-action="pan-y"
      auto-rotate=""
      shadow-intensity="1"
      exposure="1"
      ar-modes="webxr scene-viewer quick-look"
      reveal="auto"
      className={className}
      style={{ height: `${height}px`, borderRadius: 18, background: 'transparent' }}
      {...arProps}
    >
      <button
        slot="ar-button"
        className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-ivory/95 hover:bg-ivory px-4 py-2 text-sm font-medium shadow-soft border border-ink-300/20"
      >
        View in your room
      </button>
    </model-viewer>
  )
}
