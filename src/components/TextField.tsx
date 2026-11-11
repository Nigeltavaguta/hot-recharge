import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: IconName;
  /** Fixed text shown before the input, such as a currency code. */
  prefix?: string;
  error?: string;
  hint?: string;
  /** Hides the text and adds a show/hide button. */
  password?: boolean;
  right?: ReactNode;
}

export function TextField({ label, icon, prefix, error, hint, password, right, ...input }: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? theme.danger : focused ? theme.accent : theme.border;

  return (
    <View style={styles.wrap}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <View style={[styles.box, { borderColor, backgroundColor: theme.surface }]}>
        {icon && <Icon name={icon} size={20} color={theme.textFaint} />}
        {prefix && (
          <AppText variant="label" tone="faint">
            {prefix}
          </AppText>
        )}
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={password && hidden}
          placeholderTextColor={theme.textFaint}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text }]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}>
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={theme.textFaint} />
          </Pressable>
        )}
        {right}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: space.md },
});
