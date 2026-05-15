-- Route price enforcement at the DB level.
-- Closes the gap where non-web callers (Telegram bot, direct REST clients,
-- anyone with an auth token) could insert trips at any price, since the
-- client-side seatMin/seatMax check in App.jsx is bypassable.
--
-- Run this in Supabase SQL editor.

-- ── ROUTE_PRICES TABLE ─────────────────────────────────────────────────────
-- Mirrors the routeMap array in App.jsx. Direction-sensitive: dam→qaa and
-- qaa→dam can have different ranges. Routes not in this table are treated
-- as "coming soon" and skipped by the trigger (matches client behavior).

create table if not exists route_prices (
  from_city text not null,
  to_city   text not null,
  seat_min  numeric not null check (seat_min > 0),
  seat_max  numeric not null check (seat_max >= seat_min),
  updated_at timestamptz not null default now(),
  primary key (from_city, to_city)
);

alter table route_prices enable row level security;

-- Anyone (including anon) can read prices — needed for the pricing page.
drop policy if exists "route_prices_select_public" on route_prices;
create policy "route_prices_select_public" on route_prices
  for select using (true);

-- Writes are admin-only (matches profiles_admin_update pattern).
drop policy if exists "route_prices_admin_write" on route_prices;
create policy "route_prices_admin_write" on route_prices
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── SEED DATA (mirrors App.jsx routeMap) ───────────────────────────────────

insert into route_prices (from_city, to_city, seat_min, seat_max) values
  ('dam', 'bei', 30, 40),
  ('daa', 'bei', 35, 40),
  ('dam', 'amm', 45, 55),
  ('dam', 'qaa', 45, 55),
  ('qaa', 'dam', 65, 75),
  ('dam', 'hom', 25, 35),
  ('dam', 'ale', 45, 55),
  ('hom', 'ale', 20, 30),
  ('hom', 'ham', 15, 20),
  ('ham', 'ale', 20, 30),
  ('dam', 'daa', 22, 28),
  ('dam', 'dar', 25, 35),
  ('hom', 'tar', 25, 35),
  ('hom', 'lat', 25, 35),
  ('dam', 'lat', 45, 55),
  ('dam', 'tar', 45, 55)
on conflict (from_city, to_city) do update
  set seat_min   = excluded.seat_min,
      seat_max   = excluded.seat_max,
      updated_at = now();

-- ── ENFORCEMENT TRIGGER ────────────────────────────────────────────────────
-- Mirrors findRoute() in App.jsx: try exact direction first, then swapped.
-- If neither direction is in route_prices, treat as "coming soon" and allow.

create or replace function enforce_trip_price()
returns trigger language plpgsql as $$
declare
  v_min numeric;
  v_max numeric;
begin
  -- Exact direction match first.
  select seat_min, seat_max into v_min, v_max
    from route_prices
    where from_city = new.from_city and to_city = new.to_city;

  -- Fall back to swapped direction (matches client's findRoute behavior).
  if v_min is null then
    select seat_min, seat_max into v_min, v_max
      from route_prices
      where from_city = new.to_city and to_city = new.from_city;
  end if;

  -- Route not configured = "coming soon" = no enforcement.
  if v_min is null then
    return new;
  end if;

  if new.price_per_seat is null
     or new.price_per_seat < v_min
     or new.price_per_seat > v_max then
    raise exception 'Price $% is outside the allowed range $%–$% for %→% (route_prices enforcement)',
      coalesce(new.price_per_seat::text, 'NULL'), v_min, v_max, new.from_city, new.to_city
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- BEFORE INSERT OR UPDATE OF price_per_seat: fires on new trips and price
-- edits, but not on every booking-driven available_seats decrement.
drop trigger if exists trips_enforce_price on trips;
create trigger trips_enforce_price
  before insert or update of price_per_seat, from_city, to_city on trips
  for each row execute function enforce_trip_price();
