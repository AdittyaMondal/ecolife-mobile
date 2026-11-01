import { Platform, type ViewStyle } from 'react-native';

export const clayShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#202820',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

export const hardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#202820',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  android: { elevation: 4 },
  default: {},
}) as ViewStyle;
