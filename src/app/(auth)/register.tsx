import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { AuthScaffold } from '@/components/auth/AuthScaffold';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { space } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';
import { useRegisterViewModel } from '@/viewmodels/useRegisterViewModel';

export default function RegisterScreen() {
  const vm = useRegisterViewModel();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  if (vm.done) {
    return (
      <View style={[styles.root, styles.doneRoot, { backgroundColor: theme.surface, paddingTop: insets.top }]}>
        <View style={[styles.doneIcon, { backgroundColor: theme.successSoft }]}>
          <Icon name="success" size={48} color={theme.success} />
        </View>
        <AppText variant="title" center>
          Continue on the HOT website
        </AppText>
        <AppText tone="muted" center>
          Complete the official registration in your browser. This app has not created an account yet.
        </AppText>
        <Button label="Go to sign in" onPress={() => router.back()} style={styles.doneButton} />
      </View>
    );
  }

  return (
    // The photo is shorter than on sign-in, because this form is longer.
    <AuthScaffold heroFraction={0.34} heroMin={240} heroMax={340} onBack={() => router.back()}>
          <View style={styles.headline}>
            <AppText style={styles.title} accessibilityRole="header">
              Create your account
            </AppText>
            <AppText tone="muted">It takes about a minute.</AppText>
          </View>

          {vm.errors.form && <Notice tone="danger" text={vm.errors.form} />}

          <View style={styles.row}>
            <View style={styles.flex}>
              <TextField
                filled
                label="First name"
                autoComplete="given-name"
                value={vm.values.firstName}
                onChangeText={(t) => vm.setField('firstName', t)}
                error={vm.errors.firstName}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                filled
                label="Last name"
                autoComplete="family-name"
                value={vm.values.lastName}
                onChangeText={(t) => vm.setField('lastName', t)}
                error={vm.errors.lastName}
              />
            </View>
          </View>

          <TextField
            filled
            label="Mobile number"
            icon="airtime"
            placeholder="0772 345 678"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={vm.values.mobile}
            onChangeText={(t) => vm.setField('mobile', t)}
            error={vm.errors.mobile}
          />
          <TextField
            filled
            label="Email address"
            icon="mail"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={vm.values.email}
            onChangeText={(t) => vm.setField('email', t)}
            error={vm.errors.email}
          />
          <TextField
            filled
            label="Password"
            icon="lock"
            password
            autoCapitalize="none"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={vm.values.password}
            onChangeText={(t) => vm.setField('password', t)}
            error={vm.errors.password}
          />
          <TextField
            filled
            label="Confirm password"
            icon="lock"
            password
            autoCapitalize="none"
            autoComplete="new-password"
            value={vm.values.confirmPassword}
            onChangeText={(t) => vm.setField('confirmPassword', t)}
            error={vm.errors.confirmPassword}
          />

          <Button label="Create account" loading={vm.loading} onPress={vm.submit} style={styles.submit} />

          <View style={styles.linkRow}>
            <AppText tone="muted">Already have an account?</AppText>
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
              <AppText variant="heading" tone="link">
                Sign in
              </AppText>
            </Pressable>
          </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  headline: { gap: space.xs },
  title: { fontSize: 30, lineHeight: 36, fontFamily: fonts.extrabold },
  row: { flexDirection: 'row', gap: space.md },
  submit: { marginTop: space.xs },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },

  doneRoot: { alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingHorizontal: space.xxl },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  doneButton: { alignSelf: 'stretch' },
});
