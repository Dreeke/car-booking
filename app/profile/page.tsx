'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import { createClient } from '@/app/lib/supabase'
import { isValidDisplayName, isNameTooSimilarToEmail } from '@/app/lib/profile-utils'

const BANNER_DISMISSED_KEY = 'profile-banner-dismissed'

function ProfileForm() {
  const { user, profile, loading: authLoading, needsProfileSetup, refreshProfile } = useAuth()
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetupMode = searchParams.get('setup') === 'true'

  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
    }
  }, [profile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !displayName.trim()) return

    setMessage(null)

    // Validate display name
    if (!isValidDisplayName(displayName)) {
      setMessage({ type: 'error', text: 'Please enter a valid display name (at least 2 characters)' })
      return
    }

    // Check if name is too similar to email
    if (isNameTooSimilarToEmail(displayName, user.email)) {
      setMessage({ type: 'error', text: 'Please enter your real name, not your email username' })
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        profile_completed: true,
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    // Clear the banner dismissal so if they later revert to a bad name, they'll see it
    localStorage.removeItem(BANNER_DISMISSED_KEY)

    // Refresh profile in context before any redirect
    await refreshProfile()

    if (isSetupMode) {
      // Redirect to home after completing setup
      router.push('/')
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <main className="max-w-md mx-auto py-6 px-4">
      {isSetupMode && needsProfileSetup ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Before you start booking cars, please set your display name. This helps others identify who has booked each car.
          </p>
        </>
      ) : (
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Profile</h1>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name (e.g., John Smith)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isSetupMode && needsProfileSetup
                ? 'Enter your real name so others can identify your bookings'
                : 'This is how others will see you'}
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isSetupMode && needsProfileSetup ? 'Continue' : 'Save Changes'}
          </button>
        </form>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        }
      >
        <ProfileForm />
      </Suspense>
    </div>
  )
}
