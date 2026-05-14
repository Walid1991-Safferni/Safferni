-- Atomic confirm/reject booking for managers.
-- Mirrors driver_action_booking but verifies the caller is an assigned manager
-- of the booking's trip's driver. Handles seat decrement atomically.
-- Run this in Supabase SQL editor.

create or replace function manager_action_booking(p_booking_id uuid, p_action text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_booking bookings;
  v_trip trips;
  v_new_avail int;
begin
  -- Validate action
  if p_action not in ('confirm','reject') then
    return jsonb_build_object('success', false, 'error', 'Invalid action');
  end if;

  -- Load booking + lock for update
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Booking not found');
  end if;

  if v_booking.status != 'pending' then
    return jsonb_build_object('success', false, 'error', 'Booking already actioned');
  end if;

  -- Load trip
  select * into v_trip from trips where id = v_booking.trip_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Trip not found');
  end if;

  if v_trip.status not in ('active','pending') then
    return jsonb_build_object('success', false, 'error', 'Trip is not active');
  end if;

  -- Authorization: caller must be an assigned manager of this trip's driver
  if not exists (
    select 1 from driver_managers
    where manager_id = auth.uid() and driver_id = v_trip.driver_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if p_action = 'confirm' then
    -- Atomic seat check + decrement
    if v_trip.available_seats < v_booking.seats then
      return jsonb_build_object('success', false, 'error', 'Not enough seats available');
    end if;
    v_new_avail := v_trip.available_seats - v_booking.seats;
    update trips set available_seats = v_new_avail where id = v_trip.id;
    update bookings set status = 'confirmed', action_taken_by = auth.uid() where id = p_booking_id;
    return jsonb_build_object('success', true, 'available_seats', v_new_avail);
  else
    update bookings set status = 'rejected', action_taken_by = auth.uid() where id = p_booking_id;
    return jsonb_build_object('success', true);
  end if;
end;
$$;

grant execute on function manager_action_booking(uuid, text) to authenticated;
