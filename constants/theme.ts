import { Platform } from 'react-native';

// BrowserStack brand colors
export const BSColors = {
  orange: '#FF6B00',
  orangeLight: '#FF8C3A',
  orangeDark: '#E55A00',
  navy: '#1A1A2E',
  navyLight: '#16213E',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#666666',
  error: '#D32F2F',
  success: '#2E7D32',
  inputBorder: '#CCCCCC',
  inputBg: '#FAFAFA',
};

const tintColorLight = BSColors.orange;
const tintColorDark = BSColors.orangeLight;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
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