'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import { createClient } from '@/app/lib/supabase'
import { Car } from '@/app/lib/types'

export default function ManageCars() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [newCarName, setNewCarName] = useState('')
  const [newCarKeyLocation, setNewCarKeyLocation] = useState('')
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [editName, setEditName] = useState('')
  const [editKeyLocation, setEditKeyLocation] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      router.push('/')
      return
    }

    if (profile?.is_admin) {
      fetchCars()
    }
  }, [profile, authLoading])

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
      })
      .eq('id', editingCar.id)

    if (error) {
      setError(error.message)
      return
    }

    setEditingCar(null)
    setEditName('')
    setEditKeyLocation('')
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
  }

  function cancelEditing() {
    setEditingCar(null)
    setEditName('')
    setEditKeyLocation('')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-3xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Cars</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded">{error}</div>
        )}

        {/* Add Car Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Car</h2>
          <form onSubmit={handleAddCar} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={newCarName}
                onChange={(e) => setNewCarName(e.target.value)}
                placeholder="Car name (e.g., Blue Lupo)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Car
              </button>
            </div>
            <input
              type="text"
              value={newCarKeyLocation}
              onChange={(e) => setNewCarKeyLocation(e.target.value)}
              placeholder="Key location (e.g., Hook by front door)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </form>
        </div>

        {/* Car List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 p-6 border-b border-gray-200">
            Current Cars ({cars.length})
          </h2>
          {cars.length === 0 ? (
            <p className="p-6 text-gray-500">No cars added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {cars.map((car) => (
                <li key={car.id} className="p-4">
                  {editingCar?.id === car.id ? (
                    <form onSubmit={handleUpdateCar} className="space-y-2">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Car name"
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editKeyLocation}
                        onChange={(e) => setEditKeyLocation(e.target.value)}
                        placeholder="Key location"
                        className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-gray-900 font-medium">{car.name}</div>
                        {car.key_location && (
                          <div className="text-sm text-gray-500">Key: {car.key_location}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(car)}
                          className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car)}
                          className="px-3 py-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
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
