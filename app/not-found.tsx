import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-neutral-100 flex items-center justify-center p-6 select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e5484d]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-lg w-full text-center space-y-8 z-10">
        
        {/* Big 404 Display */}
        <div className="space-y-2">
          <h1 className="text-8xl sm:text-9xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-600 drop-shadow-sm">
            404
          </h1>
          <div className="inline-block px-3 py-1 rounded-full bg-[#e5484d]/10 border border-[#e5484d]/20 text-[#e5484d] text-xs font-semibold uppercase tracking-wider">
            Page Not Found
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Lost off the map?
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
            The page or map instance you are looking for {`doesn't`} exist, was removed, or had its URL changed.
          </p>
        </div>

        {/* Card wrapper for Navigation Actions */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 rounded-lg bg-[#e5484d] py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-[#e5484d]/20 hover:bg-[#d03e43] transition-all text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}