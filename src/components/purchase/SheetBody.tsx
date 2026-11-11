import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

/** Scrolling content of a sheet step with its action bar pinned underneath. */
export function SheetBody({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: insets.bottom + space.md }]}>
        {footer}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Shrinks to its content, and scrolls once the sheet reaches its maximum height.
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.lg },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: 1, gap: space.sm },
});
