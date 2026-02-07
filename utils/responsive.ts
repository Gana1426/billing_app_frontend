import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on a standard mobile design size (iPhone X/11/12)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

export const scale = (size: number) =>
  (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

export const verticalScale = (size: number) =>
  (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const wp = (percent: number) => (SCREEN_WIDTH * percent) / 100;
export const hp = (percent: number) => (SCREEN_HEIGHT * percent) / 100;

export const isSmallDevice = SCREEN_WIDTH < 360;
export const isTablet = SCREEN_WIDTH >= 768;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

// Keeps font sizes balanced when user font scaling is enabled
export const scaleFont = (size: number) => {
  const fontScale = PixelRatio.getFontScale();
  return Math.round(moderateScale(size) / fontScale);
};

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};
