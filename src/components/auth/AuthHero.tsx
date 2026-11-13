import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { palette, space } from '@/theme/colors';

// Photo: "Male Professional" by Kristin Hardwick, CC0 (see THIRD_PARTY_NOTICES.md).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const photo = require('../../../assets/images/auth-hero.jpg');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hotLogo = require('../../../assets/images/hot-logo.png');

/** How soft the photo is. 0 = sharp; higher = blurrier. */
const PHOTO_BLUR = 0;
/** Strength of the red tint over the middle of the photo, where the face is. 0 = none, 1 = solid red. */
const PHOTO_TINT = 0.48;

/** How far the form panel below should slide up over the bottom of the hero. */
export const AUTH_HERO_OVERLAP = 28;

/** Height of the logo row at the top of the hero, not counting the status bar. */
export const AUTH_HERO_TOP_BAR = space.md + 40 + space.md;

interface AuthHeroProps {
  height: number;
  /** Shows a back button in the top-left corner. */
  onBack?: () => void;
}

/** Full-width photo header for the sign-in and sign-up screens. Used through AuthScaffold. */
export function AuthHero({ height, onBack }: AuthHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.hero, { height }]}>
      <StatusBar style="light" />
      <Image
        source={photo}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={PHOTO_BLUR}
        transition={200}
        accessible={false}
        importantForAccessibility="no"
      />
      {/* Brand tint over the whole photo: darkest at the top (status bar, logo), red at the bottom. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(60,6,4,0.72)', `rgba(184,25,15,${PHOTO_TINT})`, 'rgba(226,35,26,0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topRow, { paddingTop: insets.top + space.md }]}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}>
            <Icon name="back" size={18} color={palette.white} />
          </Pressable>
        )}
        <Image source={hotLogo} style={styles.logo} contentFit="contain" accessibilityLabel="HOT Recharge" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: palette.redDark, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  logo: { width: 150, height: 38 },
});
