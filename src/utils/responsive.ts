import { Dimensions } from 'react-native';

// Get device dimensions
const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scale size based on screen width
 * Use for horizontal spacing, margins, paddings
 */
export const scale = (size: number): number => {
  return (width / guidelineBaseWidth) * size;
};

/**
 * Scale size based on screen height
 * Use for vertical spacing, margins, paddings
 */
export const verticalScale = (size: number): number => {
  return (height / guidelineBaseHeight) * size;
};

/**
 * Moderate scale - scales with a factor
 * Use for font sizes, icon sizes
 * @param size - base size
 * @param factor - scale factor (default: 0.5)
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

/**
 * Get responsive font size based on screen width
 */
export const getFontSize = (baseSize: number): number => {
  return moderateScale(baseSize, 0.3);
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  return width >= 768;
};

/**
 * Check if device is a small phone
 */
export const isSmallDevice = (): boolean => {
  return width < 375;
};

/**
 * Get responsive spacing
 */
export const getSpacing = (baseSpacing: number): number => {
  return moderateScale(baseSpacing, 0.25);
};

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  small: 320,
  medium: 375,
  large: 414,
  tablet: 768,
  desktop: 1024,
};

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = (): keyof typeof breakpoints => {
  if (width < breakpoints.medium) return 'small';
  if (width < breakpoints.large) return 'medium';
  if (width < breakpoints.tablet) return 'large';
  if (width < breakpoints.desktop) return 'tablet';
  return 'desktop';
};
