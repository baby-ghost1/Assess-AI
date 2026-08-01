import { cn } from '@/lib/utils'

export default function Equalizer({ isPlaying, className, barCount = 5, color = 'bg-primary' }) {
  const bars = Array.from({ length: barCount }, (_, i) => i)

  return (
    <div className={cn('flex items-end gap-[2px]', className)}>
      {bars.map((i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] rounded-full transition-all',
            color,
            isPlaying ? `eq-bar-${(i % 5) + 1}` : 'h-[3px]'
          )}
          style={!isPlaying ? { height: '3px' } : undefined}
        />
      ))}
    </div>
  )
}
