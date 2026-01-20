'use client'

import { useState, useEffect } from 'react'
import { BookingWithDetails } from '@/app/lib/types'
import { formatTime } from '@/app/lib/date-utils'
import { useAuth } from '@/app/lib/auth-context'

// Using inline styles to avoid Tailwind purging issues with dynamic classes
const USER_COLORS = [
  { bg: '#dbeafe', bgDark: '#1e3a8a', border: '#93c5fd', borderDark: '#1e40af' }, // blue
  { bg: '#dcfce7', bgDark: '#14532d', border: '#86efac', borderDark: '#166534' }, // green
  { bg: '#f3e8ff', bgDark: '#581c87', border: '#d8b4fe', borderDark: '#6b21a8' }, // purple
  { bg: '#ffedd5', bgDark: '#7c2d12', border: '#fdba74', borderDark: '#9a3412' }, // orange
  { bg: '#fce7f3', bgDark: '#831843', border: '#f9a8d4', borderDark: '#9d174d' }, // pink
  { bg: '#ccfbf1', bgDark: '#134e4a', border: '#5eead4', borderDark: '#115e59' }, // teal
  { bg: '#e0e7ff', bgDark: '#312e81', border: '#a5b4fc', borderDark: '#3730a3' }, // indigo
  { bg: '#fef9c3', bgDark: '#713f12', border: '#fde047', borderDark: '#854d0e' }, // yellow
  { bg: '#fee2e2', bgDark: '#7f1d1d', border: '#fca5a5', borderDark: '#991b1b' }, // red
  { bg: '#d1fae5', bgDark: '#064e3b', border: '#6ee7b7', borderDark: '#047857' }, // emerald
  { bg: '#e0f2fe', bgDark: '#0c4a6e', border: '#7dd3fc', borderDark: '#0369a1' }, // sky
  { bg: '#fae8ff', bgDark: '#701a75', border: '#f0abfc', borderDark: '#86198f' }, // fuchsia
]

function getUserColorIndex(userId: string): number {
  // Use a better hash function (djb2) with prime multiplier for better distribution
  let hash = 5381
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash * 33) ^ userId.charCodeAt(i)) >>> 0
  }
  return hash % USER_COLORS.length
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isDark
}

interface BookingBlockProps {
  booking: BookingWithDetails
  onClick: () => void
}

export default function BookingBlock({ booking, onClick }: BookingBlockProps) {
  const { user } = useAuth()
  const isDark = useDarkMode()
  const isOwner = user?.id === booking.user_id
  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)

  const colorIndex = getUserColorIndex(booking.user_id)
  const colors = USER_COLORS[colorIndex]

  const bgColor = isDark ? colors.bgDark : colors.bg
  const borderColor = isDark ? colors.borderDark : colors.border

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
      className={`w-full text-left p-2 rounded text-sm border ${
        isOwner ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
    >
      <div className="font-medium truncate text-gray-900 dark:text-white flex items-center gap-1">
        <span className="truncate">{booking.profile?.display_name || 'Unknown'}</span>
        {booking.series_id && (
          <span title="Recurring booking">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
            </svg>
          </span>
        )}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {booking.is_whole_day ? (
          <span className="inline-block px-1.5 py-0.5 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded text-xs font-medium">
            All day
          </span>
        ) : (
          `${formatTime(startTime)} - ${formatTime(endTime)}`
        )}
      </div>
      {booking.destination && (
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          → {booking.destination}
        </div>
      )}
    </button>
  )
}
