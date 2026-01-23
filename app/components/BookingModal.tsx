'use client'

import { useState, useEffect } from 'react'
import { Car, BookingWithDetails, RecurrenceRule } from '@/app/lib/types'
import { useAuth } from '@/app/lib/auth-context'
import { createClient } from '@/app/lib/supabase'
import { formatDate, generateRecurrenceInstances } from '@/app/lib/date-utils'

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
  const [selectedEndDate, setSelectedEndDate] = useState('')
  const [destination, setDestination] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'weekly' | 'monthly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1)
  const [recurrenceEndType, setRecurrenceEndType] = useState<'after_count' | 'on_date' | 'never'>('after_count')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [recurrenceCount, setRecurrenceCount] = useState(12)
  const [editScope, setEditScope] = useState<'this' | 'future'>('this')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteScope, setDeleteScope] = useState<'this' | 'future'>('this')

  useEffect(() => {
    if (existingBooking) {
      const start = new Date(existingBooking.start_time)
      const end = new Date(existingBooking.end_time)
      setSelectedDate(formatDate(start))
      setSelectedEndDate(formatDate(end))
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
      setSelectedEndDate('')
      setSelectedCarId(car.id)
      setIsWholeDay(false)
      setStartTime('09:00')
      setEndTime('17:00')
      setDestination('')
      // Reset recurrence state
      setIsRecurring(false)
      setRecurrenceFrequency('weekly')
      setRecurrenceInterval(1)
      setRecurrenceDays([date.getDay()]) // Default to the selected day
      setRecurrenceDayOfMonth(date.getDate())
      setRecurrenceEndType('after_count')
      setRecurrenceCount(12)
      setRecurrenceEndDate('')
    }
    setError('')
    setEditScope('this')
    setShowDeleteConfirm(false)
  }, [existingBooking, date, car, isOpen])

  if (!isOpen) return null

  const isBookingOwner = existingBooking ? user?.id === existingBooking.user_id : true
  const canEdit = isBookingOwner || profile?.is_admin || profile?.is_owner
  const isRecurringSeries = existingBooking?.series_id != null

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCarId || !user) return

    setLoading(true)
    setError('')

    // Determine if this is a multi-day booking (ensure boolean, not empty string)
    const isMultiDay = Boolean(selectedEndDate && selectedEndDate !== selectedDate)
    const effectiveEndDate = isMultiDay ? selectedEndDate : selectedDate

    const startDateTime = isWholeDay || isMultiDay
      ? new Date(`${selectedDate}T00:00:00`)
      : new Date(`${selectedDate}T${startTime}:00`)

    const endDateTime = isWholeDay || isMultiDay
      ? new Date(`${effectiveEndDate}T23:59:59`)
      : new Date(`${selectedDate}T${endTime}:00`)

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time')
      setLoading(false)
      return
    }

    // Check for overlapping bookings on the same car
    const { data: overlapping } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, profile:profiles(display_name)')
      .eq('car_id', selectedCarId)
      .lt('start_time', endDateTime.toISOString())
      .gt('end_time', startDateTime.toISOString())

    // Filter out the current booking when editing
    const conflicts = overlapping?.filter(
      (b) => !existingBooking || b.id !== existingBooking.id
    )

    if (conflicts && conflicts.length > 0) {
      const conflict = conflicts[0]
      const conflictStart = new Date(conflict.start_time)
      const conflictEnd = new Date(conflict.end_time)
      const profile = conflict.profile as { display_name: string }[] | null
      const bookedBy = profile?.[0]?.display_name || 'someone'
      setError(
        `This car is already booked by ${bookedBy} from ${conflictStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${conflictEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on ${conflictStart.toLocaleDateString()}`
      )
      setLoading(false)
      return
    }

    // Handle recurring booking creation
    if (isRecurring && !existingBooking) {
      // Validate recurrence settings
      if (recurrenceFrequency === 'weekly' && recurrenceDays.length === 0) {
        setError('Please select at least one day of the week')
        setLoading(false)
        return
      }

      const rule: RecurrenceRule = {
        frequency: recurrenceFrequency,
        interval: recurrenceInterval,
        daysOfWeek: recurrenceFrequency === 'weekly' ? recurrenceDays : undefined,
        dayOfMonth: recurrenceFrequency === 'monthly' ? recurrenceDayOfMonth : undefined,
        endType: recurrenceEndType,
        endDate: recurrenceEndType === 'on_date' ? recurrenceEndDate : undefined,
        count: recurrenceEndType === 'after_count' ? recurrenceCount : undefined,
      }

      const instances = generateRecurrenceInstances(startDateTime, endDateTime, rule)

      if (instances.length === 0) {
        setError('No occurrences would be created with these settings')
        setLoading(false)
        return
      }

      // Check conflicts for ALL instances
      for (const instance of instances) {
        const { data: conflicts } = await supabase
          .from('bookings')
          .select('id, start_time, profile:profiles(display_name)')
          .eq('car_id', selectedCarId)
          .lt('start_time', instance.end.toISOString())
          .gt('end_time', instance.start.toISOString())

        if (conflicts && conflicts.length > 0) {
          const profile = conflicts[0].profile as { display_name: string }[] | null
          const bookedBy = profile?.[0]?.display_name || 'someone'
          setError(
            `Conflict on ${instance.start.toLocaleDateString()}: car already booked by ${bookedBy}. Please resolve before creating recurring booking.`
          )
          setLoading(false)
          return
        }
      }

      // Create all instances with shared series_id
      const seriesId = crypto.randomUUID()
      const bookingsToInsert = instances.map((instance, index) => ({
        car_id: selectedCarId,
        user_id: user.id,
        start_time: instance.start.toISOString(),
        end_time: instance.end.toISOString(),
        is_whole_day: isWholeDay,
        destination: destination || null,
        series_id: seriesId,
        recurrence_rule: index === 0 ? rule : null,
        is_recurrence_exception: false,
      }))

      const { error: insertError } = await supabase.from('bookings').insert(bookingsToInsert)

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setLoading(false)
      onSave()
      onClose()
      return
    }

    // Handle editing recurring booking - all future occurrences
    if (existingBooking && isRecurringSeries && editScope === 'future') {
      // Fetch all future bookings in this series
      const { data: futureBookings, error: fetchError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('series_id', existingBooking.series_id)
        .gte('start_time', existingBooking.start_time)

      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }

      // Update each booking with new times while preserving the date
      for (const booking of futureBookings || []) {
        const bookingDate = new Date(booking.start_time)
        const dateStr = formatDate(bookingDate)

        let newStart: Date
        let newEnd: Date

        if (isWholeDay || isMultiDay) {
          newStart = new Date(`${dateStr}T00:00:00`)
          newEnd = new Date(`${dateStr}T23:59:59`)
        } else {
          newStart = new Date(`${dateStr}T${startTime}:00`)
          newEnd = new Date(`${dateStr}T${endTime}:00`)
        }

        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            is_whole_day: isWholeDay || isMultiDay,
            destination: destination || null,
            car_id: selectedCarId,
          })
          .eq('id', booking.id)

        if (updateError) {
          setError(updateError.message)
          setLoading(false)
          return
        }
      }

      setLoading(false)
      onSave()
      onClose()
      return
    }

    // Standard single booking create/update
    const bookingData: Record<string, unknown> = {
      car_id: selectedCarId,
      user_id: user.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      is_whole_day: isWholeDay || isMultiDay,
      destination: destination || null,
    }

    // Mark as exception if editing a recurring booking
    if (existingBooking && isRecurringSeries && editScope === 'this') {
      bookingData.is_recurrence_exception = true
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

    // For recurring bookings, show confirmation dialog first
    if (isRecurringSeries && !showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setLoading(true)

    let deleteError
    if (isRecurringSeries && deleteScope === 'future') {
      // Delete this and all future occurrences
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('series_id', existingBooking.series_id)
        .gte('start_time', existingBooking.start_time)
      deleteError = error
    } else {
      // Delete just this one
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', existingBooking.id)
      deleteError = error
    }

    if (deleteError) {
      setError(deleteError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setShowDeleteConfirm(false)
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={selectedEndDate}
                  onChange={(e) => setSelectedEndDate(e.target.value)}
                  min={selectedDate}
                  disabled={!canEdit}
                  placeholder="Same day"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {(!selectedEndDate || selectedEndDate === selectedDate) && (
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
            )}

            {selectedEndDate && selectedEndDate !== selectedDate && (
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm">
                Multi-day booking: {Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
              </div>
            )}

            {!isWholeDay && (!selectedEndDate || selectedEndDate === selectedDate) && (
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

            {/* Recurrence options for new bookings */}
            {!existingBooking && !selectedEndDate && canEdit && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Repeat this booking
                  </label>
                </div>

                {isRecurring && (
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Repeat</span>
                      <select
                        value={recurrenceFrequency}
                        onChange={(e) => setRecurrenceFrequency(e.target.value as 'weekly' | 'monthly')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <span className="text-sm text-gray-600 dark:text-gray-400">every</span>
                      <input
                        type="number"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {recurrenceFrequency === 'weekly' ? 'week(s)' : 'month(s)'}
                      </span>
                    </div>

                    {recurrenceFrequency === 'weekly' && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">On:</span>
                        <div className="flex gap-1">
                          {dayLabels.map((label, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleDay(index)}
                              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                recurrenceDays.includes(index)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {recurrenceFrequency === 'monthly' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">On day</span>
                        <input
                          type="number"
                          value={recurrenceDayOfMonth}
                          onChange={(e) => setRecurrenceDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          min={1}
                          max={31}
                          className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">of each month</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Ends:</span>
                      <select
                        value={recurrenceEndType}
                        onChange={(e) => setRecurrenceEndType(e.target.value as 'after_count' | 'on_date' | 'never')}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="after_count">After N occurrences</option>
                        <option value="on_date">On date</option>
                        <option value="never">Never (1 year max)</option>
                      </select>
                    </div>

                    {recurrenceEndType === 'after_count' && (
                      <div className="flex items-center gap-2 pl-4">
                        <input
                          type="number"
                          value={recurrenceCount}
                          onChange={(e) => setRecurrenceCount(Math.max(1, parseInt(e.target.value) || 1))}
                          min={1}
                          max={52}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">occurrences</span>
                      </div>
                    )}

                    {recurrenceEndType === 'on_date' && (
                      <div className="pl-4">
                        <input
                          type="date"
                          value={recurrenceEndDate}
                          onChange={(e) => setRecurrenceEndDate(e.target.value)}
                          min={selectedDate}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Edit scope selector for recurring bookings */}
            {existingBooking && isRecurringSeries && canEdit && !showDeleteConfirm && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                  This is a recurring booking. Apply changes to:
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="editScope"
                      value="this"
                      checked={editScope === 'this'}
                      onChange={() => setEditScope('this')}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-blue-700 dark:text-blue-300">This occurrence only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="editScope"
                      value="future"
                      checked={editScope === 'future'}
                      onChange={() => setEditScope('future')}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-blue-700 dark:text-blue-300">This and all future occurrences</span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">{error}</div>
            )}
          </div>

          {/* Delete confirmation for recurring bookings */}
          {showDeleteConfirm && isRecurringSeries && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded mt-4">
              <p className="text-sm text-red-800 dark:text-red-200 mb-2 font-medium">
                Delete recurring booking:
              </p>
              <div className="space-y-1 mb-3">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteScope"
                    value="this"
                    checked={deleteScope === 'this'}
                    onChange={() => setDeleteScope('this')}
                    className="text-red-600"
                  />
                  <span className="text-sm text-red-700 dark:text-red-300">This occurrence only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deleteScope"
                    value="future"
                    checked={deleteScope === 'future'}
                    onChange={() => setDeleteScope('future')}
                    className="text-red-600"
                  />
                  <span className="text-sm text-red-700 dark:text-red-300">This and all future occurrences</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-end">
            {existingBooking && canEdit && !showDeleteConfirm && (
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
            {canEdit && !showDeleteConfirm && (
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
