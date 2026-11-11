import type { Network } from '@/models';

/** Brand palette. Semantic themes below are what components should use. */
export const palette = {
  red: '#E2231A',
  redDark: '#B8190F',
  orange: '#F26522',
  flame: '#FFB81C',
  white: '#FFFFFF',
} as const;

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Filled brand surfaces (buttons, balance card). */
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  primarySoft: string;
  /** Brand colour that is readable as text on `bg` and `surface`. */
  link: string;
  accent: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;
}

export const lightTheme: Theme = {
  dark: false,
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F1F4',
  border: '#E4E4E8',
  text: '#1B1B1F',
  textMuted: '#5A5A63',
  textFaint: '#6B6B75',
  primary: palette.red,
  primaryPressed: palette.redDark,
  onPrimary: palette.white,
  primarySoft: '#FEE7E5',
  link: palette.redDark,
  accent: palette.orange,
  accentSoft: '#FFE9DC',
  success: '#1B9E5B',
  successSoft: '#E3F5EC',
  successText: '#157A47',
  warning: '#E08A00',
  warningSoft: '#FCF1DB',
  warningText: '#8A5500',
  danger: '#D43A2F',
  dangerSoft: '#FBE5E3',
  dangerText: '#A82B22',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#16161A',
  surface: '#1E1E23',
  surfaceAlt: '#27272D',
  border: '#34343B',
  text: '#F7F7F9',
  textMuted: '#C4C4CB',
  textFaint: '#9A9AA3',
  primary: palette.red,
  primaryPressed: palette.redDark,
  onPrimary: palette.white,
  primarySoft: '#3A1B19',
  link: '#FF7A70',
  accent: palette.orange,
  accentSoft: '#3A2416',
  success: '#1B9E5B',
  successSoft: '#16301F',
  successText: '#4CC98A',
  warning: '#E08A00',
  warningSoft: '#33270F',
  warningText: '#F0B040',
  danger: '#D43A2F',
  dangerSoft: '#3A1B19',
  dangerText: '#FF8076',
};

/** Placeholder network colours until the approved logos are added. */
export const networkColors: Record<Network, string> = {
  econet: '#0B4EA2',
  netone: '#F58220',
  telecel: '#D0202E',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
