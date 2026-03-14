'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Role = Database['public']['Enums']['user_role']

interface ProfileFormProps {
  userId: string
  currentRole: Role
  displayName: string
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'campus_poc', label: 'Campus Coordinator' },
  { value: 'admin', label: 'Admin' },
]

export default function ProfileForm({ userId, currentRole, displayName }: ProfileFormProps) {
  const [role, setRole] = useState<Role>(currentRole)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = currentRole === 'admin'

  async function handleSave() {
    setStatus(null)
    setSaving(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)

    if (error) {
      setStatus(error.message)
      setSaving(false)
      return
    }

    setStatus('Role updated successfully.')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white">Your profile</h2>
        <p className="text-sm text-slate-400 mt-1">
          {displayName} ({currentRole})
        </p>
      </div>

      {isAdmin ? (
        <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6">
          <h3 className="text-base font-semibold text-white mb-2">Role (admin only)</h3>
          <div className="flex flex-col gap-3">
            <select
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Update role'}
            </button>

            {status && (
              <p className="text-sm text-slate-200 bg-slate-900/40 border border-slate-700 rounded-lg px-4 py-3">{status}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-6">
          <h3 className="text-base font-semibold text-white">Role</h3>
          <p className="text-sm text-slate-400">Only admin users can change roles.</p>
        </div>
      )}
    </div>
  )
}
