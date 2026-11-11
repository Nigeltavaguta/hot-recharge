import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, accessibilityLabel, style }: CardProps) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.surface }, style];

  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && { backgroundColor: theme.surfaceAlt }]}>
      {children}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="heading">{title}</AppText>
      {action && onAction && (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onAction}>
          <AppText variant="label" tone="link">
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

/** One label/value line, used on confirm and receipt screens. */
export function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="label" tone="faint">
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'label'} selectable style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

type NoticeTone = 'info' | 'success' | 'warning' | 'danger';

/** Inline message box for errors, warnings and confirmations. */
export function Notice({ tone, text, icon }: { tone: NoticeTone; text: string; icon?: IconName }) {
  const theme = useTheme();
  const colors = {
    info: { bg: theme.surfaceAlt, fg: theme.textMuted },
    success: { bg: theme.successSoft, fg: theme.successText },
    warning: { bg: theme.warningSoft, fg: theme.warningText },
    danger: { bg: theme.dangerSoft, fg: theme.dangerText },
  }[tone];
  const defaultIcon: IconName = tone === 'success' ? 'success' : tone === 'info' ? 'info' : 'alert';

  return (
    <View
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
      style={[styles.notice, { backgroundColor: colors.bg }]}>
      <Icon name={icon ?? defaultIcon} size={18} color={colors.fg} />
      <AppText variant="label" style={[styles.noticeText, { color: colors.fg }]}>
        {text}
      </AppText>
    </View>
  );
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Icon name={icon} size={28} color={theme.textFaint} />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      <AppText tone="muted" center>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.lg,
    paddingVertical: 6,
  },
  detailValue: { flex: 1, textAlign: 'right' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm, padding: space.md, borderRadius: radius.md },
  noticeText: { flex: 1 },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
});
