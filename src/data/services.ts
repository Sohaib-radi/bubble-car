export const SERVICE_KEYS = ['exterior', 'full', 'gaz', 'accessories'] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export const SERVICE_PRICES: Record<ServiceKey, number> = {
  exterior: 250,
  full: 300,
  gaz: 500,
  accessories: 200,
};
