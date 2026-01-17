-- Add destination field to bookings
ALTER TABLE bookings ADD COLUMN destination TEXT;

-- Add key_location field to cars
ALTER TABLE cars ADD COLUMN key_location TEXT;
