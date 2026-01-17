'use client'

import { useState, useEffect } from 'react'
import { Car, BookingWithDetails } from '@/app/lib/types'
import { createClient } from '@/app/lib/supabase'
import { getWeekDates, formatDisplayDate, addWeeks } from '@/app/lib/date-utils'
import CarRow from './CarRow'
import BookingModal from './BookingModal'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [cars, setCars] = useState<Car[]>([])
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)

  const supabase = createClient()
  const weekDates = getWeekDates(currentDate)

  useEffect(() => {
    fetchData()
  }, [currentDate])

  async function fetchData() {
    setLoading(true)

    const weekStart = weekDates[0]
    const weekEnd = weekDates[6]
    weekEnd.setHours(23, 59, 59, 999)

    const [carsResult, bookingsResult] = await Promise.all([
      supabase.from('cars').select('*').order('name'),
      supabase
        .from('bookings')
        .select('*, car:cars(*), profile:profiles(*)')
        .gte('end_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString()),
    ])

    if (carsResult.data) setCars(carsResult.data)
    if (bookingsResult.data) setBookings(bookingsResult.data as BookingWithDetails[])

    setLoading(false)
  }

  function handleCellClick(car: Car, date: Date) {
    setSelectedCar(car)
    setSelectedDate(date)
    setSelectedBooking(null)
    setModalOpen(true)
  }

  function handleBookingClick(booking: BookingWithDetails) {
    const car = cars.find((c) => c.id === booking.car_id) || null
    setSelectedCar(car)
    setSelectedDate(null)
    setSelectedBooking(booking)
    setModalOpen(true)
  }

  function handlePrevWeek() {
    setCurrentDate(addWeeks(currentDate, -1))
  }

  function handleNextWeek() {
    setCurrentDate(addWeeks(currentDate, 1))
  }

  function handleToday() {
    setCurrentDate(new Date())
  }

  const getBookingsForCar = (carId: string): BookingWithDetails[] => {
    return bookings.filter((b) => b.car_id === carId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            &larr; Prev
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
          >
            Next &rarr;
          </button>
        </div>
        <div className="text-lg font-medium">
          {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: '150px repeat(7, 1fr)' }}
        >
          {/* Header row */}
          <div className="p-3 bg-gray-100 font-medium text-gray-700 border-b border-r border-gray-200">
            Car
          </div>
          {weekDates.map((date) => (
            <div
              key={date.toISOString()}
              className="p-3 bg-gray-100 font-medium text-gray-700 text-center border-b border-r border-gray-200 last:border-r-0"
            >
              {formatDisplayDate(date)}
            </div>
          ))}

          {/* Car rows */}
          {cars.length === 0 ? (
            <div className="col-span-8 p-8 text-center text-gray-500">
              No cars available. Ask an admin to add some cars.
            </div>
          ) : (
            cars.map((car) => (
              <CarRow
                key={car.id}
                car={car}
                weekDates={weekDates}
                bookings={getBookingsForCar(car.id)}
                onCellClick={handleCellClick}
                onBookingClick={handleBookingClick}
              />
            ))
          )}
        </div>
      </div>

      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchData}
        car={selectedCar}
        cars={cars}
        date={selectedDate}
        existingBooking={selectedBooking}
      />
    </div>
  )
}
