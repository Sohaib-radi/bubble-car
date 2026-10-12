import i18n from '../i18n';

const PATTERNS: [RegExp, string][] = [
  [/invalid login credentials/i, 'auth.errors.invalidCredentials'],
  [/user already registered/i, 'auth.errors.userExists'],
  [/email not confirmed/i, 'auth.errors.emailNotConfirmed'],
  [/password should be at least/i, 'auth.errors.weakPassword'],
  [/invalid format|unable to validate email/i, 'auth.errors.invalidEmail'],
  // Raised by the package triggers in supabase/migrations/20261008_packages.sql (dashboard repo).
  [/PACKAGE_NO_WASHES_LEFT/, 'packages.errors.noWashesLeft'],
  [/PACKAGE_NOT_ACTIVE/, 'packages.errors.notActive'],
  [/PACKAGE_EXPIRES_BEFORE_DATE/, 'packages.errors.expiresBefore'],
  [/PACKAGE_NOT_FOR_THIS_CAR|PACKAGE_CAR_NOT_OWNED/, 'packages.errors.notForThisCar'],
  [/PACKAGE_NO_PRICE/, 'packages.errors.noPrice'],
  [/PACKAGE_UNAVAILABLE|PACKAGE_EMPTY/, 'packages.errors.unavailable'],
  // Raised by bookings_check_schedule in 20261009_settings_capacity.sql.
  [/BOOKING_PERIOD_BLOCKED/, 'book.errors.periodBlocked'],
  [/BOOKING_DATE_IN_PAST/, 'book.errors.dateInPast'],
  // Never show raw server / network errors to customers.
  [/network request failed|failed to fetch|timeout/i, 'common.errors.network'],
  [/"status":\s*5\d\d|internal server error|unexpected/i, 'common.errors.generic'],
];

// Supabase/Postgres errors arrive in English from the API. Translate the common
// auth ones; anything unrecognized (e.g. rarer DB errors) falls back to the raw message.
export function translateAuthError(message: string): string {
  for (const [pattern, key] of PATTERNS) {
    if (pattern.test(message)) return i18n.t(key);
  }
  if (!message || message.trim().startsWith('{')) return i18n.t('common.errors.generic');
  return message;
}
