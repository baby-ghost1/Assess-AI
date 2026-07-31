export default function BrandLogo({ className = '' }) {
  return (
    <span
      className={`relative inline-block font-logo text-text-primary drop-shadow-[0_0_5px_rgba(99,102,241,0.45)] drop-shadow-[0_0_14px_rgba(99,102,241,0.3)] drop-shadow-[0_0_30px_rgba(99,102,241,0.2)] ${className}`}
    >
      AssessAI
    </span>
  )
}
