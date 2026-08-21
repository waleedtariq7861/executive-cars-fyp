export default function Logo({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" role="img" aria-label="Executive Cars">
      <rect width="40" height="40" rx="8" fill="#2563eb" />
      <path d="M12 20L20 12L28 20L20 28L12 20Z" fill="white" />
      <circle cx="20" cy="20" r="3" fill="#2563eb" />
    </svg>
  )
}
