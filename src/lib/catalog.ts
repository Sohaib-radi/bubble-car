import { supabase } from './supabase';

// Mirrors the schema managed by the Black Bubble Wash dashboard
// (car catalog, packs with per-car-type pricing, payment methods).

export const CAR_TYPES = ['sedan', 'hatchback', 'suv', 'pickup', 'van', 'other'] as const;
export type CarType = (typeof CAR_TYPES)[number];

export const CAR_SELECT = 'id, plate, car_type, custom_label, car_makes(name), car_models(name)';

export type Car = {
  id: string;
  plate: string | null;
  car_type: CarType;
  custom_label: string | null;
  car_makes: { name: string } | null;
  car_models: { name: string } | null;
};

export function carLabel(car: Pick<Car, 'custom_label' | 'car_makes' | 'car_models'> | null | undefined): string {
  if (!car) return '—';
  if (car.custom_label) return car.custom_label;
  return [car.car_makes?.name, car.car_models?.name].filter(Boolean).join(' ') || '—';
}

// "Toyota Corolla · 234 ABC", or just the name when no plate was given.
export function carWithPlate(car: Pick<Car, 'plate' | 'custom_label' | 'car_makes' | 'car_models'>): string {
  return car.plate ? `${carLabel(car)} · ${car.plate}` : carLabel(car);
}

export type Make = { id: string; name: string };
export type Model = { id: string; make_id: string; name: string; car_type: CarType };

export type Pack = {
  id: string;
  key: string | null;
  icon: string | null;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  prices: Partial<Record<CarType, number>>;
};

export type PaymentMethod = {
  id: string;
  label_en: string;
  label_ar: string;
  account_info: string | null;
  instructions_en: string | null;
  instructions_ar: string | null;
};

// Statuses a booking can still be "upcoming" in (see dashboard ALL_STATUSES).
export const ACTIVE_STATUSES = ['pending_review', 'awaiting_payment_proof', 'confirmed', 'arrived', 'in_progress'];

export function localized(lang: string, en: string | null, ar: string | null): string {
  return (lang === 'ar' ? ar || en : en || ar) ?? '';
}

export function minPrice(pack: Pack): number | null {
  const values = Object.values(pack.prices).filter((p): p is number => typeof p === 'number');
  return values.length ? Math.min(...values) : null;
}

export async function fetchPacks(): Promise<{ packs: Pack[]; error: string | null }> {
  const [{ data: packRows, error: packErr }, { data: priceRows, error: priceErr }] = await Promise.all([
    supabase
      .from('packs')
      .select('id, key, icon, name_en, name_ar, description_en, description_ar')
      .eq('active', true)
      .order('created_at'),
    supabase.from('pack_prices').select('pack_id, car_type, price'),
  ]);
  if (packErr || priceErr) return { packs: [], error: (packErr ?? priceErr)!.message };

  const packs = (packRows ?? []).map((p) => ({
    ...p,
    prices: Object.fromEntries(
      (priceRows ?? []).filter((pr) => pr.pack_id === p.id).map((pr) => [pr.car_type, Number(pr.price)])
    ) as Partial<Record<CarType, number>>,
  }));
  return { packs, error: null };
}

// ── Monthly packages ────────────────────────────────────────────────
// A package bundles washes from one or more packs (e.g. 4× Exterior + 1× Full)
// at a fixed price per car type. A purchase (user_package) is tied to one car,
// reviewed by a manager like a booking, and valid for 1 month from activation.

export type Package = {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  items: { pack_id: string; quantity: number; name_en: string; name_ar: string }[];
  prices: Partial<Record<CarType, number>>;
};

export type UserPackageStatus = 'pending_review' | 'active' | 'rejected' | 'cancelled' | 'expired';

export type PackageBalance = {
  pack_id: string;
  pack_name_en: string;
  pack_name_ar: string;
  quantity: number;
  used: number;
  remaining: number;
};

export type UserPackage = {
  id: string;
  car_id: string;
  package_name_en: string;
  package_name_ar: string;
  price: number;
  status: UserPackageStatus;
  expires_at: string | null;
  created_at: string;
  balances: PackageBalance[];
};

export async function fetchPackages(): Promise<{ packages: Package[]; error: string | null }> {
  const [pkgRes, itemRes, priceRes] = await Promise.all([
    supabase
      .from('packages')
      .select('id, name_en, name_ar, description_en, description_ar')
      .eq('active', true)
      .order('created_at'),
    supabase.from('package_items').select('package_id, pack_id, quantity, packs(name_en, name_ar)'),
    supabase.from('package_prices').select('package_id, car_type, price'),
  ]);
  const error = pkgRes.error ?? itemRes.error ?? priceRes.error;
  if (error) return { packages: [], error: error.message };

  type ItemRow = { package_id: string; pack_id: string; quantity: number; packs: { name_en: string; name_ar: string } | null };
  const items = (itemRes.data ?? []) as unknown as ItemRow[];

  const packages = (pkgRes.data ?? []).map((p) => ({
    ...p,
    items: items
      .filter((i) => i.package_id === p.id)
      .map((i) => ({ pack_id: i.pack_id, quantity: i.quantity, name_en: i.packs?.name_en ?? '', name_ar: i.packs?.name_ar ?? '' })),
    prices: Object.fromEntries(
      (priceRes.data ?? []).filter((pr) => pr.package_id === p.id).map((pr) => [pr.car_type, Number(pr.price)])
    ) as Partial<Record<CarType, number>>,
  }));
  return { packages, error: null };
}

export async function fetchMyPackages(userId: string): Promise<{ userPackages: UserPackage[]; error: string | null }> {
  const { data, error } = await supabase
    .from('user_packages')
    .select('id, car_id, package_name_en, package_name_ar, price, status, expires_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return { userPackages: [], error: error.message };

  const ids = (data ?? []).map((r) => r.id);
  const { data: balances, error: balErr } = ids.length
    ? await supabase
        .from('user_package_balances')
        .select('user_package_id, pack_id, pack_name_en, pack_name_ar, quantity, used, remaining')
        .in('user_package_id', ids)
    : { data: [], error: null };
  if (balErr) return { userPackages: [], error: balErr.message };

  const userPackages = (data ?? []).map((r) => ({
    ...r,
    price: Number(r.price),
    // The dashboard flips stale rows to 'expired'; until then, treat them as expired here.
    status: (r.status === 'active' && r.expires_at && new Date(r.expires_at) <= new Date() ? 'expired' : r.status) as UserPackageStatus,
    balances: (balances ?? []).filter((b) => b.user_package_id === r.id),
  }));
  return { userPackages, error: null };
}

// The active package (if any) that can pay for this pack on this car on this date.
export function usablePackage(
  userPackages: UserPackage[],
  carId: string | null,
  packId: string | null,
  bookingDate: string
): { userPackage: UserPackage; remaining: number } | null {
  if (!carId || !packId) return null;
  for (const up of userPackages) {
    if (up.status !== 'active' || up.car_id !== carId || !up.expires_at) continue;
    if (bookingDate > up.expires_at.split('T')[0]) continue;
    const balance = up.balances.find((b) => b.pack_id === packId);
    if (balance && balance.remaining > 0) return { userPackage: up, remaining: balance.remaining };
  }
  return null;
}
