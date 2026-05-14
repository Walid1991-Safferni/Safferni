-- Atomic seat decrement for external reservations (driver panel)
-- Prevents race conditions when two requests decrement seats simultaneously.
-- Run this in Supabase SQL editor.

create or replace function decrement_seats(p_trip_id uuid, p_seats int)
returns trips
language plpgsql security definer
as $$
declare
  updated_trip trips;
begin
  update trips
  set available_seats = available_seats - p_seats
  where id = p_trip_id
    and available_seats >= p_seats
    and status = 'active'
  returning * into updated_trip;

  if not found then
    raise exception 'Not enough available seats or trip is not active';
  end if;

  return updated_trip;
end;
$$;
