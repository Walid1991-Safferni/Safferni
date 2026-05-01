-- ============================================================
-- SAFFERNI SECURITY FIXES — run after supabase-setup.sql
-- Paste into Supabase Dashboard > SQL Editor and run once.
-- ============================================================

-- ============================================================
-- FIX 1: Lock down profiles SELECT — currently fully public
-- Public read should only expose driver-listing fields, NOT
-- phone, email, DOB, license numbers, emergency contacts, etc.
-- ============================================================

-- Drop the wide-open public SELECT
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- Authenticated users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Drivers' booking passengers can see driver name/phone via trips join (handled in trips RLS)
-- For public driver listings, expose a safe view with only non-sensitive fields:
CREATE OR REPLACE VIEW public_driver_profiles AS
  SELECT id, full_name, role, car_type, car_model,
         has_wifi, has_water, has_ac
  FROM profiles
  WHERE role = 'driver';

GRANT SELECT ON public_driver_profiles TO anon, authenticated;


-- ============================================================
-- FIX 2: Server-side price validation in book_trip_seat
-- Currently the client passes p_total_price — a malicious user
-- can pass 0 and book for free.
-- ============================================================

CREATE OR REPLACE FUNCTION book_trip_seat(
  p_trip_id        uuid,
  p_user_id        uuid,
  p_passenger_name text,
  p_passenger_phone text,
  p_seats          int,
  p_payment_method text,
  p_ref_code       text,
  p_promo_code     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip          trips%ROWTYPE;
  v_booking_id    uuid;
  v_base_price    numeric;
  v_discount_pct  numeric := 0;
  v_total_price   numeric;
  v_promo_id      uuid;
BEGIN
  -- Auth check
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_seats < 1 OR p_seats > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_seats');
  END IF;

  -- Lock trip row
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id AND status = 'active' AND approved = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'trip_not_found');
  END IF;

  IF v_trip.available_seats < p_seats THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enough_seats');
  END IF;

  -- Compute base price server-side from the trip's actual price_per_seat
  v_base_price := COALESCE(v_trip.price_per_seat, 0) * p_seats;

  -- Apply + atomically consume promo if provided
  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    UPDATE promo_codes
    SET uses_count = uses_count + 1
    WHERE code = upper(trim(p_promo_code))
      AND active = true
      AND (max_uses IS NULL OR uses_count < max_uses)
    RETURNING id, discount_percent INTO v_promo_id, v_discount_pct;

    IF v_promo_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_or_exhausted_promo');
    END IF;
  END IF;

  v_total_price := v_base_price * (1 - COALESCE(v_discount_pct, 0) / 100.0);

  -- Insert booking with server-computed price
  INSERT INTO bookings (
    trip_id, user_id, passenger_name, passenger_phone,
    seats, payment_method, status, ref_code, total_price
  ) VALUES (
    p_trip_id, p_user_id, p_passenger_name, p_passenger_phone,
    p_seats, p_payment_method, 'pending', p_ref_code, v_total_price
  )
  RETURNING id INTO v_booking_id;

  UPDATE trips
  SET available_seats = available_seats - p_seats
  WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'total_price', v_total_price);
END;
$$;


-- ============================================================
-- FIX 3: Restrict notifications insert
-- Currently any authenticated user can spam any other user.
-- Limit to: self-notify, OR driver↔passenger of a shared booking,
-- OR admin.
-- ============================================================

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (
    -- Self-notify
    auth.uid() = user_id
    -- Admin can notify anyone
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- Driver notifying a passenger who has a booking on the driver's trip
    OR EXISTS (
      SELECT 1 FROM bookings b
      JOIN trips t ON t.id = b.trip_id
      WHERE b.user_id = notifications.user_id
        AND t.driver_id = auth.uid()
    )
    -- Passenger notifying the driver of a trip they're booked on
    OR EXISTS (
      SELECT 1 FROM bookings b
      JOIN trips t ON t.id = b.trip_id
      WHERE t.driver_id = notifications.user_id
        AND b.user_id = auth.uid()
    )
  );


-- ============================================================
-- FIX 4: Unique constraint on reviews/ratings to prevent dupes
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS trip_reviews_booking_unique
  ON trip_reviews(booking_id);

CREATE UNIQUE INDEX IF NOT EXISTS trip_ratings_booking_unique
  ON trip_ratings(booking_id);


-- ============================================================
-- FIX 5: Profile self-insert policy must exist for new signups
-- (already in setup.sql line 95-97 — verified)
-- ============================================================
-- No-op; documented for completeness.


-- ============================================================
-- Verify with:
--   SELECT polname, polcmd FROM pg_policy
--   WHERE polrelid = 'profiles'::regclass;
-- ============================================================
