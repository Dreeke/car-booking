import { Profile } from './types'

/**
 * Checks if a display name looks like it was auto-generated from an email
 * (e.g., "john.doe" from "john.doe@example.com")
 */
export function looksLikeEmailUsername(displayName: string, email: string | undefined): boolean {
  if (!email || !displayName) return false

  const emailPrefix = email.split('@')[0].toLowerCase()
  const normalizedName = displayName.toLowerCase().trim()

  // Check if name matches email prefix exactly
  if (normalizedName === emailPrefix) return true

  // Check if name has no spaces (real names typically have spaces)
  // and looks like an email username (contains dots, underscores, or numbers)
  const hasNoSpaces = !normalizedName.includes(' ')
  const looksLikeUsername = /[._\d]/.test(normalizedName) || normalizedName.length < 3

  return hasNoSpaces && looksLikeUsername && normalizedName === emailPrefix
}

/**
 * Validates that a display name is suitable (not empty, not too short, has spaces for full names)
 */
export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim()
  // Must be at least 2 characters
  if (trimmed.length < 2) return false
  // Must not be empty
  if (!trimmed) return false
  return true
}

/**
 * Checks if a user needs to complete profile setup (new users who haven't set their name)
 */
export function needsProfileSetup(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.profile_completed === false
}

/**
 * Checks if the profile banner should be shown to existing users with email-like names
 */
export function shouldShowProfileBanner(
  profile: Profile | null,
  email: string | undefined,
  dismissed: boolean
): boolean {
  if (!profile || dismissed) return false
  // Only show for completed profiles (existing users)
  if (!profile.profile_completed) return false
  // Show if their name looks like an email username
  return looksLikeEmailUsername(profile.display_name, email)
}

/**
 * Checks if a proposed display name is too similar to the email (should be rejected)
 */
export function isNameTooSimilarToEmail(name: string, email: string | undefined): boolean {
  if (!email) return false

  const emailPrefix = email.split('@')[0].toLowerCase()
  const normalizedName = name.toLowerCase().trim()

  // Reject if it exactly matches the email prefix
  if (normalizedName === emailPrefix) return true

  // Reject if it's just the email prefix with minor changes (dots to spaces, etc.)
  const nameWithoutSpaces = normalizedName.replace(/\s+/g, '')
  const emailPrefixNormalized = emailPrefix.replace(/[._]/g, '')

  if (nameWithoutSpaces === emailPrefixNormalized) return true

  return false
}
