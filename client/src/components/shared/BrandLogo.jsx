export default function BrandLogo({ className = '' }) {
  return (
    <span className={`relative inline-block font-logo text-text-primary ${className}`}>
      <span aria-hidden className="absolute -inset-x-3 inset-y-[-8px] rounded-full bg-primary/30 blur-lg" />
      <span className="relative">AssessAI</span>
    </span>
  )
}
