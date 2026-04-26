-- ============================================================
-- SAFFERNI SUPABASE SETUP
-- Paste this entire file into: Supabase Dashboard > SQL Editor
-- Run it once. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================


-- ============================================================
-- PART 1: ATOMIC BOOKING RPC
-- Fixes the race condition: checks and decrements seats in one
-- transaction so two users can never double-book the same seat.
-- ============================================================

CREATE OR REPLACE FUNCTION book_trip_seat(
  p_trip_id       uuid,
  p_user_id       uuid,
  p_passenger_name text,
  p_passenger_phone text,
  p_seats         int,
  p_payment_method text,
  p_ref_code      text,
  p_total_price   numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available int;
  v_booking_id uuid;
BEGIN
  -- Lock the trip row for this transaction
  SELECT available_seats INTO v_available
  FROM trips
  WHERE id = p_trip_id AND status = 'active' AND approved = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trip not found or not active');
  END IF;

  IF v_available < p_seats THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough seats available');
  END IF;

  -- Insert booking
  INSERT INTO bookings (
    trip_id, user_id, passenger_name, passenger_phone,
    seats, payment_method, status, ref_code, total_price
  ) VALUES (
    p_trip_id, p_user_id, p_passenger_name, p_passenger_phone,
    p_seats, p_payment_method, 'pending', p_ref_code, p_total_price
  )
  RETURNING id INTO v_booking_id;

  -- Decrement seats atomically
  UPDATE trips
  SET available_seats = available_seats - p_seats
  WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;


-- ============================================================
-- PART 2: ROW LEVEL SECURITY (RLS)
-- This is what actually prevents unauthorized DB access.
-- The frontend checks are just UI — these enforce permissions
-- at the database level so even direct API calls are blocked.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_ratings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_edit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes     ENABLE ROW LEVEL SECURITY;


-- ── PROFILES ──────────────────────────────────────────────

-- Anyone can read public profile info (needed for driver listings)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only the system (via service role) or the user themselves can insert
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can update any profile (for role changes)
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── TRIPS ─────────────────────────────────────────────────

-- Anyone can view active approved trips
DROP POLICY IF EXISTS "trips_select_public" ON trips;
CREATE POLICY "trips_select_public" ON trips
  FOR SELECT USING (status = 'active' AND approved = true);

-- Admins and drivers can see all trips
DROP POLICY IF EXISTS "trips_select_privileged" ON trips;
CREATE POLICY "trips_select_privileged" ON trips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'driver')
    )
  );

-- Only drivers can create trips (for their own driver_id)
DROP POLICY IF EXISTS "trips_insert_driver" ON trips;
CREATE POLICY "trips_insert_driver" ON trips
  FOR INSERT WITH CHECK (
    auth.uid() = driver_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- Drivers can update only their own trips
DROP POLICY IF EXISTS "trips_update_driver" ON trips;
CREATE POLICY "trips_update_driver" ON trips
  FOR UPDATE USING (
    auth.uid() = driver_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'driver'
    )
  );

-- Admins can update any trip
DROP POLICY IF EXISTS "trips_update_admin" ON trips;
CREATE POLICY "trips_update_admin" ON trips
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete trips
DROP POLICY IF EXISTS "trips_delete_admin" ON trips;
CREATE POLICY "trips_delete_admin" ON trips
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── BOOKINGS ──────────────────────────────────────────────

-- Users can see their own bookings; drivers can see bookings for their trips
DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = bookings.trip_id AND trips.driver_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookings are inserted only via the book_trip_seat RPC (SECURITY DEFINER)
-- Direct inserts are blocked for regular users
DROP POLICY IF EXISTS "bookings_insert_rpc_only" ON bookings;
CREATE POLICY "bookings_insert_rpc_only" ON bookings
  FOR INSERT WITH CHECK (false);

-- Users can cancel their own bookings; admins can update any
DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete bookings
DROP POLICY IF EXISTS "bookings_delete_admin" ON bookings;
CREATE POLICY "bookings_delete_admin" ON bookings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── DRIVER APPLICATIONS ───────────────────────────────────

-- Users can see their own application; admins see all
DROP POLICY IF EXISTS "driver_applications_select" ON driver_applications;
CREATE POLICY "driver_applications_select" ON driver_applications
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can submit their own application
DROP POLICY IF EXISTS "driver_applications_insert" ON driver_applications;
CREATE POLICY "driver_applications_insert" ON driver_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update application status
DROP POLICY IF EXISTS "driver_applications_update_admin" ON driver_applications;
CREATE POLICY "driver_applications_update_admin" ON driver_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── TRIP RATINGS ──────────────────────────────────────────

DROP POLICY IF EXISTS "trip_ratings_select" ON trip_ratings;
CREATE POLICY "trip_ratings_select" ON trip_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "trip_ratings_insert" ON trip_ratings;
CREATE POLICY "trip_ratings_insert" ON trip_ratings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ── TRIP REVIEWS ──────────────────────────────────────────

DROP POLICY IF EXISTS "trip_reviews_select" ON trip_reviews;
CREATE POLICY "trip_reviews_select" ON trip_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "trip_reviews_insert" ON trip_reviews;
CREATE POLICY "trip_reviews_insert" ON trip_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ── TRIP EDIT REQUESTS ────────────────────────────────────

DROP POLICY IF EXISTS "trip_edit_requests_select" ON trip_edit_requests;
CREATE POLICY "trip_edit_requests_select" ON trip_edit_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_edit_requests.trip_id AND trips.driver_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "trip_edit_requests_insert" ON trip_edit_requests;
CREATE POLICY "trip_edit_requests_insert" ON trip_edit_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id AND trips.driver_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "trip_edit_requests_update_admin" ON trip_edit_requests;
CREATE POLICY "trip_edit_requests_update_admin" ON trip_edit_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "trip_edit_requests_delete_admin" ON trip_edit_requests;
CREATE POLICY "trip_edit_requests_delete_admin" ON trip_edit_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ── PROMO CODES ───────────────────────────────────────────

-- Anyone can look up a specific promo code (needed to validate at checkout)
DROP POLICY IF EXISTS "promo_codes_select_active" ON promo_codes;
CREATE POLICY "promo_codes_select_active" ON promo_codes
  FOR SELECT USING (active = true);

-- Admins can see all promo codes including inactive
DROP POLICY IF EXISTS "promo_codes_select_admin" ON promo_codes;
CREATE POLICY "promo_codes_select_admin" ON promo_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "promo_codes_insert_admin" ON promo_codes;
CREATE POLICY "promo_codes_insert_admin" ON promo_codes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "promo_codes_update_admin" ON promo_codes;
CREATE POLICY "promo_codes_update_admin" ON promo_codes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "promo_codes_delete_admin" ON promo_codes;
CREATE POLICY "promo_codes_delete_admin" ON promo_codes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ============================================================
-- Done! Verify with:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public';
-- All tables should show rowsecurity = true
-- ============================================================
