# Safferni — Technical Documentation

**Version:** 1.0  
**Last Updated:** May 2026  
**Document Type:** Technical Overview

---

## 1. What is Safferni?

Safferni is a ride-booking web application for intercity travel in Syria. It operates in two modes:

- **Driver-published trips**: Drivers post available trips with a date, route, time, and price. Passengers browse and book seats.
- **Custom ride requests**: Passengers submit an open booking request for a route and date, and the team arranges a driver.

The platform supports Arabic and English, handles multiple payment methods (cash, crypto, Sham Cash), and includes full admin and driver dashboards.

---

## 2. Technology Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| **React** | 18.3 | UI framework |
| **Vite** | 6.0 | Build tool and dev server |
| **JavaScript (JSX)** | ES2022 | Application language |

The entire frontend is a single-file React application (`src/App.jsx`). There is no routing library — page navigation is managed with a `page` state variable. All styling is inline CSS (no Tailwind, no CSS files).

### Backend / Infrastructure
| Tool | Purpose |
|------|---------|
| **Supabase** | Database, authentication, storage, real-time |
| **Vercel** | Hosting and deployment |
| **Resend** | Transactional email (admin notifications on new bookings) |

### Database
**PostgreSQL** via Supabase. All tables are in the `public` schema.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│                                             │
│   React SPA (src/App.jsx)                   │
│   ├── Auth (Supabase Auth)                  │
│   ├── Data queries (Supabase JS SDK)        │
│   └── Storage (Supabase Storage)            │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│               Supabase                      │
│                                             │
│   ├── Auth (SMS OTP / Email OTP)            │
│   ├── PostgreSQL Database                   │
│   │   ├── Row Level Security (RLS)          │
│   │   └── SECURITY DEFINER RPCs             │
│   ├── Storage Buckets                       │
│   │   ├── avatars (public)                  │
│   │   └── id-documents (private)            │
│   └── Edge Functions                        │
│       └── notify-new-booking → Resend       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                  Vercel                     │
│   Hosts the built React app (static files)  │
│   Auto-deploys on every merge to main       │
└─────────────────────────────────────────────┘
```

---

## 4. Database Schema

### `profiles`
Extends Supabase's `auth.users`. Created automatically on signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Matches `auth.users.id` |
| `full_name` | text | |
| `phone` | text | |
| `email` | text | |
| `role` | text | `passenger`, `driver`, or `admin` |
| `avatar_url` | text | Public URL from `avatars` bucket |
| `date_of_birth` | text | |
| `car_type` | text | Driver's vehicle description |
| `car_plate` | text | |
| `driver_license` | text | |
| `transport_license` | text | |
| `has_wifi` | boolean | Car amenity |
| `has_water` | boolean | Car amenity |
| `has_ac` | boolean | Car amenity |
| `id_photo_url` | text | Path in `id-documents` bucket |
| `id_verified` | boolean | Set by admin after ID review |
| `id_verification_pending` | boolean | True after driver uploads ID |
| `emergency_contact_email` | text | Gets booking confirmation emails |

### `trips`
Published by drivers, approved by admin before going live.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `driver_id` | uuid (FK → profiles) | |
| `from_city` | text | Origin city code |
| `to_city` | text | Destination city code |
| `trip_date` | date | |
| `trip_time` | time | |
| `available_seats` | int | Decremented on booking |
| `total_seats` | int | Original capacity |
| `price_per_seat` | numeric | USD |
| `status` | text | `active`, `completed`, `cancelled` |
| `approved` | boolean | Set by admin |
| `gender_type` | text | `mixed` or `women_only` |
| `avg_rating` | numeric | Computed from `trip_ratings` |
| `rating_count` | int | |

### `bookings`
Created only via the `book_trip_seat` RPC — direct inserts are blocked by RLS.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `trip_id` | uuid (FK → trips) | |
| `user_id` | uuid (FK → auth.users) | |
| `passenger_name` | text | |
| `passenger_phone` | text | |
| `seats` | int | |
| `payment_method` | text | `cash`, `crypto`, `shamcash` |
| `status` | text | `pending`, `confirmed`, `cancelled`, `no_show` |
| `ref_code` | text | 8-character alphanumeric reference |
| `total_price` | numeric | After any promo discount |

### `driver_applications`
Submitted by users who want to become drivers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users) | |
| `full_name` | text | |
| `phone` | text | |
| `dob` | text | Date of birth |
| `car_kind_year` | text | e.g. "Toyota Corolla 2019" |
| `car_license` | text | Plate number |
| `driver_license_num` | text | License number |
| `status` | text | `pending`, `approved`, `denied` |
| `app_ref` | text | Reference code shown to applicant |

### `promo_codes`
Discount codes redeemable at booking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `code` | text | Uppercase, unique |
| `discount_value` | numeric | Percentage off |
| `discount_type` | text | `percentage` |
| `active` | boolean | |
| `max_uses` | int | Null = unlimited |
| `uses_count` | int | Incremented atomically by RPC |
| `expires_at` | timestamptz | Null = no expiry |

### `notifications`
In-app notification bell for all users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | |
| `user_id` | uuid (FK → auth.users) | Recipient |
| `type` | text | `new_booking`, `booking_confirmed`, `booking_rejected`, etc. |
| `title` | text | |
| `message` | text | |
| `read` | boolean | |
| `created_at` | timestamptz | |

### `trip_ratings` / `trip_reviews`
Post-trip ratings (1–5 stars) and written reviews from passengers.

### `trip_edit_requests`
Drivers submit requests to change a trip's time. Admin approves or rejects.

---

## 5. Authentication

Handled entirely by Supabase Auth. Two flows are supported:

**Syrian phone numbers (+963)**
- User enters phone → receives SMS OTP → verified by Supabase
- Profile is created automatically on first login

**Non-Syrian numbers / Email**
- User enters email → receives email OTP → verified by Supabase
- Phone number can be linked to the profile after signup

On signup, a profile row is automatically created in the `profiles` table via a PostgreSQL trigger (`supabase-auto-profile-trigger.sql`).

---

## 6. Security Model

### Row Level Security (RLS)
Every table has RLS enabled. The rules enforce:
- Passengers can only read/modify their own bookings and profile
- Drivers can only read/modify their own trips and see bookings on those trips
- Admins can read and modify everything

### SECURITY DEFINER Functions (RPCs)
Certain operations require elevated privileges and are handled by server-side PostgreSQL functions that bypass RLS in a controlled way:

| Function | Purpose |
|----------|---------|
| `book_trip_seat` | Atomic booking — locks trip row, checks seats, inserts booking, decrements seats in one transaction |
| `cancel_passenger_booking` | Atomic cancellation — enforces 24-hour rule server-side, restores seats |
| `driver_action_booking` | Confirm or reject a booking (driver only) |
| `approve_driver_role` | Grants `role = 'driver'` to a user (admin action) |
| `delete_own_account` | Wipes all user data including `auth.users` row |
| `use_promo_code` | Atomically increments `uses_count` to prevent concurrent over-use |

### Admin Access
Admin identity is controlled by the `VITE_ADMIN_EMAILS` environment variable set in Vercel. Only users whose email is in that list see the admin panel in the UI. Database-level admin permissions are granted by setting `role = 'admin'` in the `profiles` table.

---

## 7. Storage

Two Supabase Storage buckets:

| Bucket | Access | Contents |
|--------|--------|---------|
| `avatars` | Public (anyone can view) | Profile photos for drivers and passengers. Path: `{user_id}/avatar.{ext}` |
| `id-documents` | Private (owner + admin only) | Driver ID photos for verification. Path: `{user_id}/id.{ext}` |

File size limits: 5 MB for avatars, 10 MB for ID documents.

---

## 8. Email Notifications

When a new booking is created, Supabase fires a database webhook (PostgreSQL trigger on `bookings` INSERT) that calls a Supabase Edge Function (`notify-new-booking`). The function formats an HTML email and sends it to `admin@safferni.com` via the **Resend** API.

**Flow:**
```
Booking inserted → DB trigger → Edge Function → Resend API → admin@safferni.com
```

The edge function is located at `supabase/functions/notify-new-booking/index.ts`.

---

## 9. Deployment

**Hosting:** Vercel  
**Deployment trigger:** Automatic on every merge to the `main` branch on GitHub  
**Build command:** `vite build`  
**Output directory:** `dist`

### Environment Variables (set in Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |
| `VITE_ADMIN_EMAILS` | Comma-separated list of admin email addresses |
| `VITE_WA_PHONE` | WhatsApp number for contact and booking confirmations (e.g. `963912345678`) |
| `VITE_USDT_ADDRESS` | USDT wallet address for crypto payments |
| `VITE_SHEET_URL` | Google Sheets webhook URL for backup booking logging |

### Supabase Secrets (set in Supabase dashboard)

| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | API key for sending emails via Resend |

---

## 10. User Roles

| Role | How Assigned | Capabilities |
|------|-------------|-------------|
| **Passenger** | Default on signup | Browse trips, book seats, request custom rides, manage profile and bookings |
| **Driver** | Admin approves driver application | All passenger features + publish trips, manage their own trip bookings, request time changes |
| **Admin** | Set via `VITE_ADMIN_EMAILS` env var + `role = 'admin'` in DB | All features + approve/deny driver applications, approve/cancel trips, manage promo codes, verify driver IDs, view all bookings, export CSV |

---

## 11. Key User Flows

### Booking a Seat on a Driver Trip
1. Passenger searches by date, route, gender preference
2. Selects a trip and opens the booking modal
3. Enters name, phone, number of seats, payment method (optional promo code)
4. Clicks "Confirm Booking" → `book_trip_seat` RPC runs atomically
5. WhatsApp message opens with booking summary
6. In-app notification sent to driver

### Becoming a Driver
1. User fills driver application form (all fields mandatory)
2. Profile is auto-updated with submitted name, phone, DOB
3. Application appears in admin "Requests" tab
4. Admin approves → `approve_driver_role` RPC sets `role = 'driver'`
5. Driver logs out and back in → Driver panel appears

### ID Verification
1. Driver uploads ID photo from their driver panel
2. Photo stored in `id-documents` bucket (private)
3. Admin sees it in the "ID Verification" tab using a time-limited signed URL
4. Admin approves or rejects → driver receives in-app notification
5. Verified badge (blue checkmark) appears next to driver's name in search results

---

## 12. Repository Structure

```
Safferni/
├── src/
│   └── App.jsx                          # Entire frontend application
├── supabase/
│   └── functions/
│       └── notify-new-booking/
│           └── index.ts                 # Email notification Edge Function
├── supabase-setup.sql                   # Main DB schema, RLS policies, RPCs
├── supabase-security-fixes.sql          # Additional RLS hardening
├── supabase-phase1-migration.sql        # Promo code expiry support
├── supabase-driver-verification.sql     # Storage buckets + avatar columns
├── supabase-fix-admin-driver-approval.sql # is_admin() helper + approve_driver_role RPC
├── supabase-profiles-rls-fix.sql        # Profile insert/update policies
├── supabase-auto-profile-trigger.sql    # Auto-create profile on signup
├── supabase-auto-complete-trips.sql     # Scheduled trip completion
├── supabase-booking-webhook.sql         # DB webhook for email notifications
├── public/                              # Static assets
├── index.html
├── vite.config.js
└── package.json
```

---

*Document prepared by the Safferni development team.*
