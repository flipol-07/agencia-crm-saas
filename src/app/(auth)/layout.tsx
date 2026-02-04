export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Premium Deep Space Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black" />

      {/* Animated Orbs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-brand-purple/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-neon-blue/10 rounded-full blur-[128px] animate-pulse delay-1000" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
