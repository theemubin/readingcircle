'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Role = 'student' | 'campus_poc'

const ROLES = [
  {
    value: 'student' as Role,
    label: 'Student Reader',
    emoji: '🎓',
    description: 'Track your reading, earn XP, build streaks, compete with friends.',
  },
  {
    value: 'campus_poc' as Role,
    label: 'Campus Coordinator',
    emoji: '🏫',
    description: 'Manage your campus library, upload EPUBs, monitor student progress.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [campusCode, setCampusCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const updatePayload: Record<string, unknown> = { role: selectedRole }
    if (selectedRole === 'campus_poc' && campusCode.trim()) {
      // Resolve campus_id from invite code — for now store as-is
      updatePayload.campus_id = campusCode.trim()
    }

    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-2xl font-semibold text-white mb-2">Welcome to Readable!</h2>
      <p className="text-slate-400 text-sm mb-6">Choose how you&apos;ll use the app.</p>

      <div className="space-y-3 mb-6">
        {ROLES.map(role => (
          <button
            key={role.value}
            onClick={() => setSelectedRole(role.value)}
            className={`w-full text-left p-4 rounded-xl border-2 transition ${
              selectedRole === role.value
                ? 'border-indigo-500 bg-indigo-600/20'
                : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{role.emoji}</span>
              <div>
                <p className="font-semibold text-white">{role.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{role.description}</p>
              </div>
              {selectedRole === role.value && (
                <span className="ml-auto text-indigo-400">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedRole === 'campus_poc' && (
        <div className="mb-4">
          <label htmlFor="campusCode" className="block text-sm font-medium text-slate-300 mb-1">
            Campus invite code
          </label>
          <input
            id="campusCode"
            type="text"
            value={campusCode}
            onChange={e => setCampusCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder="Enter code provided by admin"
          />
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-4">
          {error}
        </p>
      )}

      <button
        onClick={handleContinue}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
      >
        {loading ? 'Saving…' : 'Continue →'}
      </button>
    </div>
  )
}
