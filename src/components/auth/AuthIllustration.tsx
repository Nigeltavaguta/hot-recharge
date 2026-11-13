/**
 * AuthIllustration — a fully animated SVG-style illustration built from
 * React Native primitives + react-native-reanimated.
 *
 * Shows a person holding a phone with floating UI bubbles.
 * No external image assets required.
 */
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { palette } from '@/theme/colors';

const RED = palette.red;

const SKIN = '#FDDBB4';
const SKIN_SHADOW = '#F5C28A';
const HAIR = '#2D1B0E';
const SHIRT = RED;
const PHONE_BG = '#1A1A2E';
const PHONE_SCREEN = '#16213E';

export function AuthIllustration({ size = 280 }: { size?: number }) {
  const scale = size / 280;

  // Floating animation for the whole person
  const floatY = useSharedValue(0);
  // Card bubbles
  const bubble1Y = useSharedValue(0);
  const bubble2Y = useSharedValue(0);
  const bubble3Y = useSharedValue(0);
  // Phone screen glow pulse
  const glowOpacity = useSharedValue(0.6);
  // Success checkmark scale
  const checkScale = useSharedValue(0);

  // Shared values from reanimated are stable refs — intentionally run once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Person floating up/down
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // Bubble 1 — slightly offset phase
    bubble1Y.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    // Bubble 2
    bubble2Y.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // Bubble 3
    bubble3Y.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    // Phone screen glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 }),
      ),
      -1,
      false,
    );

    // Checkmark pops in after a short delay
    checkScale.value = withDelay(
      600,
      withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1.0, { duration: 150 }),
      ),
    );
  }, []);

  const personStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const bubble1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble1Y.value }],
  }));
  const bubble2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble2Y.value }],
  }));
  const bubble3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: bubble3Y.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const s = scale;

  return (
    <View style={[styles.container, { width: size, height: size * 0.9 }]}>
      {/* Shadow on floor */}
      <View
        style={[
          styles.shadow,
          { width: 110 * s, height: 18 * s, borderRadius: 60 * s, bottom: 0, alignSelf: 'center' },
        ]}
      />

      {/* ── Person ── */}
      <Animated.View style={[styles.person, personStyle, { bottom: 10 * s, alignSelf: 'center' }]}>
        {/* Legs */}
        <View style={{ position: 'absolute', bottom: 0, left: 36 * s, width: 18 * s, height: 50 * s, backgroundColor: '#374151', borderRadius: 8 * s }} />
        <View style={{ position: 'absolute', bottom: 0, left: 60 * s, width: 18 * s, height: 50 * s, backgroundColor: '#374151', borderRadius: 8 * s }} />
        {/* Shoes */}
        <View style={{ position: 'absolute', bottom: 0, left: 30 * s, width: 26 * s, height: 12 * s, backgroundColor: '#1F2937', borderRadius: 6 * s }} />
        <View style={{ position: 'absolute', bottom: 0, left: 56 * s, width: 26 * s, height: 12 * s, backgroundColor: '#1F2937', borderRadius: 6 * s }} />

        {/* Body / Shirt */}
        <View
          style={{
            position: 'absolute',
            bottom: 44 * s,
            left: 26 * s,
            width: 62 * s,
            height: 72 * s,
            backgroundColor: SHIRT,
            borderRadius: 12 * s,
          }}
        />

        {/* Left arm (holds phone) */}
        <View style={{ position: 'absolute', bottom: 68 * s, left: 4 * s, width: 26 * s, height: 44 * s, backgroundColor: SHIRT, borderRadius: 10 * s, transform: [{ rotate: '-20deg' }] }} />
        {/* Left hand */}
        <View style={{ position: 'absolute', bottom: 62 * s, left: 0, width: 24 * s, height: 22 * s, backgroundColor: SKIN, borderRadius: 11 * s }} />

        {/* Right arm */}
        <View style={{ position: 'absolute', bottom: 68 * s, right: 4 * s, width: 26 * s, height: 44 * s, backgroundColor: SHIRT, borderRadius: 10 * s, transform: [{ rotate: '10deg' }] }} />

        {/* Neck */}
        <View style={{ position: 'absolute', bottom: 112 * s, left: 48 * s, width: 18 * s, height: 18 * s, backgroundColor: SKIN, borderRadius: 9 * s }} />

        {/* Head */}
        <View
          style={{
            position: 'absolute',
            bottom: 118 * s,
            left: 32 * s,
            width: 50 * s,
            height: 54 * s,
            backgroundColor: SKIN,
            borderRadius: 25 * s,
          }}
        >
          {/* Hair */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22 * s, backgroundColor: HAIR, borderTopLeftRadius: 25 * s, borderTopRightRadius: 25 * s, borderBottomLeftRadius: 8 * s, borderBottomRightRadius: 8 * s }} />
          {/* Hair side */}
          <View style={{ position: 'absolute', top: 10 * s, left: -4 * s, width: 10 * s, height: 20 * s, backgroundColor: HAIR, borderRadius: 5 * s }} />

          {/* Eyes */}
          <View style={{ position: 'absolute', top: 22 * s, left: 10 * s, width: 8 * s, height: 8 * s, backgroundColor: '#1F2937', borderRadius: 4 * s }} />
          <View style={{ position: 'absolute', top: 22 * s, right: 10 * s, width: 8 * s, height: 8 * s, backgroundColor: '#1F2937', borderRadius: 4 * s }} />
          {/* Eye shine */}
          <View style={{ position: 'absolute', top: 22 * s, left: 14 * s, width: 3 * s, height: 3 * s, backgroundColor: '#FFF', borderRadius: 2 * s }} />
          <View style={{ position: 'absolute', top: 22 * s, right: 14 * s, width: 3 * s, height: 3 * s, backgroundColor: '#FFF', borderRadius: 2 * s }} />

          {/* Smile */}
          <View style={{ position: 'absolute', bottom: 12 * s, left: 12 * s, width: 26 * s, height: 10 * s, borderBottomWidth: 2.5 * s, borderLeftWidth: 1.5 * s, borderRightWidth: 1.5 * s, borderColor: SKIN_SHADOW, borderBottomLeftRadius: 12 * s, borderBottomRightRadius: 12 * s }} />
        </View>

        {/* Phone in hand */}
        <View
          style={{
            position: 'absolute',
            bottom: 54 * s,
            left: -18 * s,
            width: 44 * s,
            height: 70 * s,
            backgroundColor: PHONE_BG,
            borderRadius: 10 * s,
            overflow: 'hidden',
            borderWidth: 2 * s,
            borderColor: '#374151',
          }}
        >
          {/* Screen */}
          <View style={{ flex: 1, margin: 3 * s, backgroundColor: PHONE_SCREEN, borderRadius: 7 * s, overflow: 'hidden' }}>
            {/* Glow on screen */}
            <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: RED, borderRadius: 7 * s }, glowStyle]} />
            {/* HOT logo text simulation */}
            <View style={{ position: 'absolute', top: 10 * s, left: 5 * s, right: 5 * s, height: 6 * s, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 3 * s }} />
            <View style={{ position: 'absolute', top: 20 * s, left: 8 * s, right: 8 * s, height: 4 * s, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 * s }} />
            <View style={{ position: 'absolute', top: 28 * s, left: 8 * s, right: 14 * s, height: 4 * s, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 * s }} />
          </View>
          {/* Home indicator */}
          <View style={{ height: 4 * s, width: 18 * s, backgroundColor: '#6B7280', borderRadius: 2 * s, alignSelf: 'center', marginBottom: 3 * s }} />
        </View>
      </Animated.View>

      {/* ── Floating bubble: Balance ── */}
      <Animated.View style={[styles.bubble, bubble1Style, { top: 20 * s, left: 10 * s, backgroundColor: '#fff', width: 100 * s }]}>
        <View style={{ width: 20 * s, height: 20 * s, borderRadius: 10 * s, backgroundColor: '#FEE7E5', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8 * s, height: 8 * s, borderRadius: 4 * s, backgroundColor: RED }} />
        </View>
        <View style={{ flex: 1, gap: 3 * s }}>
          <View style={{ height: 5 * s, width: '60%', backgroundColor: '#E5E7EB', borderRadius: 3 * s }} />
          <View style={{ height: 7 * s, width: '90%', backgroundColor: '#1F2937', borderRadius: 3 * s }} />
        </View>
      </Animated.View>

      {/* ── Floating bubble: Success ── */}
      <Animated.View style={[styles.bubble, bubble2Style, { top: 10 * s, right: 2 * s, backgroundColor: '#fff', width: 90 * s }]}>
        <Animated.View style={[{ width: 22 * s, height: 22 * s, borderRadius: 11 * s, backgroundColor: '#E3F5EC', alignItems: 'center', justifyContent: 'center' }, checkStyle]}>
          <View style={{ width: 10 * s, height: 10 * s, borderRadius: 5 * s, backgroundColor: '#1B9E5B' }} />
        </Animated.View>
        <View style={{ flex: 1, gap: 3 * s }}>
          <View style={{ height: 5 * s, width: '50%', backgroundColor: '#E5E7EB', borderRadius: 3 * s }} />
          <View style={{ height: 5 * s, width: '80%', backgroundColor: '#E5E7EB', borderRadius: 3 * s }} />
        </View>
      </Animated.View>

      {/* ── Floating bubble: Zap/ZESA ── */}
      <Animated.View style={[styles.bubble, bubble3Style, { bottom: 60 * s, right: 4 * s, backgroundColor: '#fff', width: 80 * s }]}>
        <View style={{ width: 20 * s, height: 20 * s, borderRadius: 10 * s, backgroundColor: '#FCF1DB', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8 * s, height: 10 * s, backgroundColor: '#E08A00', borderRadius: 2 * s, transform: [{ skewX: '-5deg' }] }} />
        </View>
        <View style={{ flex: 1, gap: 3 * s }}>
          <View style={{ height: 5 * s, width: '70%', backgroundColor: '#E5E7EB', borderRadius: 3 * s }} />
          <View style={{ height: 5 * s, width: '45%', backgroundColor: '#E5E7EB', borderRadius: 3 * s }} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  person: {
    position: 'absolute',
    width: 115,
    height: 185,
  },
  shadow: {
    position: 'absolute',
    backgroundColor: 'rgba(226, 35, 26, 0.18)',
  },
  bubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
