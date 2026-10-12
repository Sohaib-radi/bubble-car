import { Feather } from '@expo/vector-icons';
import { supabase } from './supabase';

// Mirrors the 'booking' row of app_settings, edited in Dashboard → Settings.
// Same defaults as the dashboard's src/lib/booking-settings.ts — change both together.

export const PERIOD_KEYS = ['morning', 'afternoon', 'evening'] as const;
export type PeriodKey = (typeof PERIOD_KEYS)[number];

export type Period = { key: PeriodKey; start: string; end: string; enabled: boolean };

export type BookingSettings = {
  max_per_day: number | null;
  show_capacity_to_customers: boolean;
  periods: Period[];
};

const DEFAULT_PERIODS: Period[] = [
  { key: 'morning', start: '09:00', end: '12:00', enabled: true },
  { key: 'afternoon', start: '12:00', end: '17:00', enabled: true },
  { key: 'evening', start: '17:00', end: '00:00', enabled: true },
];

export const PERIOD_ICONS: Record<PeriodKey, keyof typeof Feather.glyphMap> = {
  morning: 'sunrise',
  afternoon: 'sun',
  evening: 'moon',
};

export function isPeriodKey(v: string | null | undefined): v is PeriodKey {
  return !!v && (PERIOD_KEYS as readonly string[]).includes(v);
}

export async function fetchBookingSettings(): Promise<BookingSettings> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'booking').maybeSingle();
  const value = (data?.value ?? {}) as Partial<BookingSettings>;
  return {
    max_per_day: value.max_per_day ?? null,
    show_capacity_to_customers: value.show_capacity_to_customers ?? false,
    periods: DEFAULT_PERIODS.map((d) => value.periods?.find((p) => p.key === d.key) ?? d),
  };
}

export type DayAvailability = {
  day: string; // YYYY-MM-DD
  is_full: boolean;
  blocked_periods: PeriodKey[];
  whole_day_blocked: boolean;
  closed_hours: string[]; // time-range blocks that day, e.g. ["14:00-16:00"]
};

function minutes(hhmm: string, isEnd = false): number {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m;
  return isEnd && total === 0 ? 24 * 60 : total; // "00:00" as an end = midnight
}

// Closed time ranges that overlap a period without closing all of it.
export function partialClosures(period: Period, closedHours: string[]): { start: string; end: string }[] {
  const pStart = minutes(period.start);
  const pEnd = minutes(period.end, true);
  return closedHours
    .map((r) => {
      const [start, end] = r.split('-');
      return { start, end };
    })
    .filter(({ start, end }) => minutes(start) < pEnd && minutes(end, true) > pStart);
}

// is_full is only ever true when the owner chose to show capacity to customers.
export async function fetchAvailability(from: string, to: string): Promise<Record<string, DayAvailability>> {
  const { data } = await supabase.rpc('booking_availability', { p_from: from, p_to: to });
  return Object.fromEntries(((data ?? []) as DayAvailability[]).map((d) => [d.day, d]));
}

// "17:00" → "5 PM", "00:00" → "12 AM" (or 24h in Arabic locale).
export function formatHour(hhmm: string, lang: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    hour: 'numeric',
    minute: m ? '2-digit' : undefined,
  });
}

// ── service icons ───────────────────────────────────────────────────
// packs.icon is set in Dashboard → Settings → Service icons; null = default.
export type ServiceIcon = keyof typeof Feather.glyphMap;

export function serviceIcon(icon: string | null | undefined, packKey: string | null | undefined): ServiceIcon {
  if (icon && icon in Feather.glyphMap) return icon as ServiceIcon;
  switch (packKey) {
    case 'exterior':
      return 'droplet';
    case 'full':
      return 'star';
    case 'interior':
    case 'gaz':
      return 'wind';
    case 'engine':
      return 'thermometer';
    case 'wax':
    case 'polish':
      return 'sun';
    case 'accessories':
      return 'layers';
    default:
      return 'droplet';
  }
}

// Local YYYY-MM-DD (toISOString would shift to UTC and can return yesterday).
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
