export interface Car {
  id: string
  name: string
  key_location: string | null
  comment: string | null
  has_alert: boolean
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  is_admin: boolean
}

export interface RecurrenceRule {
  frequency: 'weekly' | 'monthly'
  interval: number // 1 = every week/month, 2 = every other, etc.
  daysOfWeek?: number[] // 0-6 (Sun-Sat), for weekly frequency
  dayOfMonth?: number // 1-31, for monthly frequency
  endType: 'never' | 'on_date' | 'after_count'
  endDate?: string // ISO date, for 'on_date'
  count?: number // for 'after_count'
}

export interface Booking {
  id: string
  car_id: string
  user_id: string
  start_time: string
  end_time: string
  is_whole_day: boolean
  destination: string | null
  created_at: string
  // Recurring booking fields
  series_id: string | null
  recurrence_rule: RecurrenceRule | null
  is_recurrence_exception: boolean
  // Joined data
  car?: Car
  profile?: Profile
}

export interface BookingWithDetails extends Booking {
  car: Car
  profile: Profile
}
