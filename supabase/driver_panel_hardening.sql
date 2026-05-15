-- Driver-panel hardening — closes the issues found in the driver-panel audit.
-- Run this in Supabase SQL editor.
--
-- Adds:
--   1. cancel_trip_cascade        — cancel trip + cancel non-cancelled bookings
--   2. complete_trip_cascade      — mark trip completed + auto-reject pending bookings
--   3. mark_no_show               — atomic no-show + restore seat
--   4. restore_external_seat      — undo accidental external-seat decrements
--   5. invalidate_id_verification — trigger that resets id_verified on identity-field edits
--   6. Tightens trip_edit_requests insert RLS to reject completed/cancelled/past trips

-- ── 1. cancel_trip_cascade ─────────────────────────────────────────────────
-- Returns: { success, cancelled_count, affected: [{ user_id, booking_id, name, ref_code }] }
-- Caller must be the trip's driver, an admin, or an assigned manager of the driver.

create or replace function cancel_trip_cascade(p_trip_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_trip       trips;
  v_uid        uuid := auth.uid();
  v_is_admin   boolean;
  v_is_manager boolean;
  v_affected   jsonb;
  v_count      int;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_trip from trips where id = p_trip_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Trip not found');
  end if;

  if v_trip.status = 'cancelled' then
    return jsonb_build_object('success', false, 'error', 'Trip already cancelled');
  end if;

  -- Authorize: driver, admin, or assigned manager
  select exists(select 1 from profiles where id = v_uid and role = 'admin') into v_is_admin;
  select exists(select 1 from driver_managers where manager_id = v_uid and driver_id = v_trip.driver_id) into v_is_manager;
  if v_trip.driver_id != v_uid and not v_is_admin and not v_is_manager then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  -- Snapshot affected bookings (for client-side notification fan-out)
  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', user_id,
    'booking_id', id,
    'name', passenger_name,
    'ref_code', ref_code
  )), '[]'::jsonb), count(*)
  into v_affected, v_count
  from bookings
  where trip_id = p_trip_id and status != 'cancelled';

  -- Cancel the trip
  update trips set status = 'cancelled' where id = p_trip_id;

  -- Cancel all non-cancelled bookings
  update bookings set status = 'cancelled'
    where trip_id = p_trip_id and status != 'cancelled';

  return jsonb_build_object(
    'success', true,
    'cancelled_count', v_count,
    'affected', v_affected,
    'from_city', v_trip.from_city,
    'to_city', v_trip.to_city,
    'trip_date', v_trip.trip_date
  );
end;
$$;

grant execute on function cancel_trip_cascade(uuid) to authenticated;


-- ── 2. complete_trip_cascade ───────────────────────────────────────────────
-- Returns: { success, rejected_count, confirmed_users: [...], rejected_users: [...] }
-- Driver / manager / admin only. Auto-rejects any still-pending bookings so they
-- don't get stranded after completion.

