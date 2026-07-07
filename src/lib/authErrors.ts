import i18n from '../i18n';

const PATTERNS: [RegExp, string][] = [
  [/invalid login credentials/i, 'auth.errors.invalidCredentials'],
  [/user already registered/i, 'auth.errors.userExists'],
  [/email not confirmed/i, 'auth.errors.emailNotConfirmed'],
  [/password should be at least/i, 'auth.errors.weakPassword'],
  [/invalid format|unable to validate email/i, 'auth.errors.invalidEmail'],
];

// Supabase/Postgres errors arrive in English from the API. Translate the common
// auth ones; anything unrecognized (e.g. rarer DB errors) falls back to the raw message.
export function translateAuthError(message: string): string {
  for (const [pattern, key] of PATTERNS) {
    if (pattern.test(message)) return i18n.t(key);
  }
  return message;
}
