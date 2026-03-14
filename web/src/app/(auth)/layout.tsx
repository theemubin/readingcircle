import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Readable',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">📚 Readable</h1>
          <p className="text-slate-400 mt-2 text-sm">Level up your reading life</p>
        </div>
        {children}
      </div>
    </div>
  )
}
