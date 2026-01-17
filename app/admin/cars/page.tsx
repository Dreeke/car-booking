'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import { createClient } from '@/app/lib/supabase'
import { Car } from '@/app/lib/types'

export default function CarsPage() {
  const { profile, loading: authLoading } = useAuth()
  const supabase = createClient()

  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [newCarName, setNewCarName] = useState('')
  const [newCarKeyLocation, setNewCarKeyLocation] = useState('')
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [editName, setEditName] = useState('')
  const [editKeyLocation, setEditKeyLocation] = useState('')
  const [editComment, setEditComment] = useState('')
  const [editHasAlert, setEditHasAlert] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = profile?.is_admin || false

  useEffect(() => {
    if (!authLoading) {
      fetchCars()
    }
  }, [authLoading])

  async function fetchCars() {
    setLoading(true)
    const { data } = await supabase.from('cars').select('*').order('name')
    if (data) setCars(data)
    setLoading(false)
  }

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault()
    if (!newCarName.trim()) return

    setError('')
    const { error } = await supabase.from('cars').insert({
      name: newCarName.trim(),
      key_location: newCarKeyLocation.trim() || null,
    })

    if (error) {
      setError(error.message)
      return
    }

    setNewCarName('')
    setNewCarKeyLocation('')
    fetchCars()
  }

  async function handleUpdateCar(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCar || !editName.trim()) return

    setError('')
    const { error } = await supabase
      .from('cars')
      .update({
        name: editName.trim(),
        key_location: editKeyLocation.trim() || null,
        comment: editComment.trim() || null,
        has_alert: editHasAlert,
      })
      .eq('id', editingCar.id)

    if (error) {
      setError(error.message)
      return
    }

    cancelEditing()
    fetchCars()
  }

  async function handleDeleteCar(car: Car) {
    if (!confirm(`Delete "${car.name}"? All bookings for this car will also be deleted.`)) {
      return
    }

    setError('')
    const { error } = await supabase.from('cars').delete().eq('id', car.id)

    if (error) {
      setError(error.message)
      return
    }

    fetchCars()
  }

  function startEditing(car: Car) {
    setEditingCar(car)
    setEditName(car.name)
    setEditKeyLocation(car.key_location || '')
    setEditComment(car.comment || '')
    setEditHasAlert(car.has_alert || false)
  }

  function cancelEditing() {
    setEditingCar(null)
    setEditName('')
    setEditKeyLocation('')
    setEditComment('')
    setEditHasAlert(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isAdmin ? 'Manage Cars' : 'Cars'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">{error}</div>
        )}

        {/* Add Car Form - Admin only */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Car</h2>
            <form onSubmit={handleAddCar} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCarName}
                  onChange={(e) => setNewCarName(e.target.value)}
                  placeholder="Car name (e.g., Blue Lupo)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  Add Car
                </button>
              </div>
              <input
                type="text"
                value={newCarKeyLocation}
                onChange={(e) => setNewCarKeyLocation(e.target.value)}
                placeholder="Key location (e.g., Hook by front door)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </form>
          </div>
        )}

        {/* Car List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">
            {isAdmin ? `Current Cars (${cars.length})` : `Available Cars (${cars.length})`}
          </h2>
          {cars.length === 0 ? (
            <p className="p-6 text-gray-500 dark:text-gray-400">No cars added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {cars.map((car) => (
                <li key={car.id} className="p-4">
                  {editingCar?.id === car.id ? (
                    <form onSubmit={handleUpdateCar} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Car name"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm border border-gray-300 dark:border-gray-600 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={editKeyLocation}
                        onChange={(e) => setEditKeyLocation(e.target.value)}
                        placeholder="Key location"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Admin notes (not visible to regular users)"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editHasAlert}
                          onChange={(e) => setEditHasAlert(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Alert flag (needs repair/attention)
                        </span>
                      </label>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white font-medium">{car.name}</span>
                          {car.has_alert && (
                            <span className="text-amber-500" title="Needs attention">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        {car.key_location && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">Key: {car.key_location}</div>
                        )}
                        {isAdmin && car.comment && (
                          <div className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">Note: {car.comment}</div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(car)}
                            className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCar(car)}
                            className="px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
