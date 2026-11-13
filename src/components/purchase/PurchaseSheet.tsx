import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, DetailRow, Notice } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { PurchaseFooter } from '@/components/PurchaseFooter';
import { useStore } from '@/state/createStore';
import { closePurchase, purchaseSheetStore, type PurchaseKind } from '@/state/purchaseSheet';
import { setDraftOrder } from '@/state/walletStore';
import { radius, space } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';
import { formatMoney } from '@/utils/format';
import { useConfirmViewModel } from '@/viewmodels/useConfirmViewModel';

import { AirtimeForm } from './AirtimeForm';
import { BundleForm } from './BundleForm';
import { SheetBody } from './SheetBody';
import { ZesaForm } from './ZesaForm';
import { PaymentForm } from './PaymentForm';

const TITLES: Record<PurchaseKind, string> = {
  airtime: 'Buy airtime',
  bundle: 'Buy a bundle',
  zesa: 'Buy ZESA token',
  payment: 'Make a payment',
};

/**
 * The buy flow, shown as a sheet that slides up over whatever screen the user is on.
 * Step 1 is the form for the chosen product; step 2 reviews and pays.
 * Mounted once in the signed-in layout and opened with `openPurchase()`.
 */
export function PurchaseSheet() {
  const request = useStore(purchaseSheetStore, (s) => s.request);
  const vm = useConfirmViewModel();
  const theme = useTheme();
  const confirming = vm.summary !== null;

  function goBack() {
    if (vm.processing) return; // Never interrupt a payment that is in flight.
    if (confirming) setDraftOrder(null);
    else closePurchase();
  }

  function close() {
    if (!vm.processing) closePurchase();
  }

  async function pay() {
    const tx = await vm.confirm();
    if (!tx) return;
    closePurchase();
    router.push({ pathname: '/receipt/[id]', params: { id: tx.id, fresh: '1' } });
  }

  return (
    <Modal
      visible={request !== null}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={goBack}>
      {request && (
        <SheetFrame
          title={confirming ? 'Confirm purchase' : TITLES[request.kind]}
          onBack={confirming ? goBack : undefined}
          onClose={close}>
          {/* The form stays mounted (hidden) during review, so going back keeps what was typed. */}
          <View style={confirming ? styles.hidden : styles.step}>
            {request.kind === 'airtime' && <AirtimeForm prefill={request.prefill} />}
            {request.kind === 'bundle' && <BundleForm prefill={request.prefill} />}
            {request.kind === 'zesa' && <ZesaForm prefill={request.prefill} />}
            {request.kind === 'payment' && <PaymentForm />}
          </View>

          {vm.summary && (
            <View style={styles.step}>
              <SheetBody
                footer={
                  <PurchaseFooter
                    totalLabel="You pay"
                    total={vm.summary.total}
                    currency={vm.currency}
                    buttonLabel={vm.quoting ? 'Getting quote…' : `Pay ${formatMoney(vm.summary.total, vm.currency)}`}
                    loading={vm.processing || vm.quoting}
                    disabled={vm.insufficient || !vm.quote}
                    onPress={pay}
                  />
                }>
                <View>
                  <AppText tone="muted">You are buying</AppText>
                  <AppText variant="title">{vm.summary.title}</AppText>
                </View>

                <Card style={styles.card}>
                  {vm.summary.rows.map((row) => (
                    <DetailRow key={row.label} label={row.label} value={row.value} />
                  ))}
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <DetailRow label="Amount" value={formatMoney(vm.summary.amount, vm.currency)} />
                  <DetailRow label="Fee" value={formatMoney(vm.summary.fee, vm.currency)} />
                  <DetailRow label="Total" value={formatMoney(vm.summary.total, vm.currency)} strong />
                </Card>

                {vm.balance && (
                  <View style={[styles.source, { backgroundColor: theme.surface }]}>
                    <Icon name="wallet" size={18} color={theme.textMuted} />
                    <AppText variant="label" tone="muted" style={styles.title}>
                      Paid from {vm.balance.name}
                    </AppText>
                    <AppText variant="label">{formatMoney(vm.balance.balance, vm.balance.currency)}</AppText>
                  </View>
                )}
                {vm.insufficient && (
                  <Notice tone="warning" text="Your balance is too low for this purchase. Top up or lower the amount." />
                )}
                {vm.error && <Notice tone="danger" text={vm.error} />}
                {vm.quote?.demonstration && (
                  <Notice tone="warning" text="DEMONSTRATION purchase. No real HOT transaction will be made." />
                )}
                {!vm.quote && !vm.quoting && (
                  <Button label="Refresh quote" variant="outline" icon="refresh" onPress={vm.requote} />
                )}
              </SheetBody>
            </View>
          )}
        </SheetFrame>
      )}
    </Modal>
  );
}

interface SheetFrameProps {
  title: string;
  onBack?: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** Dimmed backdrop plus the rounded panel that slides up from the bottom. */
function SheetFrame({ title, onBack, onClose, children }: SheetFrameProps) {
  const theme = useTheme();
  const [slide] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  }, [slide]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 480] });

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      />
      <Animated.View
        accessibilityViewIsModal
        style={[styles.sheet, { backgroundColor: theme.bg, transform: [{ translateY }] }]}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />

        <View style={styles.header}>
          {onBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={10}
              onPress={onBack}
              style={[styles.headerButton, { backgroundColor: theme.surfaceAlt }]}>
              <Icon name="back" size={18} color={theme.text} />
            </Pressable>
          )}
          <AppText variant="title" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={10}
            onPress={onClose}
            style={[styles.headerButton, { backgroundColor: theme.surfaceAlt }]}>
            <Icon name="close" size={18} color={theme.text} />
          </Pressable>
        </View>

        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
  },
  title: { flex: 1 },
  headerButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  step: { flexShrink: 1 },
  hidden: { display: 'none' },
  card: { borderRadius: radius.xl },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: space.sm },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
  },
});
