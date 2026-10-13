// Small, reusable inline SVG icons.
// Each one accepts a `className` so its size can be set with Tailwind
// (e.g. <PlusIcon className="h-4 w-4" />). The stroke uses currentColor, so an
// icon always matches the text colour of whatever it sits inside.

// Adds a sensible default (never squashed inside a flex row).
const sized = (className) => `shrink-0 ${className}`

export function MarkIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M6.5 16l3.5-5 2.5 3.2 2-2.7L18 16" />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </svg>
  )
}

export function PlusIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function ImageIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export function HeartIcon({ filled = false, className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-6 w-6' }) {
  return (
    <svg
      className={sized(className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
