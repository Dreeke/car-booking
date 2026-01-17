'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/lib/auth-context'
import Header from '@/app/components/Header'
import { createClient } from '@/app/lib/supabase'

interface Stats {
  totalBookings: number
  totalCars: number
  totalUsers: number
  bookingsPerCar: { name: string; count: number }[]
  bookingsByDay: { day: string; count: number }[]
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!profile || !profile.is_admin)) {
      router.push('/')
      return
    }

    if (profile?.is_admin) {
      fetchStats()
    }
  }, [profile, authLoading])

  async function fetchStats() {
    setLoading(true)

    const [carsResult, bookingsResult, profilesResult] = await Promise.all([
      supabase.from('cars').select('*'),
      supabase.from('bookings').select('*, car:cars(name)'),
      supabase.from('profiles').select('id'),
    ])

    const cars = carsResult.data || []
    const bookings = bookingsResult.data || []
    const profiles = profilesResult.data || []

    // Count bookings per car
    const carCounts: Record<string, number> = {}
    cars.forEach((car) => {
      carCounts[car.name] = 0
    })
    bookings.forEach((booking: { car?: { name: string } }) => {
      if (booking.car?.name) {
        carCounts[booking.car.name] = (carCounts[booking.car.name] || 0) + 1
      }
    })

    const bookingsPerCar = Object.entries(carCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Count bookings by day of week
    const dayCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    }
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    bookings.forEach((booking: { start_time: string }) => {
      const day = new Date(booking.start_time).getDay()
      dayCounts[dayNames[day]]++
    })

    const bookingsByDay = dayNames.map((day) => ({ day, count: dayCounts[day] }))

    setStats({
      totalBookings: bookings.length,
      totalCars: cars.length,
      totalUsers: profiles.length,
      bookingsPerCar,
      bookingsByDay,
    })

    setLoading(false)
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

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalBookings || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Cars</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalCars || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bookings per Car */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bookings per Car</h2>
            {stats?.bookingsPerCar.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats?.bookingsPerCar.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 bg-blue-500 rounded"
                        style={{
                          width: `${Math.max(
                            20,
                            (item.count / Math.max(...(stats?.bookingsPerCar.map((b) => b.count) || [1]))) * 100
                          )}px`,
                        }}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings by Day */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Busiest Days</h2>
            {stats?.totalBookings === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No data yet</p>
            ) : (
              <div className="space-y-3">
                {stats?.bookingsByDay.map((item) => (
                  <div key={item.day} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300 w-24">{item.day}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="h-4 bg-green-500 rounded"
                        style={{
                          width: `${Math.max(
                            4,
                            (item.count / Math.max(...(stats?.bookingsByDay.map((b) => b.count) || [1]))) * 100
                          )}px`,
                        }}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
