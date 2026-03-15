'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

    const updatePayload: Record<string, unknown> = {
      role: selectedRole,
      invite_code: campusCode.trim() || undefined
    }

    if (selectedRole === 'campus_poc' && !campusCode.trim()) {
      setError('A campus invite code is required for coordinators.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      setError(body.error ?? 'Failed to update profile')
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
            className={`w-full text-left p-4 rounded-xl border-2 transition ${selectedRole === role.value
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

      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="campusCode" className="block text-sm font-medium text-slate-300 mb-1.5 flex justify-between">
            <span>Campus invite code</span>
            {selectedRole === 'student' && <span className="text-[10px] text-slate-500 uppercase">Optional</span>}
            {selectedRole === 'campus_poc' && <span className="text-[10px] text-indigo-400 uppercase">Required</span>}
          </label>
          <input
            id="campusCode"
            type="text"
            value={campusCode}
            onChange={e => setCampusCode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            placeholder={selectedRole === 'campus_poc' ? "Enter your POC invite code" : "Enter code to join your campus (optional)"}
          />
        </div>
      </div>

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
