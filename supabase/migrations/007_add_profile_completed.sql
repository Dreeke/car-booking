-- Add profile_completed column to track whether users have set up their profile
ALTER TABLE profiles ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE;

-- Set all existing profiles to completed (they'll just see the banner if needed)
UPDATE profiles SET profile_completed = TRUE;

-- Update the handle_new_user trigger to set profile_completed = false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, is_admin, is_owner, profile_completed)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    FALSE,
    FALSE,
    FALSE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
