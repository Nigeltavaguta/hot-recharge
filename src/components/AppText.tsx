import { StyleSheet, Text, type TextProps } from 'react-native';

import type { Theme } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'faint' | 'link' | 'onPrimary' | 'success' | 'warning' | 'danger';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
}

const toneColor = (theme: Theme, tone: Tone): string => {
  switch (tone) {
    case 'muted':
      return theme.textMuted;
    case 'faint':
      return theme.textFaint;
    case 'link':
      return theme.link;
    case 'onPrimary':
      return theme.onPrimary;
    case 'success':
      return theme.successText;
    case 'warning':
      return theme.warningText;
    case 'danger':
      return theme.dangerText;
    default:
      return theme.text;
  }
};

/** The single text component, so type sizes stay consistent and respect the user's font scale. */
export function AppText({ variant = 'body', tone = 'default', center, style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[styles[variant], { color: toneColor(theme, tone) }, center && styles.center, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  center: { textAlign: 'center' },
});
