'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const isDev = process.env.NODE_ENV === 'development'

const DUMMY_ACCOUNTS = [
  { label: 'Student', email: 'student@test.com', password: 'Test1234!' },
  { label: 'Campus PoC', email: 'poc@test.com', password: 'Test1234!' },
  { label: 'Admin', email: 'admin@test.com', password: 'Test1234!' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Persist session cookies for server-side auth checks.
    if (data?.session) {
      const resp = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.session),
      })
      if (!resp.ok) {
        console.error('Failed to set server session', await resp.text())
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    setError(null)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  async function quickLogin(account: typeof DUMMY_ACCOUNTS[0]) {
    setEmail(account.email)
    setPassword(account.password)
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.session) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.session),
      })
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-semibold text-white mb-6">Welcome back</h2>

      {/* Google sign-in */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-lg transition mb-5"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-600" />
        <span className="text-slate-500 text-xs uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-600" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign up
        </Link>
      </p>

      {/* Quick Access/Dummy Accounts Section */}
      <div className="mt-8 border-t border-slate-700 pt-6">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-center">
          Quick Access Identities
        </p>
        <div className="grid grid-cols-1 gap-2">
          {DUMMY_ACCOUNTS.map(account => (
            <button
              key={account.email}
              type="button"
              disabled={loading}
              onClick={() => quickLogin(account)}
              className="group flex items-center justify-between py-3 px-4 bg-slate-800/40 hover:bg-indigo-600/10 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {account.label[0]}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{account.label}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{account.email}</p>
                </div>
              </div>
              <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">Login →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
