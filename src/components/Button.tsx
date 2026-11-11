import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const filled = variant === 'primary';
  const contentColor = filled ? theme.onPrimary : variant === 'ghost' ? theme.link : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        filled && { backgroundColor: pressed ? theme.primaryPressed : theme.primary },
        variant === 'outline' && {
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: pressed ? theme.surfaceAlt : theme.surface,
        },
        variant === 'ghost' && pressed && { backgroundColor: theme.surfaceAlt },
        inactive && styles.inactive,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={contentColor} />}
          <AppText variant="heading" style={{ color: contentColor }}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  inactive: { opacity: 0.5 },
});
