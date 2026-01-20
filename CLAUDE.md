# Pool Car Booking System

## Project Overview

A web application for managing shared pool car bookings within an organization. Users can book cars for specific time slots, view availability across a weekly calendar, and manage their reservations.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with dark mode (system preference)
- **Deployment**: Vercel

## Key Features

1. **Weekly Calendar View** - Grid showing cars (rows) x days (columns)
2. **Booking Management** - Create, edit, delete bookings
3. **Multi-day Bookings** - Support for date range bookings
4. **Recurring Bookings** - Weekly/monthly repeat patterns with series management
5. **Conflict Detection** - Prevents double-booking same car
6. **User Colors** - Each user has a unique color for their bookings
7. **Dark Mode** - Follows system preference
8. **Admin Features** - Admins can edit/delete any booking, manage cars
9. **Report Issue** - Non-admin users can flag cars needing attention

## Database Schema

### Tables

**cars**
- `id` (UUID, PK)
- `name` (text)
- `key_location` (text, nullable)
- `comment` (text, nullable)
- `has_alert` (boolean)
- `created_at` (timestamp)

**profiles**
- `id` (UUID, PK, references auth.users)
- `display_name` (text)
- `is_admin` (boolean)

**bookings**
- `id` (UUID, PK)
- `car_id` (UUID, FK to cars)
- `user_id` (UUID, FK to profiles)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `is_whole_day` (boolean)
- `destination` (text, nullable)
- `created_at` (timestamp)
- `series_id` (UUID, nullable) - Links recurring booking instances
- `recurrence_rule` (JSONB, nullable) - Stored on first instance only
- `is_recurrence_exception` (boolean) - True if instance was individually modified

### Recurrence Rule Structure
```json
{
  "frequency": "weekly" | "monthly",
  "interval": 1,
  "daysOfWeek": [0-6],      // For weekly (0=Sun, 6=Sat)
  "dayOfMonth": 1-31,        // For monthly
  "endType": "never" | "on_date" | "after_count",
  "endDate": "YYYY-MM-DD",   // If endType = "on_date"
  "count": 12                // If endType = "after_count"
}
```

## Project Structure

```
app/
├── components/
│   ├── Calendar.tsx      # Main weekly calendar grid
│   ├── CarRow.tsx        # Single car row with day cells
│   ├── BookingBlock.tsx  # Individual booking display
│   ├── BookingModal.tsx  # Create/edit booking form
│   ├── Header.tsx        # Navigation header
│   └── AdminPanel.tsx    # Car management (admin only)
├── lib/
│   ├── supabase.ts       # Supabase client
│   ├── auth-context.tsx  # Authentication context
│   ├── types.ts          # TypeScript interfaces
│   └── date-utils.ts     # Date helpers & recurrence generation
├── login/
│   └── page.tsx          # Login page
├── layout.tsx            # Root layout
├── page.tsx              # Home page (calendar)
└── globals.css           # Global styles
supabase/
└── migrations/           # Database migrations
    ├── 001_initial.sql
    ├── 002_add_destination.sql
    ├── 003_add_car_alerts.sql
    ├── 004_add_whole_day.sql
    └── 005_add_recurring_bookings.sql
```

## Environment Variables

Required in `.env.local` and Vercel:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Key Implementation Details

### User Colors
- Uses djb2 hash algorithm on user ID
- 12 color options with light/dark mode variants
- Inline styles (not Tailwind classes) to avoid purging

### Recurring Bookings (Materialized Instances)
- Creates actual booking records for each occurrence
- All instances share same `series_id`
- Edit "this only" marks instance as exception
- Edit "all future" updates all instances >= current date
- Delete supports "this only" or "all future"
- Conflict check runs against ALL instances before creation

### Timezone Handling
- `formatDate()` uses local date methods (not toISOString) to avoid UTC shift
- Times stored in ISO format in database

## Common Tasks

### Adding a new car field
1. Create migration in `supabase/migrations/`
2. Update `Car` interface in `app/lib/types.ts`
3. Update relevant components

### Running locally
```bash
npm run dev
```

### Database migrations
Run SQL directly in Supabase Dashboard > SQL Editor

## Known Considerations

- Vercel environment variables include localhost redirect for Supabase auth
- RLS policies require careful setup for multi-user access
- Profile data comes as array in Supabase joins (use `profile?.[0]?.display_name`)
