'use client'

import { useState, useEffect } from 'react'
import { Car, BookingWithDetails } from '@/app/lib/types'
import { useAuth } from '@/app/lib/auth-context'
import { createClient } from '@/app/lib/supabase'
import { formatDate } from '@/app/lib/date-utils'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  car: Car | null
  cars: Car[]
  date: Date | null
  existingBooking: BookingWithDetails | null
}

export default function BookingModal({
  isOpen,
  onClose,
  onSave,
  car,
  cars,
  date,
  existingBooking,
}: BookingModalProps) {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [selectedCarId, setSelectedCarId] = useState('')
  const [isWholeDay, setIsWholeDay] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [selectedDate, setSelectedDate] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existingBooking) {
      const start = new Date(existingBooking.start_time)
      const end = new Date(existingBooking.end_time)
      setSelectedDate(formatDate(start))
      setSelectedCarId(existingBooking.car_id)
      setIsWholeDay(existingBooking.is_whole_day)
      setDestination(existingBooking.destination || '')
      if (!existingBooking.is_whole_day) {
        setStartTime(
          start.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        )
        setEndTime(
          end.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        )
      }
    } else if (date && car) {
      setSelectedDate(formatDate(date))
      setSelectedCarId(car.id)
      setIsWholeDay(false)
      setStartTime('09:00')
      setEndTime('17:00')
      setDestination('')
    }
    setError('')
  }, [existingBooking, date, car, isOpen])

  if (!isOpen) return null

  const isOwner = existingBooking ? user?.id === existingBooking.user_id : true
  const canEdit = isOwner || profile?.is_admin

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCarId || !user) return

    setLoading(true)
    setError('')

    const startDateTime = isWholeDay
      ? new Date(`${selectedDate}T00:00:00`)
      : new Date(`${selectedDate}T${startTime}:00`)

    const endDateTime = isWholeDay
      ? new Date(`${selectedDate}T23:59:59`)
      : new Date(`${selectedDate}T${endTime}:00`)

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time')
      setLoading(false)
      return
    }

    const bookingData = {
      car_id: selectedCarId,
      user_id: user.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_whole_day: isWholeDay,
      destination: destination || null,
    }

    let result
    if (existingBooking) {
      result = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', existingBooking.id)
    } else {
      result = await supabase.from('bookings').insert(bookingData)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSave()
    onClose()
  }

  async function handleDelete() {
    if (!existingBooking) return

    setLoading(true)
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', existingBooking.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {existingBooking ? 'Edit Booking' : 'New Booking'}
        </h2>

        {existingBooking && !canEdit && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
            This booking belongs to {existingBooking.profile?.display_name}. You
            can only view it.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Car
              </label>
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {selectedCarId && cars.find(c => c.id === selectedCarId)?.key_location && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Key location: {cars.find(c => c.id === selectedCarId)?.key_location}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wholeDay"
                checked={isWholeDay}
                onChange={(e) => setIsWholeDay(e.target.checked)}
                disabled={!canEdit}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <label htmlFor="wholeDay" className="text-sm text-gray-700 dark:text-gray-300">
                Whole day
              </label>
            </div>

            {!isWholeDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where are you going?"
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">{error}</div>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            {existingBooking && canEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : existingBooking ? 'Update' : 'Book'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
