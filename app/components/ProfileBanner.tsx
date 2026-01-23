'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'
import { shouldShowProfileBanner } from '@/app/lib/profile-utils'

const BANNER_DISMISSED_KEY = 'profile-banner-dismissed'

export default function ProfileBanner() {
  const { user, profile } = useAuth()
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    // Check localStorage after mount
    const wasDismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true'
    setDismissed(wasDismissed)
  }, [])

  const shouldShow = shouldShowProfileBanner(profile, user?.email, dismissed)

  if (!shouldShow) return null

  function handleDismiss() {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">
            Your display name looks like it was auto-generated.{' '}
            <Link href="/profile" className="font-medium underline hover:no-underline">
              Update your profile
            </Link>{' '}
            so others can easily identify your bookings.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 p-1"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
