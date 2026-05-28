export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'guest' | 'staff' | 'admin'
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'reserved'
export type ViewType = 'city' | 'pool' | 'garden' | 'ocean' | 'none'
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type ServiceCategory = 'food' | 'wellness' | 'transport' | 'entertainment' | 'housekeeping'
export type ServiceStatus = 'requested' | 'confirmed' | 'delivered' | 'cancelled'
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'virtual_account' | 'cash'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type Department = 'front_desk' | 'housekeeping' | 'management' | 'maintenance' | 'food_beverage'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  loyalty_points: number
  preferred_room_type: string | null
  date_of_birth: string | null
  nationality: string | null
  passport_number: string | null
  special_requests: string | null
}

export interface Staff {
  id: string
  employee_number: string
  department: Department
  position: string
  hire_date: string
  salary: number | null
  reports_to: string | null
}

export interface RoomType {
  id: string
  name: string
  description: string | null
  base_price_per_night: number
  max_occupancy: number
  amenities: string[]
  created_at: string
}

export interface Room {
  id: string
  room_number: string
  floor: number
  room_type_id: string
  status: RoomStatus
  smoking: boolean
  view_type: ViewType | null
  notes: string | null
  created_at: string
  updated_at: string
  room_types?: RoomType
}

export interface RoomWithType extends Room {
  room_types: RoomType
}

export interface PricingRule {
  id: string
  room_type_id: string
  name: string
  price_multiplier: number
  start_date: string
  end_date: string
  created_at: string
}

export interface Booking {
  id: string
  guest_id: string
  room_id: string
  check_in_date: string
  check_out_date: string
  num_adults: number
  num_children: number
  price_per_night: number
  total_amount: number
  deposit_paid: number
  status: BookingStatus
  processed_by: string | null
  special_requests: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  rooms?: Room
  guests?: Guest & { users?: User }
}

export interface BookingWithDetails extends Booking {
  rooms: RoomWithType
}

export interface Service {
  id: string
  name: string
  description: string | null
  category: ServiceCategory | null
  price: number
  is_active: boolean
  created_at: string
}

export interface BookingService {
  id: string
  booking_id: string
  service_id: string
  guest_id: string
  quantity: number
  unit_price: number
  total_price: number
  scheduled_for: string | null
  delivered_at: string | null
  notes: string | null
  status: ServiceStatus
  fulfilled_by: string | null
  created_at: string
  services?: Service
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_id: string | null
  virtual_account_number: string | null
  paid_at: string | null
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  guest_id: string
  room_id: string
  rating: number
  cleanliness_rating: number | null
  service_rating: number | null
  value_rating: number | null
  title: string | null
  body: string | null
  is_published: boolean
  created_at: string
  users?: Pick<User, 'full_name' | 'avatar_url'>
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  changed_by: string | null
  old_data: Json | null
  new_data: Json | null
  created_at: string
}

// Composite types for UI
export interface RoomSearchParams {
  checkIn: string
  checkOut: string
  guests: number
  roomType?: string
  minPrice?: number
  maxPrice?: number
  viewType?: ViewType
}

export interface BookingFormData {
  roomId: string
  checkInDate: string
  checkOutDate: string
  numAdults: number
  numChildren: number
  specialRequests?: string
}
