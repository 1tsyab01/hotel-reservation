/*
  # Hotel Reservation Schema Setup

  1. New Extensions
    - uuid-ossp for UUID generation
    - pgcrypto for password hashing utilities

  2. New Tables
    - `users` - Base user table with role (guest/staff/admin)
    - `guests` - Guest subclass with loyalty points, preferences
    - `staff` - Staff subclass with employee info, unary self-reference (reports_to)
    - `room_types` - Room categories with amenities and pricing
    - `rooms` - Individual rooms referencing room_types
    - `pricing_rules` - Seasonal pricing multipliers
    - `bookings` - Binary guest <-> room relationship
    - `services` - Hotel services offered
    - `booking_services` - Ternary guest/booking/service relationship
    - `payments` - Payment records per booking
    - `reviews` - Guest reviews per booking
    - `audit_log` - Change tracking

  3. Views
    - `staff_hierarchy` - Recursive CTE showing org chart

  4. Security
    - RLS enabled on all tables
    - Policies for guest/staff/admin access levels

  5. Seed Data
    - 4 room types, 6 rooms, 7 services, 3 pricing rules
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PARENT TABLE (superclass)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('guest', 'staff', 'admin')) DEFAULT 'guest',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBCLASS 1: guests
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  loyalty_points INTEGER DEFAULT 0,
  preferred_room_type TEXT,
  date_of_birth DATE,
  nationality TEXT,
  passport_number TEXT,
  special_requests TEXT
);

-- SUBCLASS 2: staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('front_desk', 'housekeeping', 'management', 'maintenance', 'food_beverage')),
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  salary DECIMAL(10,2),
  reports_to UUID REFERENCES staff(id) ON DELETE SET NULL
);

-- Staff hierarchy view
CREATE OR REPLACE VIEW staff_hierarchy AS
WITH RECURSIVE hierarchy AS (
  SELECT s.id, u.full_name, s.position, s.department, s.reports_to, 0 AS level
  FROM staff s
  JOIN users u ON u.id = s.id
  WHERE s.reports_to IS NULL
  UNION ALL
  SELECT s.id, u.full_name, s.position, s.department, s.reports_to, h.level + 1
  FROM staff s
  JOIN users u ON u.id = s.id
  JOIN hierarchy h ON h.id = s.reports_to
)
SELECT * FROM hierarchy ORDER BY level, department;

-- Room categories
CREATE TABLE IF NOT EXISTS room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price_per_night DECIMAL(10,2) NOT NULL,
  max_occupancy INTEGER NOT NULL DEFAULT 2,
  amenities JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_number TEXT UNIQUE NOT NULL,
  floor INTEGER NOT NULL,
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')) DEFAULT 'available',
  smoking BOOLEAN DEFAULT FALSE,
  view_type TEXT CHECK (view_type IN ('city', 'pool', 'garden', 'ocean', 'none')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasonal pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type_id UUID NOT NULL REFERENCES room_types(id),
  name TEXT NOT NULL,
  price_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_adults INTEGER NOT NULL DEFAULT 1,
  num_children INTEGER DEFAULT 0,
  price_per_night DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_paid DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
  )) DEFAULT 'pending',
  processed_by UUID REFERENCES staff(id),
  special_requests TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('food', 'wellness', 'transport', 'entertainment', 'housekeeping')),
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ternary relationship: booking_services
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  scheduled_for TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested', 'confirmed', 'delivered', 'cancelled')) DEFAULT 'requested',
  fulfilled_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'debit_card', 'bank_transfer', 'virtual_account', 'cash')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_id TEXT,
  virtual_account_number TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id),
  guest_id UUID NOT NULL REFERENCES guests(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES users(id),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "users_own_profile" ON users;
  DROP POLICY IF EXISTS "admin_all_users" ON users;
  DROP POLICY IF EXISTS "guests_own_bookings" ON bookings;
  DROP POLICY IF EXISTS "staff_manage_bookings" ON bookings;
  DROP POLICY IF EXISTS "public_rooms_read" ON rooms;
  DROP POLICY IF EXISTS "public_room_types_read" ON room_types;
  DROP POLICY IF EXISTS "public_services_read" ON services;
  DROP POLICY IF EXISTS "guests_own_services" ON booking_services;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- POLICIES

-- Users: own profile
CREATE POLICY "users_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admins can see all users
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Guests table
CREATE POLICY "guests_own_record" ON guests
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "guests_insert_own" ON guests
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "guests_update_own" ON guests
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "staff_view_guests" ON guests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Staff table
CREATE POLICY "staff_view_own" ON staff
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admin_manage_staff" ON staff
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Rooms: anyone authenticated can view
CREATE POLICY "public_rooms_read" ON rooms
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_manage_rooms" ON rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Room types: public read
CREATE POLICY "public_room_types_read" ON room_types
  FOR SELECT USING (TRUE);

CREATE POLICY "admin_manage_room_types" ON room_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Pricing rules: public read
CREATE POLICY "public_pricing_read" ON pricing_rules
  FOR SELECT USING (TRUE);

-- Services: active services public read
CREATE POLICY "public_services_read" ON services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "admin_manage_services" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Bookings
CREATE POLICY "guests_own_bookings" ON bookings
  FOR SELECT USING (
    guest_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "guests_create_bookings" ON bookings
  FOR INSERT WITH CHECK (guest_id = auth.uid());

CREATE POLICY "guests_update_own_bookings" ON bookings
  FOR UPDATE USING (guest_id = auth.uid()) WITH CHECK (guest_id = auth.uid());

CREATE POLICY "staff_manage_bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- Booking services
CREATE POLICY "guests_own_services" ON booking_services
  FOR SELECT USING (
    guest_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "guests_create_services" ON booking_services
  FOR INSERT WITH CHECK (guest_id = auth.uid());

-- Payments
CREATE POLICY "guests_own_payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND bookings.guest_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );

CREATE POLICY "guests_create_payments" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings WHERE bookings.id = booking_id AND bookings.guest_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "published_reviews_public" ON reviews
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "guests_own_reviews" ON reviews
  FOR SELECT USING (guest_id = auth.uid());

CREATE POLICY "guests_create_reviews" ON reviews
  FOR INSERT WITH CHECK (guest_id = auth.uid());

CREATE POLICY "guests_update_own_reviews" ON reviews
  FOR UPDATE USING (guest_id = auth.uid()) WITH CHECK (guest_id = auth.uid());

-- Seed: room types
INSERT INTO room_types (name, description, base_price_per_night, max_occupancy, amenities)
SELECT * FROM (VALUES
  ('Standard', 'Comfortable standard room with all essentials for a relaxing stay', 89.00, 2, '["WiFi", "TV", "AC", "Mini Fridge"]'::jsonb),
  ('Deluxe', 'Spacious deluxe room with premium amenities and city or pool views', 149.00, 2, '["WiFi", "Smart TV", "AC", "Minibar", "Bathtub", "Work Desk"]'::jsonb),
  ('Junior Suite', 'Separate living area with luxury touches and panoramic views', 229.00, 3, '["WiFi", "Smart TV", "AC", "Minibar", "Jacuzzi", "Lounge Area", "Coffee Machine"]'::jsonb),
  ('Presidential Suite', 'Top-floor luxury suite with panoramic views and butler service', 599.00, 4, '["WiFi", "Smart TV", "AC", "Full Bar", "Private Terrace", "Butler Service", "Jacuzzi", "Kitchen"]'::jsonb)
) AS v(name, description, base_price_per_night, max_occupancy, amenities)
WHERE NOT EXISTS (SELECT 1 FROM room_types LIMIT 1);

-- Seed: rooms
INSERT INTO rooms (room_number, floor, room_type_id, status, view_type)
SELECT v.room_number, v.floor, rt.id, v.status, v.view_type
FROM (VALUES
  ('101', 1, 'Standard', 'available', 'garden'),
  ('102', 1, 'Standard', 'available', 'city'),
  ('201', 2, 'Deluxe', 'available', 'pool'),
  ('202', 2, 'Deluxe', 'available', 'city'),
  ('301', 3, 'Junior Suite', 'available', 'ocean'),
  ('P1', 10, 'Presidential Suite', 'available', 'ocean')
) AS v(room_number, floor, room_type_name, status, view_type)
JOIN room_types rt ON rt.name = v.room_type_name
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);

-- Seed: services
INSERT INTO services (name, description, category, price)
SELECT * FROM (VALUES
  ('Room Service - Breakfast', 'Continental breakfast delivered to your room', 'food', 25.00),
  ('Room Service - Dinner', 'Full dinner menu delivered to your room', 'food', 45.00),
  ('Spa - 60min Massage', 'Full body relaxation massage', 'wellness', 120.00),
  ('Spa - Facial Treatment', 'Deep cleansing facial', 'wellness', 85.00),
  ('Airport Transfer', 'Private car to/from airport', 'transport', 60.00),
  ('Laundry Service', 'Same-day laundry and pressing', 'housekeeping', 30.00),
  ('Extra Housekeeping', 'Additional room cleaning', 'housekeeping', 20.00)
) AS v(name, description, category, price)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

-- Seed: pricing rules
INSERT INTO pricing_rules (room_type_id, name, price_multiplier, start_date, end_date)
SELECT rt.id, v.name, v.price_multiplier, v.start_date::date, v.end_date::date
FROM (VALUES
  ('Standard', 'Christmas Peak', 1.5, '2025-12-20', '2026-01-05'),
  ('Deluxe', 'Christmas Peak', 1.5, '2025-12-20', '2026-01-05'),
  ('Junior Suite', 'Summer Season', 1.3, '2025-06-01', '2025-08-31')
) AS v(room_type_name, name, price_multiplier, start_date, end_date)
JOIN room_types rt ON rt.name = v.room_type_name
WHERE NOT EXISTS (SELECT 1 FROM pricing_rules LIMIT 1);
