-- ============================================================
-- SAFFERNI PHASE 1 MIGRATION
-- Run after supabase-security-fixes.sql
-- ============================================================

-- Add expires_at to promo_codes
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Update book_trip_seat to honor expires_at on promo codes
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
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_seats < 1 OR p_seats > 10 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_seats');
  END IF;

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

  v_base_price := COALESCE(v_trip.price_per_seat, 0) * p_seats;

  IF p_promo_code IS NOT NULL AND length(trim(p_promo_code)) > 0 THEN
    UPDATE promo_codes
    SET uses_count = uses_count + 1
    WHERE code = upper(trim(p_promo_code))
      AND active = true
      AND (max_uses IS NULL OR uses_count < max_uses)
      AND (expires_at IS NULL OR expires_at > now())
    RETURNING id, discount_value INTO v_promo_id, v_discount_pct;

    IF v_promo_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'invalid_or_exhausted_promo');
    END IF;
  END IF;

  v_total_price := v_base_price * (1 - COALESCE(v_discount_pct, 0) / 100.0);

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
