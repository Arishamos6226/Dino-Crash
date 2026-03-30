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
    pageBackground: '#f8f9fb',
    titleText: '#121212',
    subtitleText: '#444',
    borderColor: '#535353',
    gameBackground: '#ffffff',
    skyBackground: '#f7f7f7',
    groundColor: '#f7f7f7',
    textColor: '#535353',
    nightModeBase: 'rgba(32, 32, 32, ',
    overlayBackground: 'rgba(247, 247, 247, 0.9)',
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
  maxGameWidth: 800,
  screenPadding: 32,
  screenHeightRatio: 0.4,
  pagePadding: 16,
  pageGap: 12,
  scoreGap: 8,
  scoreOffset: 4,
  borderWidth: 2,
} as const;
