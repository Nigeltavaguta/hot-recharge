import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { palette, radius, space } from '@/theme/colors';
import { useLoginViewModel } from '@/viewmodels/useLoginViewModel';

export default function LoginScreen() {
  const vm = useLoginViewModel();
  const insets = useSafeAreaInsets();

  return (
    <Screen>
      <View style={[styles.hero, { marginTop: insets.top }]}>
        <View style={styles.logo}>
          <Icon name="zesa" size={26} color={palette.white} />
        </View>
        <AppText variant="title" tone="onPrimary">
          HOT Recharge
        </AppText>
        <AppText style={styles.heroText}>Sign in to buy airtime, bundles and ZESA tokens.</AppText>
      </View>

      {vm.errors.form && <Notice tone="danger" text={vm.errors.form} />}

      <TextField
        label="Mobile number"
        icon="airtime"
        placeholder="0772345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        returnKeyType="next"
        value={vm.mobile}
        onChangeText={vm.setMobile}
        error={vm.errors.mobile}
      />
      <TextField
        label="Password"
        icon="lock"
        placeholder="Your password"
        password
        autoCapitalize="none"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={vm.submit}
        value={vm.password}
        onChangeText={vm.setPassword}
        error={vm.errors.password}
      />

      <Button label="Sign in" loading={vm.loading} onPress={vm.submit} />

      <View style={styles.registerRow}>
        <AppText tone="muted">New to HOT Recharge?</AppText>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.push('/register')}>
          <AppText variant="heading" tone="link">
            Create an account
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.red,
    borderRadius: radius.xl,
    padding: space.xxl,
    gap: space.sm,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: space.sm,
  },
  heroText: { color: '#FFE3E0' },
  registerRow: { alignItems: 'center', gap: space.xs, paddingTop: space.sm },
});
