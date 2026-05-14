// Phone-number normalisation — used everywhere we touch phone numbers so
// that web sign-ups, WhatsApp messages, and craft maker records all match
// regardless of formatting differences.
//
// Canonical format: E.164 without any prefix.
//   "+91 98765 43210"             → "+919876543210"
//   "whatsapp:+919876543210"       → "+919876543210"
//   "9876543210"  (assumes India)  → "+919876543210"
//   "09876543210" (assumes India)  → "+919876543210"
//   "+1 (555) 123-4567"            → "+15551234567"

export function normalizePhone(input) {
  if (!input) return ''
  let s = String(input).trim()
  // Strip Twilio's "whatsapp:" prefix
  s = s.replace(/^whatsapp:/i, '')
  // Remove spaces, dashes, parens, dots
  s = s.replace(/[\s\-().]/g, '')
  if (!s) return ''
  // Already in E.164 form
  if (s.startsWith('+')) return s
  // Strip leading zeros
  s = s.replace(/^0+/, '')
  // 10-digit number → assume India
  if (/^\d{10}$/.test(s)) return '+91' + s
  // 12-digit starting with 91 → assume India without "+"
  if (/^91\d{10}$/.test(s)) return '+' + s
  // Fallback — prepend "+"
  return '+' + s
}

export function samePhone(a, b) {
  const na = normalizePhone(a)
  const nb = normalizePhone(b)
  return !!na && na === nb
}
