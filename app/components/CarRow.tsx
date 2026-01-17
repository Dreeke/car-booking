'use client'

import { Car, BookingWithDetails } from '@/app/lib/types'
import { isSameDay } from '@/app/lib/date-utils'
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

  return (
    <div className="contents">
      <div className="p-2 sm:p-3 bg-gray-50 font-medium text-gray-900 border-b border-r border-gray-200 sticky left-0 z-10">
        <div className="flex items-center gap-1">
          <span className="text-sm sm:text-base">{car.name}</span>
          {car.has_alert && (
            <span className="text-amber-500 flex-shrink-0" title="Needs attention">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      </div>
      {weekDates.map((date) => {
        const dayBookings = getBookingsForDay(date)
        return (
          <div
            key={date.toISOString()}
            className="p-2 border-b border-r border-gray-200 min-h-[80px] hover:bg-gray-50 cursor-pointer"
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
