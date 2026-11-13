import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { apiMode } from '@/config/api';
import { useStore } from '@/state/createStore';
import { sessionStore } from '@/state/sessionStore';
import { space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useLoginViewModel } from '@/viewmodels/useLoginViewModel';

export default function LoginScreen() {
  const vm = useLoginViewModel();
  const restoreError = useStore(sessionStore, (s) => s.restoreError);

  return (
    <AuthScaffold heroFraction={0.46} heroMin={300} heroMax={440}>
          <View style={styles.headline}>
            <AppText style={styles.title} accessibilityRole="header">
              Welcome back
            </AppText>
            <AppText tone="muted">Sign in to buy airtime, bundles and ZESA tokens.</AppText>
          </View>

          {vm.errors.form && <Notice tone="danger" text={vm.errors.form} />}
          {restoreError && <Notice tone="warning" text={restoreError} />}

          <TextField
            filled
            label="Mobile number"
            icon="airtime"
            placeholder="0772 345 678"
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            value={vm.mobile}
            onChangeText={vm.setMobile}
            error={vm.errors.mobile}
          />
          <TextField
            filled
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

          <Button label="Sign in" loading={vm.loading} onPress={vm.submit} style={styles.submit} />

          <View style={styles.linkRow}>
            <AppText tone="muted">New to HOT Recharge?</AppText>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.push('/register')}>
              <AppText variant="heading" tone="link">
                Create an account
              </AppText>
            </Pressable>
          </View>

          {apiMode === 'mock' && (
            <AppText variant="caption" tone="faint" center style={styles.footnote}>
              Demo mode · no real balances or purchases
            </AppText>
          )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  headline: { gap: space.xs },
  title: { fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold },
  submit: { marginTop: space.xs },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  footnote: { marginTop: 'auto', paddingTop: space.lg },
});
