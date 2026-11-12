import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

import { AUTH_HERO_OVERLAP, AUTH_HERO_TOP_BAR, AuthHero } from './AuthHero';

interface AuthScaffoldProps {
  /** Share of the screen height the photo takes before scrolling, e.g. 0.46. */
  heroFraction: number;
  heroMin: number;
  heroMax: number;
  /** Shows a back button on the photo. */
  onBack?: () => void;
  /** The form. Laid out in a column with even gaps. */
  children: ReactNode;
}

/**
 * Layout shared by sign-in and sign-up.
 * The photo stays pinned at the top; only the form panel scrolls, sliding up over the photo.
 * The panel stops below the logo row, so the logo and back button are always visible and tappable.
 */
export function AuthScaffold({ heroFraction, heroMin, heroMax, onBack, children }: AuthScaffoldProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const heroHeight = Math.round(Math.min(heroMax, Math.max(heroMin, screenHeight * heroFraction)));
  const topBar = insets.top + AUTH_HERO_TOP_BAR;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Pinned behind the scrolling panel. */}
      <View style={styles.hero}>
        <AuthHero height={heroHeight} onBack={onBack} />
      </View>

      <ScrollView
        style={{ marginTop: topBar }}
        bounces={false}
        overScrollMode="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // The empty space at the top lets the photo show through until the panel is scrolled over it.
        contentContainerStyle={[styles.scroll, { paddingTop: heroHeight - topBar - AUTH_HERO_OVERLAP }]}>
        <Animated.View
          entering={FadeInDown.duration(450)}
          style={[styles.panel, { backgroundColor: theme.surface, paddingBottom: insets.bottom + space.xxl }]}>
          {children}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  scroll: { flexGrow: 1 },
  panel: {
    flexGrow: 1,
    borderTopLeftRadius: AUTH_HERO_OVERLAP,
    borderTopRightRadius: AUTH_HERO_OVERLAP,
    paddingHorizontal: space.xxl,
    paddingTop: space.xxl,
    gap: space.lg,
  },
});
