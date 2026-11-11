import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { NetworkSelector } from '@/components/NetworkSelector';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { TextField } from '@/components/TextField';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney } from '@/utils/format';
import { useBundlesViewModel } from '@/viewmodels/useBundlesViewModel';

import { SheetBody } from './SheetBody';

export function BundleForm({ prefill }: { prefill?: string }) {
  const vm = useBundlesViewModel(prefill);
  const theme = useTheme();

  return (
    <SheetBody footer={<PurchaseFooter total={vm.total} buttonLabel="Continue" onPress={vm.submit} />}>
      <TextField
        label="Mobile number"
        icon="airtime"
        placeholder="0772345678"
        keyboardType="phone-pad"
        value={vm.number}
        onChangeText={vm.setNumber}
        error={vm.errors.number}
        hint="The network is picked automatically from the number."
      />

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Network
        </AppText>
        <NetworkSelector value={vm.network} onChange={vm.setNetwork} />
      </View>

      <View style={styles.group}>
        <AppText variant="label" tone="muted">
          Bundle
        </AppText>

        {!vm.network && <Notice tone="info" text="Enter a number or choose a network to see its bundles." />}
        {vm.loading && <ActivityIndicator color={theme.primary} style={styles.loading} />}
        {vm.loadError && (
          <>
            <Notice tone="danger" text={vm.loadError} />
            <Button label="Try again" variant="outline" icon="refresh" onPress={vm.retry} />
          </>
        )}

        <View accessibilityRole="radiogroup" style={styles.group}>
          {vm.bundles.map((bundle) => {
            const selected = vm.selected?.id === bundle.id;
            return (
              <Pressable
                key={bundle.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${bundle.name}, ${bundle.allowance}, ${bundle.validity}, ${formatMoney(bundle.price)}`}
                onPress={() => vm.select(bundle.id)}
                style={[
                  styles.bundle,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.surface,
                    borderColor: selected ? theme.accent : 'transparent',
                  },
                ]}>
                <View style={styles.flex}>
                  <AppText variant="heading">{bundle.allowance}</AppText>
                  <AppText variant="caption" tone="faint">
                    {bundle.name} · {bundle.validity}
                  </AppText>
                </View>
                <AppText variant="heading">{formatMoney(bundle.price)}</AppText>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected ? theme.accent : theme.border,
                      backgroundColor: selected ? theme.accent : 'transparent',
                    },
                  ]}>
                  {selected && <Icon name="check" size={14} color={theme.onPrimary} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {vm.errors.bundle && (
          <AppText variant="caption" tone="danger">
            {vm.errors.bundle}
          </AppText>
        )}
      </View>
    </SheetBody>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: space.sm },
  loading: { paddingVertical: space.lg },
  bundle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 60,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
