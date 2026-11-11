import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { useRegisterViewModel } from '@/viewmodels/useRegisterViewModel';

export default function RegisterScreen() {
  const vm = useRegisterViewModel();
  const theme = useTheme();

  if (vm.done) {
    return (
      <Screen padTop>
        <View style={styles.done}>
          <Icon name="success" size={64} color={theme.success} />
          <AppText variant="title" center>
            Continue on the HOT website
          </AppText>
          <AppText tone="muted" center>
            Complete the official registration process in your browser. This app has not created an account.
          </AppText>
        </View>
        <Button label="Go to sign in" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen padTop>
      <View style={styles.intro}>
        <AppText variant="title">Create your account</AppText>
        <AppText tone="muted">It takes about a minute.</AppText>
      </View>

      {vm.errors.form && <Notice tone="danger" text={vm.errors.form} />}

      <TextField
        label="First name"
        icon="profile"
        autoComplete="given-name"
        value={vm.values.firstName}
        onChangeText={(t) => vm.setField('firstName', t)}
        error={vm.errors.firstName}
      />
      <TextField
        label="Last name"
        icon="profile"
        autoComplete="family-name"
        value={vm.values.lastName}
        onChangeText={(t) => vm.setField('lastName', t)}
        error={vm.errors.lastName}
      />
      <TextField
        label="Mobile number"
        icon="airtime"
        placeholder="0772345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        value={vm.values.mobile}
        onChangeText={(t) => vm.setField('mobile', t)}
        error={vm.errors.mobile}
      />
      <TextField
        label="Email"
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
        label="Confirm password"
        icon="lock"
        password
        autoCapitalize="none"
        autoComplete="new-password"
        value={vm.values.confirmPassword}
        onChangeText={(t) => vm.setField('confirmPassword', t)}
        error={vm.errors.confirmPassword}
      />

      <Button label="Create account" loading={vm.loading} onPress={vm.submit} />
      <Button label="I already have an account" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: space.xs },
  done: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl * 2 },
});
