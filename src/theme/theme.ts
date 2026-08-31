import type { AuthProvider } from '../types/user';

export const colors = {
  background: '#0B1120',
  surface: '#151E32',
  surfaceAlt: '#1E293B',
  border: '#27364F',
  primary: '#4F7DF9',
  primaryDark: '#3B63D1',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textInverted: '#0B1120',
  danger: '#F87171',
  dangerSurface: '#3B1D24',
  success: '#34D399',
  bubbleOwn: '#4F7DF9',
  bubbleOther: '#1E293B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  title: 26,
  subtitle: 18,
  body: 15,
  caption: 12,
} as const;

/** Cor de destaque de cada provedor, usada nos selos da lista de contatos. */
export const providerColors: Readonly<Record<AuthProvider, string>> = {
  password: '#38BDF8',
  google: '#FBBF24',
  apple: '#E2E8F0',
};
