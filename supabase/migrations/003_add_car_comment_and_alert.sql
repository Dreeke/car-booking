-- Add comment field to cars (admin notes)
ALTER TABLE cars ADD COLUMN comment TEXT;

-- Add alert flag to cars (for repairs, damage, etc.)
ALTER TABLE cars ADD COLUMN has_alert BOOLEAN DEFAULT FALSE;
