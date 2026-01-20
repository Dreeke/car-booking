# Development Progress

This file documents all changes made to the Pool Car Booking System.

---

## 2026-01-20

### Recurring Bookings Feature (Complete)
**Commit:** `d02caa3` - Add recurring bookings support

Implemented full recurring bookings functionality:

**Database:**
- Created migration `005_add_recurring_bookings.sql`
- Added `series_id`, `recurrence_rule`, `is_recurrence_exception` columns

**Types:**
- Added `RecurrenceRule` interface to `types.ts`
- Extended `Booking` interface with recurring fields

**Date Utilities (`date-utils.ts`):**
- Added `addMonths()` helper
- Added `generateRecurrenceInstances()` function for weekly/monthly patterns

**BookingModal:**
- Added recurrence UI (checkbox, frequency, day picker, end conditions)
- Implemented series creation with shared `series_id`
- Added edit scope selector ("this only" / "all future")
- Added delete confirmation with scope options
- Fixed: Edit "all future" now properly updates times (not just destination)
- Fixed: Hide edit scope selector when delete confirmation is showing

**BookingBlock:**
- Added recurrence indicator icon (circular arrows) when `series_id` exists

---

## Earlier Changes (Pre-Progress Tracking)

### UI Improvements
- **Today highlighting**: Blue tint on today's column header and cells
- **Jump-to-date**: Date picker with "Go to:" label in calendar header
- **"+ Add" button**: Appears on cell hover (desktop) or always visible (mobile)
- **All day badge**: More prominent styling

### Multi-day Bookings
- Added optional end date field for date range bookings
- Fixed boolean type error when end date is empty

### Booking Conflict Detection
- Checks for overlapping bookings before saving
- Shows who already booked the conflicting time

### User Colors
- Fixed: Colors were all the same due to Tailwind purging
- Solution: Inline styles with hex colors, djb2 hash algorithm
- 12 distinct color options with dark mode variants

### Dark Mode
- Follows system preference via `prefers-color-scheme`

### Car Tooltips
- Hover on car name shows key location, alerts, comments
- Uses React Portal for proper z-index layering

### Report Issue Feature
- Non-admin users can flag cars needing attention
- Sets `has_alert` flag on car

### Timezone Bug Fix
- `formatDate()` was using `toISOString()` which converts to UTC
- Fixed: Use local date methods to preserve correct date

### Vercel Deployment
- Fixed middleware deprecation error (renamed middleware.ts to proxy.ts)
- Configured environment variables including localhost redirect

---

## Pending / Future Considerations

- None currently tracked

---

## How to Update This File

When making changes, add a new dated section at the top with:
1. Feature/fix name
2. Commit hash (if applicable)
3. Brief description of what changed
4. List of files modified
