import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import type { Product } from '@/models';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

interface ProductPickerProps {
  products: Product[];
  selected: Product | null;
  select: (id: string) => void;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Lets the user choose between the products available for a purchase,
 * for example the same airtime paid in USD or in ZWG.
 * Shows nothing when there is only one product, since it is already selected.
 */
export function ProductPicker({ products, selected, select, loading, error, retry }: ProductPickerProps) {
  const theme = useTheme();

  if (loading) return <ActivityIndicator color={theme.primary} />;
  if (error) {
    return (
      <View style={styles.group}>
        <Notice tone="danger" text={error} />
        <Button label="Try again" variant="outline" icon="refresh" onPress={retry} />
      </View>
    );
  }
  if (products.length === 0) return <Notice tone="info" text="No products are available for this right now." />;
  if (products.length === 1) return null;

  return (
    <View style={styles.group}>
      <AppText variant="label" tone="muted">
        Product
      </AppText>
      <View accessibilityRole="radiogroup" style={styles.group}>
        {products.map((product) => {
          const isSelected = selected?.id === product.id;
          return (
            <Pressable
              key={product.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${product.name}, ${product.currency}`}
              onPress={() => select(product.id)}
              style={[
                styles.option,
                {
                  backgroundColor: isSelected ? theme.accentSoft : theme.surface,
                  borderColor: isSelected ? theme.accent : 'transparent',
                },
              ]}>
              <AppText variant="label" numberOfLines={1} style={styles.flex}>
                {product.name}
              </AppText>
              <View style={[styles.currency, { backgroundColor: isSelected ? theme.surface : theme.surfaceAlt }]}>
                <AppText variant="caption" tone="muted">
                  {product.currency}
                </AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? theme.accent : theme.border,
                    backgroundColor: isSelected ? theme.accent : 'transparent',
                  },
                ]}>
                {isSelected && <Icon name="check" size={14} color={theme.onPrimary} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  currency: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.pill },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
