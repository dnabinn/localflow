export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">LocalFlow</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-xl font-medium leading-relaxed text-zinc-100">
              "LocalFlow transformed how we manage our three café locations. Reviews, posts, replies — all in one calm workspace."
            </p>
            <footer className="text-sm text-zinc-400">
              — Sarah Chen, Owner of Bloom Café Group
            </footer>
          </blockquote>

          <div className="flex gap-8 text-sm text-zinc-400">
            <div>
              <div className="text-2xl font-semibold text-white">2.4k+</div>
              <div>Businesses</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">98%</div>
              <div>Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white">4.9★</div>
              <div>Rating</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-600">
          © 2025 LocalFlow. Built for local businesses.
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
