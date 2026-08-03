import { useState } from 'react'
import { getAllSpinners, setSelectedSpinnerId, getSelectedSpinnerId } from '@/components/shared/spinnerRegistry'
import { useAppSelector } from '@/hooks'

const SPINNERS = getAllSpinners()

export default function SpinnerDemo() {
  const { user } = useAppSelector((s) => s.auth)
  const [selected, setSelected] = useState(null)
  const [active, setActive] = useState(() => getSelectedSpinnerId(user?._id))

  const handleApply = (id) => {
    setSelectedSpinnerId(id, user?._id)
    setActive(id)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Choose Your Loader</h1>
      <p className="text-sm text-[#b3b3b3] mb-8">Click to preview — admin panel se bhi apply kar sakte ho</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10 w-full max-w-5xl">
        {SPINNERS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(selected === s.id ? null : s.id)}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border transition-all cursor-pointer ${
              selected === s.id
                ? 'bg-[#1db954]/10 border-[#1db954]/50 shadow-lg shadow-[#1db954]/10'
                : active === s.id
                  ? 'bg-[#1db954]/5 border-[#1db954]/30'
                  : 'bg-[#121212] border-[#282828] hover:border-[#535353]'
            }`}
          >
            <div className="h-16 flex items-center justify-center">
              {s.render(44)}
            </div>
            <span className={`text-sm font-semibold ${selected === s.id ? 'text-[#1db954]' : 'text-white'}`}>
              {s.name}
            </span>
            {active === s.id && (
              <span className="text-[10px] font-bold text-[#1db954] bg-[#1db954]/10 px-2 py-0.5 rounded-full">ACTIVE</span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-[#121212] border border-[#282828] w-full max-w-md">
          <div className="h-20 flex items-center justify-center">
            {SPINNERS.find((s) => s.id === selected)?.render(56)}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">{SPINNERS.find((s) => s.id === selected)?.name}</h3>
            <p className="text-sm text-[#b3b3b3] mt-1">{SPINNERS.find((s) => s.id === selected)?.desc}</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-[#1a1a1a] border border-[#333]">
            {SPINNERS.find((s) => s.id === selected)?.render(28)}
            <p className="text-sm font-medium loader-shimmer-text">Loading your session...</p>
          </div>
          <button
            onClick={() => handleApply(selected)}
            className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
              active === selected
                ? 'bg-[#1db954]/20 text-[#1db954] cursor-default'
                : 'bg-[#1db954] text-black hover:bg-[#1ed760] active:scale-[0.98]'
            }`}
          >
            {active === selected ? 'Currently Active' : 'Apply This Loader'}
          </button>
        </div>
      )}
    </div>
  )
}
