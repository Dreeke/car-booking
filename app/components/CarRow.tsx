'use client'

import { useState } from 'react'
import { Car, BookingWithDetails } from '@/app/lib/types'
import { isSameDay } from '@/app/lib/date-utils'
import { useAuth } from '@/app/lib/auth-context'
import BookingBlock from './BookingBlock'

interface CarRowProps {
  car: Car
  weekDates: Date[]
  bookings: BookingWithDetails[]
  onCellClick: (car: Car, date: Date) => void
  onBookingClick: (booking: BookingWithDetails) => void
}

export default function CarRow({
  car,
  weekDates,
  bookings,
  onCellClick,
  onBookingClick,
}: CarRowProps) {
  const { profile } = useAuth()
  const [showTooltip, setShowTooltip] = useState(false)
  const isAdmin = profile?.is_admin || false

  const getBookingsForDay = (date: Date): BookingWithDetails[] => {
    return bookings.filter((booking) => {
      const bookingStart = new Date(booking.start_time)
      const bookingEnd = new Date(booking.end_time)
      return (
        isSameDay(bookingStart, date) ||
        isSameDay(bookingEnd, date) ||
        (bookingStart < date && bookingEnd > date)
      )
    })
  }

  const hasInfo = car.key_location || car.has_alert || car.comment

  return (
    <div className="contents">
      <div className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 font-medium text-gray-900 dark:text-white border-b border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10">
        <div
          className="relative flex items-center gap-1"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className={`text-sm sm:text-base ${hasInfo ? 'cursor-help underline decoration-dotted underline-offset-2' : ''}`}>
            {car.name}
          </span>
          {car.has_alert && (
            <span className="text-amber-500 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </span>
          )}

          {/* Tooltip */}
          {showTooltip && hasInfo && (
            <div className="absolute left-0 top-full mt-1 z-50 w-64 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                {car.name}
              </div>

              {car.has_alert && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <span>Needs attention</span>
                </div>
              )}

              {car.key_location && (
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-medium">Key:</span> {car.key_location}
                </div>
              )}

              {car.comment && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <span className="font-medium not-italic">Note:</span> {car.comment}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {weekDates.map((date) => {
        const dayBookings = getBookingsForDay(date)
        return (
          <div
            key={date.toISOString()}
            className="p-2 border-b border-r border-gray-200 dark:border-gray-700 min-h-[80px] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer bg-white dark:bg-gray-900"
            onClick={() => onCellClick(car, date)}
          >
            <div className="space-y-1">
              {dayBookings.map((booking) => (
                <BookingBlock
                  key={booking.id}
                  booking={booking}
                  onClick={() => {
                    onBookingClick(booking)
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
