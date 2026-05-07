-- ============================================================
-- BOOKING EMAIL NOTIFICATION WEBHOOK
-- Run AFTER deploying the notify-new-booking Edge Function
-- ============================================================

-- Enable the pg_net extension (needed for HTTP calls from DB)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the webhook trigger function
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_service_key text;
BEGIN
  -- These are set as Supabase secrets / environment variables
  v_url := current_setting('app.supabase_url', true) || '/functions/v1/notify-new-booking';
  v_service_key := current_setting('app.service_role_key', true);

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'bookings',
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$;

-- Attach to bookings table
DROP TRIGGER IF EXISTS on_new_booking ON bookings;
CREATE TRIGGER on_new_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();
