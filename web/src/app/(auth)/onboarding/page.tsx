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
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestData, setRequestData] = useState({ name: '', email: '', message: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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

  async function handleRequestCampus(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/campus-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Request failed')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✓</div>
        <h2 className="text-2xl font-semibold text-white mb-2">Request Submitted!</h2>
        <p className="text-slate-400 text-sm mb-8">
          Our team will review your campus request and get back to you at <strong>{requestData.email}</strong>.
          Usually this takes less than 24 hours.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
        >
          Go to Dashboard (Student mode)
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      {!showRequestForm ? (
        <>
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
                {selectedRole === 'campus_poc' && <span className="text-[10px] text-indigo-400 uppercase tracking-tight">Required for coordinators</span>}
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
            {selectedRole === 'campus_poc' && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium tracking-tight"
              >
                Don&apos;t have an invite code? Request to register your campus.
              </button>
            )}
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
        </>
      ) : (
        <form onSubmit={handleRequestCampus} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <button
            type="button"
            onClick={() => setShowRequestForm(false)}
            className="text-slate-500 hover:text-slate-300 text-sm mb-2"
          >
            ← Back to role selection
          </button>
          <h2 className="text-2xl font-semibold text-white mb-2">Request Campus Access</h2>
          <p className="text-slate-400 text-sm mb-6">Tell us about your institution and we&apos;ll get you set up.</p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Campus/School Name</label>
            <input
              required
              value={requestData.name}
              onChange={e => setRequestData(d => ({ ...d, name: e.target.value }))}
              placeholder="e.g. NavGurukul Tech Institute"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contact Email</label>
            <input
              required
              type="email"
              value={requestData.email}
              onChange={e => setRequestData(d => ({ ...d, email: e.target.value }))}
              placeholder="you@institution.edu"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Message (Optional)</label>
            <textarea
              value={requestData.message}
              onChange={e => setRequestData(d => ({ ...d, message: e.target.value }))}
              placeholder="Briefly describe your institution's needs…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
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
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      )}
    </div>
  )
}
