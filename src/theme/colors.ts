export const colors = {
  dawnViolet: '#4F3DE8',
  emberCoral: '#FF6B4A',
  growthSage: '#209A6C',
  streakAmber: '#E88A1E',
  lilac: '#F4F1FF',
  ink: '#1B1730',
  white: '#FFFFFF',
  black: '#000000',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey800: '#333333',
};

// Based on the UI/UX design, Dark mode swaps surface and ink tokens.
// Brand violet and coral stay constant.

export const lightTheme = {
  background: colors.white,
  surface: colors.lilac,
  text: colors.ink,
  textMuted: '#666666',
  primary: colors.dawnViolet,
  secondary: colors.emberCoral,
  success: colors.growthSage,
  warning: colors.streakAmber,
  border: colors.grey200,
  card: colors.white,
};

export const darkTheme = {
  background: colors.ink, // Base dark theme
  surface: '#252140', // Slightly lighter than ink for surfaces
  text: colors.white,
  textMuted: '#AAAAAA',
  primary: colors.dawnViolet, // Stays constant
  secondary: colors.emberCoral, // Stays constant
  success: colors.growthSage,
  warning: colors.streakAmber,
  border: '#332F4D',
  card: '#252140',
};