create or replace function complete_trip_cascade(p_trip_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_trip       trips;
  v_uid        uuid := auth.uid();
  v_is_admin   boolean;
  v_is_manager boolean;
  v_today      date := current_date;
  v_rejected   jsonb;
  v_confirmed  jsonb;
  v_rejected_n int;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_trip from trips where id = p_trip_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Trip not found');
  end if;

  if v_trip.trip_date > v_today then
    return jsonb_build_object('success', false, 'error', 'Cannot complete a future trip');
  end if;

  if v_trip.status not in ('active','pending') then
    return jsonb_build_object('success', false, 'error', 'Trip is not active');
  end if;

  select exists(select 1 from profiles where id = v_uid and role = 'admin') into v_is_admin;
  select exists(select 1 from driver_managers where manager_id = v_uid and driver_id = v_trip.driver_id) into v_is_manager;
  if v_trip.driver_id != v_uid and not v_is_admin and not v_is_manager then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  -- Snapshot pending bookings (will be auto-rejected) and confirmed (will get review prompt)
  select coalesce(jsonb_agg(jsonb_build_object('user_id', user_id, 'booking_id', id, 'name', passenger_name)), '[]'::jsonb), count(*)
    into v_rejected, v_rejected_n
    from bookings
    where trip_id = p_trip_id and status = 'pending';

  select coalesce(jsonb_agg(jsonb_build_object('user_id', user_id, 'booking_id', id, 'name', passenger_name)), '[]'::jsonb)
    into v_confirmed
    from bookings
    where trip_id = p_trip_id and status = 'confirmed';

  -- Auto-reject pending bookings
  update bookings set status = 'rejected'
    where trip_id = p_trip_id and status = 'pending';

  -- Mark trip completed
  update trips set status = 'completed' where id = p_trip_id;

  return jsonb_build_object(
    'success', true,
    'rejected_count', v_rejected_n,
    'rejected', v_rejected,
    'confirmed', v_confirmed,
    'from_city', v_trip.from_city,
    'to_city', v_trip.to_city,
    'trip_date', v_trip.trip_date
  );
end;
$$;

grant execute on function complete_trip_cascade(uuid) to authenticated;


-- ── 3. mark_no_show ────────────────────────────────────────────────────────
-- Atomic no-show: flip booking to 'no_show', restore the seat. Replaces the
-- racy two-step UPDATE pair in the client.

create or replace function mark_no_show(p_booking_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  v_booking    bookings;
  v_trip       trips;
  v_uid        uuid := auth.uid();
  v_is_admin   boolean;
  v_is_manager boolean;
  v_new_avail  int;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Booking not found');
  end if;

  if v_booking.status != 'confirmed' then
    return jsonb_build_object('success', false, 'error', 'Booking is not confirmed');
  end if;

  select * into v_trip from trips where id = v_booking.trip_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Trip not found');
  end if;

  select exists(select 1 from profiles where id = v_uid and role = 'admin') into v_is_admin;
  select exists(select 1 from driver_managers where manager_id = v_uid and driver_id = v_trip.driver_id) into v_is_manager;
  if v_trip.driver_id != v_uid and not v_is_admin and not v_is_manager then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  v_new_avail := least(v_trip.total_seats, v_trip.available_seats + v_booking.seats);
  update bookings set status = 'no_show' where id = p_booking_id;
  update trips set available_seats = v_new_avail where id = v_trip.id;

  return jsonb_build_object('success', true, 'available_seats', v_new_avail);
end;
$$;

grant execute on function mark_no_show(uuid) to authenticated;


-- ── 4. restore_external_seat ───────────────────────────────────────────────
-- Undo accidental external-seat decrements. Capped at total_seats so a driver
-- can't inflate seat count past the trip's capacity.

create or replace function restore_external_seat(p_trip_id uuid, p_n int)
returns jsonb
language plpgsql security definer
as $$
declare
  v_trip       trips;
  v_uid        uuid := auth.uid();
  v_is_admin   boolean;
  v_is_manager boolean;
  v_booked     int;
  v_max_undo   int;
  v_new_avail  int;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  if p_n is null or p_n < 1 then
    return jsonb_build_object('success', false, 'error', 'Invalid seat count');
  end if;

  select * into v_trip from trips where id = p_trip_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Trip not found');
  end if;

  select exists(select 1 from profiles where id = v_uid and role = 'admin') into v_is_admin;
  select exists(select 1 from driver_managers where manager_id = v_uid and driver_id = v_trip.driver_id) into v_is_manager;
  if v_trip.driver_id != v_uid and not v_is_admin and not v_is_manager then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  -- The undoable amount is total - available - sum(seats on confirmed/pending bookings).
  -- Anything beyond that is a real passenger and shouldn't be restored here.
  select coalesce(sum(seats), 0) into v_booked
    from bookings
    where trip_id = p_trip_id and status in ('confirmed','pending');

  v_max_undo := v_trip.total_seats - v_trip.available_seats - v_booked;
  if v_max_undo <= 0 then
    return jsonb_build_object('success', false, 'error', 'No external seats to restore');
  end if;
  if p_n > v_max_undo then
    return jsonb_build_object('success', false, 'error', 'Cannot restore more than ' || v_max_undo || ' seat(s)');
  end if;

  v_new_avail := v_trip.available_seats + p_n;
  update trips set available_seats = v_new_avail where id = p_trip_id;

  return jsonb_build_object('success', true, 'available_seats', v_new_avail);
end;
$$;

grant execute on function restore_external_seat(uuid, int) to authenticated;


-- ── 5. invalidate_id_verification trigger ──────────────────────────────────
-- If a verified driver edits any identity-bearing field, drop the verified
-- badge and re-flag for admin review. Prevents the "verify with real ID,
-- swap fields, keep badge" attack.

create or replace function invalidate_id_verification()
returns trigger language plpgsql as $$
begin
  if old.id_verified is true and (
    new.id_number      is distinct from old.id_number      or
    new.full_name      is distinct from old.full_name      or
    new.date_of_birth  is distinct from old.date_of_birth  or
    new.driver_license is distinct from old.driver_license
  ) then
    new.id_verified := false;
    new.id_verification_pending := true;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_invalidate_id_verification on profiles;
create trigger profiles_invalidate_id_verification
  before update on profiles
  for each row execute function invalidate_id_verification();


-- ── 6. Tighten trip_edit_requests insert RLS ───────────────────────────────
-- Drivers can only request time edits on their own ACTIVE/PENDING trips that
-- haven't happened yet. Closes the gap where a driver could edit-request a
-- completed/cancelled/past trip via direct REST call.

drop policy if exists "trip_edit_requests_insert" on trip_edit_requests;
create policy "trip_edit_requests_insert" on trip_edit_requests
  for insert with check (
    exists (
      select 1 from trips
      where trips.id = trip_id
        and trips.driver_id = auth.uid()
        and trips.status in ('active','pending')
        and trips.trip_date >= current_date
    )
  );
