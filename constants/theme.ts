import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

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
  game: {
    pageBackground: '#000000',
    titleText: '#ffd700',
    subtitleText: '#c9b037',
    borderColor: '#ffd700',
    gameBackground: '#1a1a1a',
    skyBackground: '#f7f7f7',
    groundColor: '#f7f7f7',
    textColor: '#ffd700',
    buttonBackground: '#ffd700',
    buttonHover: '#c9b037',
    buttonGreen: '#ffd700',
    accentPrimary: '#ffd700',
    accentSecondary: '#ffd700',
    accentGold: '#ffd700',
    nightModeBase: 'rgba(32, 32, 32, ',
    overlayBackground: 'rgba(0, 0, 0, 0.95)',
    casinoRed: '#ff0000',
    casinoGreen: '#ffd700',
    casinoGold: '#ffd700',
    casinoBlack: '#000000',
  },
} as const;

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

export const GameUI = {
  maxGameWidth: 1200,
  screenPadding: 16,
  screenHeightRatio: 0.7,
  pagePadding: 8,
  pageGap: 12,
  scoreGap: 8,
  scoreOffset: 4,
  borderWidth: 3,
} as const;
