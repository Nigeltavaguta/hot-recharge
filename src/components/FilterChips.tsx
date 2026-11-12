import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

interface FilterChipsProps<T extends string> {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}

/** A row of pill filters. The selected one is filled; counts are optional. */
export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  const theme = useTheme();
  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.count === undefined ? option.label : `${option.label}, ${option.count}`}
            onPress={() => onChange(option.id)}
            style={[styles.chip, { backgroundColor: selected ? theme.text : theme.surface }]}>
            <AppText variant="label" style={{ color: selected ? theme.bg : theme.textMuted }}>
              {option.label}
            </AppText>
            {option.count !== undefined && (
              <AppText variant="caption" style={{ color: selected ? theme.bg : theme.textFaint }}>
                {option.count}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
});
