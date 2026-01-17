-- Allow all authenticated users to update cars (for reporting issues)
-- Previously only admins could update cars

DROP POLICY IF EXISTS "Admins can update cars" ON cars;

CREATE POLICY "Authenticated users can update cars" ON cars
  FOR UPDATE USING (auth.uid() IS NOT NULL);
