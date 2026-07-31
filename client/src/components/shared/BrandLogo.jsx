export default function BrandLogo({ className = '' }) {
  return (
    <span
      className={`relative inline-block font-logo text-text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.9)] drop-shadow-[0_0_20px_rgba(99,102,241,0.7)] drop-shadow-[0_0_40px_rgba(99,102,241,0.45)] ${className}`}
    >
      AssessAI
    </span>
  )
}
