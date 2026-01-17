'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import { createClient } from '@/app/lib/supabase'
import { Profile } from '@/app/lib/types'

interface ProfileWithEmail extends Profile {
  email?: string
}

export default function ManageUsers() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<ProfileWithEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      router.push('/')
      return
    }

    if (profile?.is_admin) {
      fetchUsers()
    }
  }, [profile, authLoading])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('display_name')

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data) setUsers(data)
    setLoading(false)
  }

  async function toggleAdmin(user: ProfileWithEmail) {
    if (user.id === profile?.id) {
      setError("You can't change your own admin status")
      return
    }

    setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
      return
    }

    fetchUsers()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Users</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">{error}</div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registered Users ({users.length})
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Users who have signed in to the system
            </p>
          </div>
          {users.length === 0 ? (
            <p className="p-6 text-gray-500 dark:text-gray-400">No users registered yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <li key={user.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.display_name}
                      {user.id === profile?.id && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(you)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.is_admin ? 'Administrator' : 'Member'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.is_admin ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        Member
                      </span>
                    )}
                    {user.id !== profile?.id && (
                      <button
                        onClick={() => toggleAdmin(user)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
