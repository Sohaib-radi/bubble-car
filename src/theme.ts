// Black Bubble Wash — shared design tokens
// Mirrors the HTML prototype 1:1 (colors, gradients, radii, spacing).

export const colors = {
  bg: '#0b0b0c',
  bgAlt: '#070708',
  surface: '#161619',       // input / button fields
  surfaceAlt: '#141417',    // cards
  surfaceGoldTint: '#1a160c', // selected / gold-tinted surface
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.06)',
  borderGold: 'rgba(201,162,75,0.3)',
  borderGoldStrong: 'rgba(212,175,55,0.35)',

  text: '#f3f1ea',
  textDim: 'rgba(243,241,234,0.55)',
  textFaint: 'rgba(243,241,234,0.45)',
  textFainter: 'rgba(243,241,234,0.35)',
  label: '#7e7b73',          // uppercase field labels
  navInactive: '#6c6c72',

  gold: '#cdb37a',
  goldDeep: '#8a6a28',
  goldOnGoldText: '#1a1407', // text sitting on gold gradient
  success: '#86d6a3',
  danger: '#e08585',
};

export const gradients = {
  // Primary CTA / accents button gradient
  gold: ['#8a6a28', '#d6bb78', '#bda05a', '#7d5f22'] as const,
  goldLocations: [0, 0.48, 0.66, 1] as const,

  // Icon tile / date-chip gradient
  goldSoft: ['#9a7836', '#d6bb78', '#9a7836'] as const,
  goldSoftLocations: [0, 0.55, 1] as const,

  // VIP card gradient
  goldCard: ['#6f4f14', '#b89640', '#ddc079', '#7d5d22'] as const,
  goldCardLocations: [0, 0.4, 0.6, 1] as const,

  // Card shell backdrop gradient (phone-frame look, optional on real device)
  shell: ['#2b2b30', '#0b0b0d'] as const,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
};

import { I18nManager } from 'react-native';

// Manrope has no Arabic glyphs, so Arabic (the app's only RTL language) uses Cairo instead.
// Safe to decide once at module load: switching languages always triggers a full app reload.
export const fonts = I18nManager.isRTL
  ? {
      regular: 'Cairo_400Regular',
      medium: 'Cairo_500Medium',
      semibold: 'Cairo_600SemiBold',
      bold: 'Cairo_700Bold',
      extrabold: 'Cairo_800ExtraBold',
    }
  : {
      regular: 'Manrope_400Regular',
      medium: 'Manrope_500Medium',
      semibold: 'Manrope_600SemiBold',
      bold: 'Manrope_700Bold',
      extrabold: 'Manrope_800ExtraBold',
    };

export const shadow = {
  cta: {
    shadowColor: '#c9a24b',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
};
