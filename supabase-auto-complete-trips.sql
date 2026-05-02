-- ============================================================
-- AUTO-COMPLETE TRIPS + REVIEW NOTIFICATIONS
-- Run in Supabase SQL Editor
-- ============================================================

-- Function: mark active trips as completed when their time has passed
-- and send a review notification to each confirmed passenger.
-- Safe to run multiple times (checks for existing notifications).
CREATE OR REPLACE FUNCTION auto_complete_trips()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip    RECORD;
  v_booking RECORD;
  v_route   text;
BEGIN
  FOR v_trip IN
    SELECT * FROM trips
    WHERE status = 'active'
      AND approved = true
      AND (
        -- treat trip_date + trip_time as Damascus local time
        (trip_date::text || ' ' || COALESCE(trip_time::text, '23:59'))::timestamp
        AT TIME ZONE 'Asia/Damascus'
      ) < now()
  LOOP
    UPDATE trips SET status = 'completed' WHERE id = v_trip.id;

    v_route := v_trip.from_city || ' → ' || v_trip.to_city;

    FOR v_booking IN
      SELECT * FROM bookings
      WHERE trip_id = v_trip.id
        AND status = 'confirmed'
        AND user_id IS NOT NULL
    LOOP
      -- Only send once per passenger per trip
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_booking.user_id
          AND type = 'review_trip'
          AND message LIKE '%' || v_trip.trip_date || '%'
          AND message LIKE '%' || v_route || '%'
      ) THEN
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
          v_booking.user_id,
          'review_trip',
          '⭐ قيّم رحلتك / Rate your trip',
          v_route || ' · ' || v_trip.trip_date
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Schedule: run every 30 minutes via pg_cron
-- (Supabase has pg_cron enabled by default)
SELECT cron.schedule(
  'auto-complete-trips',
  '*/30 * * * *',
  'SELECT auto_complete_trips()'
);
