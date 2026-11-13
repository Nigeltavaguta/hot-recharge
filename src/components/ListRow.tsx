import { Pressable, StyleSheet, View } from 'react-native';

import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
  icon: IconName;
  label: string;
  /** Shown on the right, e.g. an account number or a count. */
  value?: string;
  /** Makes the row tappable and adds a chevron. */
  onPress?: () => void;
  /** Red styling for destructive actions such as signing out. */
  danger?: boolean;
  /** Leave out the divider under the last row of a group. */
  last?: boolean;
}

/** One line of a settings-style list. Put several inside a Card with no padding. */
export function ListRow({ icon, label, value, onPress, danger, last }: ListRowProps) {
  const theme = useTheme();
  const color = danger ? theme.dangerText : theme.text;

  const content = (
    <>
      <View style={[styles.icon, { backgroundColor: danger ? theme.dangerSoft : theme.surfaceAlt }]}>
        <Icon name={icon} size={18} color={danger ? theme.dangerText : theme.textMuted} />
      </View>
      <View style={[styles.body, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <AppText variant="label" style={{ color }}>
          {label}
        </AppText>
        <View style={styles.end}>
          {value !== undefined && (
            <AppText variant="label" tone="faint" selectable={!onPress} numberOfLines={1} style={styles.value}>
              {value}
            </AppText>
          )}
          {onPress && !danger && <Icon name="chevronRight" size={16} color={theme.textFaint} />}
        </View>
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceAlt }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingLeft: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingRight: 14,
  },
  end: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  value: { flexShrink: 1 },
});
