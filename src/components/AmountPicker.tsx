import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';
import { TextField } from './TextField';

const QUICK_AMOUNTS = [1, 2, 5, 10, 20];

interface AmountPickerProps {
  /** The amount as typed, e.g. "5" or "2.50". */
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  error?: string;
}

/** Quick-pick amounts with a box for any other amount. */
export function AmountPicker({ value, onChange, currency = 'USD', error }: AmountPickerProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {QUICK_AMOUNTS.map((amount) => {
          const selected = Number(value) === amount;
          return (
            <Pressable
              key={amount}
              accessibilityRole="button"
              accessibilityLabel={`${currency} ${amount}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(String(amount))}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.accent : theme.surface,
                  borderColor: selected ? theme.accent : 'transparent',
                },
              ]}>
              <AppText variant="heading" tone={selected ? 'onPrimary' : 'default'}>
                ${amount}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <TextField
        label="Amount"
        prefix={currency}
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  chips: { flexDirection: 'row', gap: space.sm },
  chip: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
});
