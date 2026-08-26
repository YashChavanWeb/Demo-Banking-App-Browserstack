import { TransactionAuthModal } from '@/components/TransactionAuthModal';
import { BSColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://bs-banking-app.onrender.com';
const QUICK_AMOUNTS = [5, 10, 25, 50];

export default function PaymentScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [amount, setAmount] = useState('10.99');
  const [description, setDescription] = useState('');
  const [serverError, setServerError] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  const fetchAndInit = async (amountCents: number) => {
    setLoading(true);
    setServerError('');
    setReady(false);
    try {
      const response = await fetch(`${API_URL}/payment-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountCents, currency: 'usd', customerName: 'Alex Johnson' }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const { paymentIntent, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'BrowserStack Bank',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: { name: 'Alex Johnson' },
        returnURL: 'demobankingapp://stripe-redirect',
      });

      if (error) { setServerError(error.message); } else { setReady(true); }
    } catch (err: any) {
      setServerError(err.message || 'Could not connect to payment server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents < 50) { Alert.alert('Invalid Amount', 'Minimum payment is $0.50'); return; }
    await fetchAndInit(cents);
  };

  const handlePresent = () => {
    setShowAuth(true);
  };

  const executePresent = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      if (error.code !== 'Canceled') setServerError('Transaction could not be completed. ' + error.message);
    } else {
      Alert.alert('Payment Successful!', `$${parseFloat(amount).toFixed(2)} processed successfully.`, [
        { text: 'Done', onPress: () => { setReady(false); setAmount('10.99'); router.back(); } },
      ]);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Make a Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={s.stripeBadge}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
          <Text style={s.stripeBadgeText}>Secured by Stripe</Text>
        </View>

        <Text style={s.label}>Payment Amount</Text>
        <View style={s.amountRow}>
          <Text style={s.currencySymbol}>$</Text>
          <TextInput
            style={s.amountInput} value={amount}
            onChangeText={v => { setAmount(v); setReady(false); }}
            keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#CCC"
            testID="amount-input"
          />
        </View>

        <View style={s.quickAmounts}>
          {QUICK_AMOUNTS.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.quickPill, amount === a.toFixed(2) && s.quickPillActive]}
              onPress={() => { setAmount(a.toFixed(2)); setReady(false); }}
            >
              <Text style={[s.quickPillText, amount === a.toFixed(2) && s.quickPillTextActive]}>${a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Description (optional)</Text>
        <TextInput
          style={s.descInput} value={description} onChangeText={setDescription}
          placeholder="What's this payment for?" placeholderTextColor="#AAA" testID="description-input"
        />

        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Amount</Text>
            <Text style={s.summaryValue}>${parseFloat(amount || '0').toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Processing Fee</Text>
            <Text style={s.summaryValue}>$0.00</Text>
          </View>
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={s.summaryTotalLabel}>Total</Text>
            <Text style={s.summaryTotalValue}>${parseFloat(amount || '0').toFixed(2)}</Text>
          </View>
        </View>

        {serverError ? (
          <View style={s.errorCard}>
            <Ionicons name="warning-outline" size={16} color="#DC2626" />
            <Text style={s.errorText}>{serverError}</Text>
          </View>
        ) : null}

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={15} color="#0891B2" />
          <Text style={s.infoText}>
            Start the server first: <Text style={s.infoCode}>cd server && npm install && npm start</Text>
          </Text>
        </View>

        {!ready ? (
          <TouchableOpacity style={[s.payBtn, loading && s.payBtnDisabled]} onPress={handleProceed} disabled={loading} testID="init-pay-btn">
            {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="card-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={s.payBtnText}>{loading ? 'Preparing...' : 'Proceed to Payment'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.payBtnReady} onPress={handlePresent} testID="pay-btn">
            <Ionicons name="lock-closed-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.payBtnText}>Pay ${parseFloat(amount).toFixed(2)} Now</Text>
          </TouchableOpacity>
        )}

        <View style={s.testCards}>
          <Text style={s.testCardsTitle}>Test Card Numbers</Text>
          {[
            { num: '4242 4242 4242 4242', label: 'Success' },
            { num: '4000 0025 0000 3155', label: 'Requires Auth' },
            { num: '4000 0000 0000 9995', label: 'Declined' },
          ].map(c => (
            <View key={c.num} style={s.testCardRow}>
              <Text style={s.testCardNum}>{c.num}</Text>
              <Text style={s.testCardLabel}>{c.label}</Text>
            </View>
          ))}
          <Text style={s.testCardNote}>Any future expiry · Any CVC · Any postal code</Text>
        </View>
      </ScrollView>

      <TransactionAuthModal
        visible={showAuth}
        amount={`$${parseFloat(amount || '0').toFixed(2)}`}
        description={description || 'payment'}
        onSuccess={() => {
          setShowAuth(false);
          // Wait for the modal close animation to finish before presenting Stripe sheet
          InteractionManager.runAfterInteractions(() => { executePresent(); });
        }}
        onCancel={() => { setShowAuth(false); setServerError('Transaction could not be completed.'); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPageLight },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  headerTitle: { color: '#111', fontSize: 17, fontWeight: '700' },
  stripeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BSColors.successBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: BSColors.successBorder },
  stripeBadgeText: { color: BSColors.successDark, fontSize: 12, fontWeight: '600' },
  label: { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.white, borderRadius: 14, borderWidth: 1.5, borderColor: BSColors.indigoBorder, paddingHorizontal: 16, marginBottom: 12 },
  currencySymbol: { color: '#333', fontSize: 26, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 30, fontWeight: '700', color: '#111', paddingVertical: 14 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickPill: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: BSColors.white, alignItems: 'center', borderWidth: 1, borderColor: BSColors.indigoBorder },
  quickPillActive: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  quickPillText: { color: '#555', fontSize: 13, fontWeight: '600' },
  quickPillTextActive: { color: BSColors.white },
  descInput: { backgroundColor: BSColors.white, borderRadius: 12, borderWidth: 1.5, borderColor: BSColors.indigoBorder, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', marginBottom: 20 },
  summaryCard: { backgroundColor: BSColors.white, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#888', fontSize: 14 },
  summaryValue: { color: '#333', fontSize: 14, fontWeight: '500' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: BSColors.borderLight, paddingTop: 10, marginBottom: 0 },
  summaryTotalLabel: { color: '#111', fontSize: 15, fontWeight: '700' },
  summaryTotalValue: { color: BSColors.primary, fontSize: 16, fontWeight: '800' },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BSColors.errorBg, borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: BSColors.errorBorder },
  errorText: { flex: 1, color: BSColors.errorDark, fontSize: 13 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BSColors.infoBg, borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, color: BSColors.infoDeep, fontSize: 12 },
  infoCode: { fontWeight: '700' },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BSColors.primary, borderRadius: 14, paddingVertical: 16, marginBottom: 20, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payBtnReady: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BSColors.successDark, borderRadius: 14, paddingVertical: 16, marginBottom: 20, shadowColor: BSColors.successDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: BSColors.white, fontSize: 16, fontWeight: '700' },
  testCards: { backgroundColor: BSColors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BSColors.indigoBorder },
  testCardsTitle: { color: '#333', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  testCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testCardNum: { color: '#555', fontSize: 12 },
  testCardLabel: { color: '#888', fontSize: 11, fontWeight: '600' },
  testCardNote: { color: '#AAA', fontSize: 11, marginTop: 6 },
});