import type { ReactNode } from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

interface ScreenProps {
  children: ReactNode;
  /** Set on screens that have no navigation header, so content clears the status bar. */
  padTop?: boolean;
  /** Full-width block at the very top, drawn edge to edge (it handles the status bar itself). */
  hero?: ReactNode;
  /** Extra space at the bottom, e.g. to clear the floating tab bar. */
  bottomSpace?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Standard scrolling page: handles safe areas, the keyboard and pull-to-refresh. */
export function Screen({ children, padTop, hero, bottomSpace, refreshing, onRefresh }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const paddingTop = hero ? space.lg : padTop ? insets.top + space.md : space.md;

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace ?? space.xxl }}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          ) : undefined
        }>
        {hero}
        <View style={[styles.content, { paddingTop }]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.lg },
});
