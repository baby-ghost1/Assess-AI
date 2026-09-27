import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { notify } from '@/lib/notify'

export default function CopyableText({ value, maxWidth = '9rem', className = '', alwaysVisible = false }) {
  const [copied, setCopied] = useState(false)

  if (!value) return <span className={className}>-</span>

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      notify.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      notify.error('Unable to copy', { toast: true })
    }
  }

  const reveal = alwaysVisible
    ? 'opacity-100'
    : 'opacity-0 group-hover/copy:opacity-100 focus:opacity-100'

  return (
    <span className={`group/copy inline-flex min-w-0 max-w-full items-center gap-1 ${className}`}>
      <span className="min-w-0 truncate" style={{ maxWidth }} title={value}>
        {value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        title={`Copy "${value}"`}
        aria-label={`Copy ${value}`}
        className={`shrink-0 rounded p-0.5 text-text-secondary transition-opacity hover:text-text-primary ${reveal}`}
      >
        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}
