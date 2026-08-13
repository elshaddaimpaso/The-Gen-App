// components/ui/LoadingSkeleton.tsx
'use client'

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
            <div className="h-4 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          </div>
          <div className="h-8 w-20 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
        </div>

        <div className="glass-card-dark space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#D4AF37]/20 animate-pulse"></div>
            <div className="h-4 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          </div>
          <div className="h-8 w-3/4 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-5 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
            <div className="h-5 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#D4AF37]/10 animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProgrammeSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="h-8 w-40 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
        <div className="flex gap-2 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-16 rounded-xl bg-[#D4AF37]/10 animate-pulse flex-shrink-0"></div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card-dark space-y-2">
            <div className="h-6 w-3/4 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
            <div className="h-4 w-1/2 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
            <div className="h-4 w-1/3 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MeSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4">
      <div className="space-y-4 max-w-md mx-auto">
        <div className="glass-card-dark text-center">
          <div className="h-24 w-24 rounded-full bg-[#D4AF37]/10 animate-pulse mx-auto"></div>
          <div className="h-6 w-40 rounded-lg bg-[#D4AF37]/10 animate-pulse mx-auto mt-4"></div>
          <div className="h-4 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse mx-auto mt-2"></div>
          <div className="h-32 w-32 rounded-xl bg-[#D4AF37]/10 animate-pulse mx-auto mt-4"></div>
        </div>
        <div className="glass-card-dark space-y-2">
          <div className="h-5 w-32 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
          <div className="h-4 w-48 rounded-lg bg-[#D4AF37]/10 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}