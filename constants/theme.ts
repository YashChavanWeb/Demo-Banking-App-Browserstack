import { Platform } from 'react-native';

// BrowserStack brand colors — indigo/blue design system (matching browserstack.com)
export const BSColors = {
  // Primary indigo/blue
  primary: '#4F46E5',
  primaryLight: '#6366F1',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',      // lavender tint background
  primaryBorder: '#C7D2FE',  // indigo border

  // Accent / CTA blue (the "Get started free" button)
  blue: '#2563EB',
  blueLight: '#3B82F6',
  blueDark: '#1D4ED8',

  // Neutrals
  navy: '#1E1B4B',
  navyLight: '#312E81',
  white: '#FFFFFF',
  bgPage: '#F8FAFF',         // very light blue-white page background
  bgCard: '#FFFFFF',
  lightGray: '#F1F5F9',
  mediumGray: '#E2E8F0',
  darkGray: '#64748B',
  textPrimary: '#0F172A',
  textSecondary: '#475569',

  // Semantic
  error: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  info: '#0891B2',

  // Legacy aliases (keep so existing references don't break)
  orange: '#4F46E5',
  orangeLight: '#6366F1',
  orangeDark: '#3730A3',
  inputBorder: '#C7D2FE',
  inputBg: '#F8FAFF',
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