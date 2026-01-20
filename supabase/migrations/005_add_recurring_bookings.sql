-- Add recurring booking support

-- New columns for recurring bookings
ALTER TABLE bookings ADD COLUMN series_id UUID;
ALTER TABLE bookings ADD COLUMN recurrence_rule JSONB;
ALTER TABLE bookings ADD COLUMN is_recurrence_exception BOOLEAN DEFAULT FALSE;

-- Index for efficient series queries
CREATE INDEX idx_bookings_series_id ON bookings(series_id);

-- Comment explaining recurrence_rule structure
COMMENT ON COLUMN bookings.recurrence_rule IS
'JSON structure for recurring bookings:
{
  "frequency": "weekly" | "monthly",
  "interval": number (1 = every week/month, 2 = every other, etc.),
  "daysOfWeek": number[] (0=Sun...6=Sat) - for weekly frequency,
  "dayOfMonth": number (1-31) - for monthly frequency,
  "endType": "never" | "on_date" | "after_count",
  "endDate": ISO date string (if endType = on_date),
  "count": number (if endType = after_count)
}';
