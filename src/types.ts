export interface YogaClass {
  id: number
  title: string
  instructor: string
  date: string
  time: string
  duration: string
  spots: number
  totalSpots: number
  level: 'Beginner' | 'Intermediate' | 'All Levels'
  dogs: string[]
  price: number
  emoji: string
  avgRating: number | null
  reviewCount: number
}

export interface BookingFormData {
  name: string
  email: string
  phone: string
}

export interface Booking extends BookingFormData {
  classId: number
  bookedAt: string
}

export interface WaitlistEntry {
  classId: number
  email: string
}

export interface AuthUser {
  userId: number
  name: string
  email: string
  isAdmin: boolean
}

export interface Review {
  id: number
  classId: number
  userId: number
  userName: string
  rating: number
  comment: string
  createdAt: string
}
