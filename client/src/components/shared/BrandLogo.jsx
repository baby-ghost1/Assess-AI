export default function BrandLogo({ className = '' }) {
  return (
    <span
      className={`font-heading font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(99,102,241,0.25)] ${className}`}
    >
      AssessAI
    </span>
  )
}
