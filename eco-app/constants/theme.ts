import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',

    primary: '#1B4332',
    primaryLight: '#EAF3DE',
    secondary: '#639922',

    textPrimary: '#1a1a1a',
    textSecondary: '#888',
    textMuted: '#aaa',
    textPlaceholder: '#bbb',

    card: '#fff',
    cardBackground: '#f7f7f7',
    cardBorder: '#f0f0f0',

    border: '#E5E5E5',
    divider: '#f0f0f0',
    formBackground: '#FAFAFA',

    success: '#EAF3DE',
    successText: '#1B4332',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    warning: '#FEF3C7',
    warningText: '#92400E',

    avatarBg: '#639922',
    rankDefault: '#F5F5F5',
    rankGold: '#FEF3C7',
    rankSilver: '#F3F4F6',
    rankBronze: '#FEF2F2',
    rankGoldText: '#92400E',
    rankSilverText: '#4B5563',
    rankBronzeText: '#991B1B',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',

    primary: '#2D6A4F',
    primaryLight: '#1a3a2a',
    secondary: '#86EFAC',

    textPrimary: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#6B7280',
    textPlaceholder: '#4B5563',

    card: '#1c1c1e',
    cardBackground: '#2c2c2e',
    cardBorder: '#38383a',

    border: '#38383a',
    divider: '#2c2c2e',
    formBackground: '#1c1c1e',

    success: '#1a3a2a',
    successText: '#86EFAC',
    danger: '#f87171',
    dangerBg: '#3b1a1a',
    warning: '#3b2a1a',
    warningText: '#FBBF24',

    avatarBg: '#2D6A4F',
    rankDefault: '#2c2c2e',
    rankGold: '#3b2a1a',
    rankSilver: '#2c2c2e',
    rankBronze: '#3b1a1a',
    rankGoldText: '#FBBF24',
    rankSilverText: '#9CA3AF',
    rankBronzeText: '#f87171',
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
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
