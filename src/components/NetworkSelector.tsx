import { Pressable, StyleSheet, View } from 'react-native';

import type { Network } from '@/models';
import { networkColors, radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { NETWORKS, networkName } from '@/utils/phone';

import { AppText } from './AppText';

/** Coloured initial for a network. Replace with the approved logos when available. */
export function NetworkBadge({ network, size = 36 }: { network: Network; size?: number }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 3, backgroundColor: networkColors[network] },
      ]}>
      <AppText variant="heading" tone="onPrimary" style={{ fontSize: size * 0.45, lineHeight: size * 0.6 }}>
        {networkName(network).charAt(0)}
      </AppText>
    </View>
  );
}

interface NetworkSelectorProps {
  value: Network | null;
  onChange: (network: Network) => void;
}

export function NetworkSelector({ value, onChange }: NetworkSelectorProps) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.row}>
      {NETWORKS.map((n) => {
        const selected = value === n.id;
        return (
          <Pressable
            key={n.id}
            accessibilityRole="radio"
            accessibilityLabel={n.name}
            accessibilityState={{ selected }}
            onPress={() => onChange(n.id)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.accentSoft : theme.surface,
                borderColor: selected ? theme.accent : 'transparent',
              },
            ]}>
            <NetworkBadge network={n.id} size={32} />
            <AppText variant="label">{n.name}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: space.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: space.md,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
});
