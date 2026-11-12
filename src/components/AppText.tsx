import { StyleSheet, Text, type TextProps } from 'react-native';

import type { Theme } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
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
  display: { fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold },
  title: { fontSize: 22, lineHeight: 28, fontFamily: fonts.extrabold },
  heading: { fontSize: 16, lineHeight: 22, fontFamily: fonts.bold },
  body: { fontSize: 15, lineHeight: 21, fontFamily: fonts.regular },
  label: { fontSize: 14, lineHeight: 20, fontFamily: fonts.semibold },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
  center: { textAlign: 'center' },
});
