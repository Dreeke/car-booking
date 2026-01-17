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
      <div className="p-3 bg-gray-50 font-medium text-gray-900 border-b border-r border-gray-200 sticky left-0">
        {car.name}
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
