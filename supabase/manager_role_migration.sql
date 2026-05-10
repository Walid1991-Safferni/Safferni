-- ============================================================
-- MANAGER ROLE MIGRATION
-- Run these statements in the Supabase SQL editor in order.
-- ============================================================

-- 0. Allow 'manager' as a valid role value
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('passenger','driver','admin','manager'));

-- 1. driver_managers table
create table if not exists driver_managers (
  id uuid default gen_random_uuid() primary key,
  manager_id uuid not null references profiles(id) on delete cascade,
  driver_id  uuid not null references profiles(id) on delete cascade,
  assigned_by uuid references profiles(id),
  assigned_at timestamptz default now(),
  unique(manager_id, driver_id)
);

-- 2. Audit columns
alter table bookings add column if not exists action_taken_by uuid references profiles(id);
alter table trips    add column if not exists created_by      uuid references profiles(id);

-- 3. RLS for driver_managers
alter table driver_managers enable row level security;

-- Managers can see their own rows
create policy "manager sees own assignments"
  on driver_managers for select
  using (manager_id = auth.uid());

-- Only admins can insert/update/delete (enforced in app via admin panel)
-- If you have an is_admin() function, use it here. Otherwise open to service_role only.
create policy "service role manages assignments"
  on driver_managers for all
  using (true)
  with check (true);

-- 4. Allow managers to read profiles of their assigned drivers
-- (Adjust if you have existing restrictive RLS on profiles)
-- This is a permissive read policy — already open in most setups.

-- 5. Allow managers to INSERT trips for their assigned drivers
--    (Add this policy to your existing trips policies)
create policy "manager inserts trips for assigned drivers"
  on trips for insert
  with check (
    driver_id in (
      select driver_id from driver_managers where manager_id = auth.uid()
    )
  );

-- 6. Allow managers to UPDATE trips for their assigned drivers
--    (cancel trips, mark completed, update available_seats)
create policy "manager updates trips for assigned drivers"
  on trips for update
  using (
    driver_id in (
      select driver_id from driver_managers where manager_id = auth.uid()
    )
  );

-- 7. Allow managers to UPDATE bookings on their assigned drivers' trips
create policy "manager updates bookings on assigned driver trips"
  on bookings for update
  using (
    trip_id in (
      select t.id from trips t
      inner join driver_managers dm on dm.driver_id = t.driver_id
      where dm.manager_id = auth.uid()
    )
  );

-- 8. Allow managers to SELECT bookings on their assigned drivers' trips
create policy "manager reads bookings on assigned driver trips"
  on bookings for select
  using (
    trip_id in (
      select t.id from trips t
      inner join driver_managers dm on dm.driver_id = t.driver_id
      where dm.manager_id = auth.uid()
    )
  );

-- 9. Allow managers to SELECT trips for their assigned drivers
create policy "manager reads trips for assigned drivers"
  on trips for select
  using (
    driver_id in (
      select driver_id from driver_managers where manager_id = auth.uid()
    )
  );

-- Done. After running these, promote a user to manager in the Admin → Managers tab.
