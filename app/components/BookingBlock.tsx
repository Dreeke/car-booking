'use client'

import { BookingWithDetails } from '@/app/lib/types'
import { formatTime } from '@/app/lib/date-utils'
import { useAuth } from '@/app/lib/auth-context'

const USER_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900', hover: 'hover:bg-blue-200 dark:hover:bg-blue-800', border: 'border-blue-300 dark:border-blue-700' },
  { bg: 'bg-green-100 dark:bg-green-900', hover: 'hover:bg-green-200 dark:hover:bg-green-800', border: 'border-green-300 dark:border-green-700' },
  { bg: 'bg-purple-100 dark:bg-purple-900', hover: 'hover:bg-purple-200 dark:hover:bg-purple-800', border: 'border-purple-300 dark:border-purple-700' },
  { bg: 'bg-orange-100 dark:bg-orange-900', hover: 'hover:bg-orange-200 dark:hover:bg-orange-800', border: 'border-orange-300 dark:border-orange-700' },
  { bg: 'bg-pink-100 dark:bg-pink-900', hover: 'hover:bg-pink-200 dark:hover:bg-pink-800', border: 'border-pink-300 dark:border-pink-700' },
  { bg: 'bg-teal-100 dark:bg-teal-900', hover: 'hover:bg-teal-200 dark:hover:bg-teal-800', border: 'border-teal-300 dark:border-teal-700' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800', border: 'border-indigo-300 dark:border-indigo-700' },
  { bg: 'bg-yellow-100 dark:bg-yellow-900', hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800', border: 'border-yellow-300 dark:border-yellow-700' },
]

function getUserColorIndex(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % USER_COLORS.length
}

interface BookingBlockProps {
  booking: BookingWithDetails
  onClick: () => void
}

export default function BookingBlock({ booking, onClick }: BookingBlockProps) {
  const { user } = useAuth()
  const isOwner = user?.id === booking.user_id
  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)

  const colorIndex = getUserColorIndex(booking.user_id)
  const colors = USER_COLORS[colorIndex]

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`w-full text-left p-2 rounded text-sm ${colors.bg} ${colors.hover} border ${colors.border} ${
        isOwner ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''
      }`}
    >
      <div className="font-medium truncate text-gray-900 dark:text-white">
        {booking.profile?.display_name || 'Unknown'}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {booking.is_whole_day
          ? 'All day'
          : `${formatTime(startTime)} - ${formatTime(endTime)}`}
      </div>
      {booking.destination && (
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          → {booking.destination}
        </div>
      )}
    </button>
  )
}
