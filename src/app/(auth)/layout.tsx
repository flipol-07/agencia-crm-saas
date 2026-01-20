export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background effect - Aurie style */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
