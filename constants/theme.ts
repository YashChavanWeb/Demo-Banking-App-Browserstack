import { Platform } from 'react-native';

// Design system — Urbanist / modern banking palette
export const BSColors = {
  // Primary navy-blue (--color-primary)
  primary: '#1E3A8A',
  primaryLight: '#3B82F6',
  primaryDark: '#1E3A8A',
  primaryBg: '#EFF6FF',      // light blue tint
  primaryBorder: '#BFDBFE',  // blue-200

  // Accent indigo (--color-accent)
  accent: '#6366F1',
  accentLight: '#A5B4FC',

  // Neutrals
  navy: '#0F172A',
  navyLight: '#1E293B',
  white: '#FFFFFF',
  bgPage: '#FCFBFC',         // --color-bg
  bgCard: '#FFFFFF',         // --color-surface
  lightGray: '#F1F5F9',
  mediumGray: '#E2E8F0',     // --color-border
  darkGray: '#64748B',       // --color-muted
  textPrimary: '#0F172A',    // --color-text
  textSecondary: '#475569',

  // Semantic
  error: '#EF4444',          // --color-danger
  success: '#10B981',        // --color-success
  warning: '#F59E0B',        // --color-warning
  info: '#3B82F6',

  // Legacy aliases (keep so existing references don't break)
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  blueDark: '#1D4ED8',
  orange: '#1E3A8A',
  orangeLight: '#3B82F6',
  orangeDark: '#1E3A8A',
  inputBorder: '#BFDBFE',
  inputBg: '#EFF6FF',
};

const tintColorLight = BSColors.primary;
const tintColorDark = BSColors.primaryLight;

export const Colors = {
  light: {
    text: BSColors.textPrimary,
    background: BSColors.bgPage,
    tint: tintColorLight,
    icon: BSColors.darkGray,
    tabIconDefault: BSColors.darkGray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace",
  },
});