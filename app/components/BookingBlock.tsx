'use client'

import { BookingWithDetails } from '@/app/lib/types'
import { formatTime } from '@/app/lib/date-utils'
import { useAuth } from '@/app/lib/auth-context'

const USER_COLORS = [
  { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', border: 'border-blue-300' },
  { bg: 'bg-green-100', hover: 'hover:bg-green-200', border: 'border-green-300' },
  { bg: 'bg-purple-100', hover: 'hover:bg-purple-200', border: 'border-purple-300' },
  { bg: 'bg-orange-100', hover: 'hover:bg-orange-200', border: 'border-orange-300' },
  { bg: 'bg-pink-100', hover: 'hover:bg-pink-200', border: 'border-pink-300' },
  { bg: 'bg-teal-100', hover: 'hover:bg-teal-200', border: 'border-teal-300' },
  { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', border: 'border-indigo-300' },
  { bg: 'bg-yellow-100', hover: 'hover:bg-yellow-200', border: 'border-yellow-300' },
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
        isOwner ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
    >
      <div className="font-medium truncate text-gray-900">
        {booking.profile?.display_name || 'Unknown'}
      </div>
      <div className="text-xs text-gray-600">
        {booking.is_whole_day
          ? 'All day'
          : `${formatTime(startTime)} - ${formatTime(endTime)}`}
      </div>
      {booking.destination && (
        <div className="text-xs text-gray-500 truncate">
          → {booking.destination}
        </div>
      )}
    </button>
  )
}
