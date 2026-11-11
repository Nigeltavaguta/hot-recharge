import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type SymbolName = Extract<SymbolViewProps['name'], object>;

/**
 * Every icon the app uses, in one place. Uses SF Symbols on iOS and
 * Material Symbols on Android, through expo-symbols which ships with Expo.
 */
const ICONS = {
  home: { ios: 'house.fill', android: 'home' },
  tokens: { ios: 'key.fill', android: 'key' },
  activity: { ios: 'clock.arrow.circlepath', android: 'history' },
  profile: { ios: 'person.fill', android: 'person' },
  airtime: { ios: 'phone.fill', android: 'call' },
  bundle: { ios: 'wifi', android: 'wifi' },
  zesa: { ios: 'bolt.fill', android: 'bolt' },
  payment: { ios: 'creditcard.fill', android: 'payments' },
  wallet: { ios: 'creditcard.fill', android: 'account_balance_wallet' },
  eye: { ios: 'eye', android: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  check: { ios: 'checkmark', android: 'check' },
  success: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  failed: { ios: 'xmark.circle.fill', android: 'cancel' },
  pending: { ios: 'clock.fill', android: 'schedule' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  lock: { ios: 'lock.fill', android: 'lock' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  info: { ios: 'info.circle', android: 'info' },
  alert: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  repeat: { ios: 'repeat', android: 'repeat' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  close: { ios: 'xmark', android: 'close' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color: ColorValue;
}

export function Icon({ name, size = 22, color }: IconProps) {
  const symbol = ICONS[name];
  return (
    <SymbolView
      name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
      size={size}
      tintColor={color}
    />
  );
}
