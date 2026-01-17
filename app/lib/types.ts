export interface Car {
  id: string
  name: string
  key_location: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  is_admin: boolean
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
  // Joined data
  car?: Car
  profile?: Profile
}

export interface BookingWithDetails extends Booking {
  car: Car
  profile: Profile
}
