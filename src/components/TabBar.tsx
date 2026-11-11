import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AppText } from './AppText';

const BAR_HEIGHT = 60;
const BAR_MARGIN = 10;

/** Bottom padding a tab screen needs so its last item is not hidden behind the floating bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + BAR_MARGIN + insets.bottom + space.lg;
}

/** Floating pill tab bar. The active tab shows its label; the others show only an icon. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + BAR_MARGIN }]}>
      <View
        accessibilityRole="tablist"
        style={[styles.bar, { backgroundColor: theme.surface, shadowColor: theme.dark ? '#000000' : '#1B1B1F' }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;
          const color = focused ? theme.link : theme.textFaint;

          function onPress() {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={[styles.tab, focused && { backgroundColor: theme.primarySoft, flexGrow: 1.6 }]}>
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              {focused && (
                <AppText variant="label" numberOfLines={1} style={{ color }}>
                  {label}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: space.xl },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: BAR_HEIGHT,
    width: '100%',
    maxWidth: 420,
    padding: 6,
    borderRadius: radius.pill,
    elevation: 8,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  tab: {
    flexGrow: 1,
    flexBasis: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.pill,
  },
});
