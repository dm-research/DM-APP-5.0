// components/theme.js
export const COLORS = {
  navy:        '#102A56',
  navyDark:    '#0B1E3D',
  navyLight:   '#1a3a6e',
  gold:        '#B48900',
  goldLight:   '#D4A500',
  goldPale:    '#FFF8E7',
  white:       '#FFFFFF',
  offWhite:    '#F7F9FC',
  surface:     '#FFFFFF',
  bg:          '#F1F5F9',
  border:      '#E2E8F0',
  text:        '#0F172A',
  textMid:     '#334155',
  textLight:   '#64748B',
  textMuted:   '#94A3B8',
  green:       '#16A34A',
  greenLight:  '#DCFCE7',
  red:         '#DC2626',
  redLight:    '#FEE2E2',
  amber:       '#D97706',
  amberLight:  '#FEF3C7',
  blue:        '#1D4ED8',
  blueLight:   '#DBEAFE',
};

export const FONTS = {
  black:  '900',
  bold:   '700',
  semi:   '600',
  medium: '500',
  reg:    '400',
};

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 4,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
  },
};
