import { Text, type TextProps } from 'react-native';

const FONT = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export function T({
  weight = 'medium',
  className,
  style,
  ...props
}: TextProps & { weight?: keyof typeof FONT }) {
  return <Text {...props} className={className} style={[{ fontFamily: FONT[weight] }, style]} />;
}
