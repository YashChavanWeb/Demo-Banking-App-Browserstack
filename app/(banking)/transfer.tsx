import { RecipientShimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/store/api';
import { BankStore } from '@/store/banking';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = __DEV__
  ? 'http://192.168.0.109:3000'
  : 'http://192.168.0.109:3000';

const QUICK_AMOUNTS = [50, 100, 250, 500];

type Tab = 'send' | 'pay';

interface Recipient { id: string; name: string; account: string; avatar: string; }

export default function TransferScreen() {
  const { primaryColor, primaryBg, primaryBorder, greenMode } = useTheme();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [tab, setTab] = useState<Tab>('send');

  // Recipients from API
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);

  // Send Money state
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTx, setLastTx] = useState<{ amount: string; name: string; ref: string } | null>(null);
  const [sendError, setSendError] = useState('');

  // Stripe Pay state
  const [payAmount, setPayAmount] = useState('10.99');
  const [payDesc, setPayDesc] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payReady, setPayReady] = useState(false);
  const [payError, setPayError] = useState('');

  const [balance, setBalance] = useState(BankStore.getBalance());

  useEffect(() => {
    api.getUsers().then(res => {
      setRecipients(res.users);
    }).catch(() => {
      // API unavailable — show empty list (no fake users)
      setRecipients([]);
    }).finally(() => setRecipientsLoading(false));
  }, []);

  const recipient = recipients.find(r => r.id === selectedRecipient);

  const handleSend = async () => {
    if (!selectedRecipient) { setSendError('Please select a recipient.'); return; }
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { setSendError('Please enter a valid amount.'); return; }
    if (!BankStore.canAfford(amt)) { setSendError(`Insufficient balance. Available: $${BankStore.getBalance().toLocaleString()}`); return; }
    setSendError('');
    const tx = await BankStore.transfer(recipient!.name, amt, remarks || undefined, recipient!.id);
    setBalance(BankStore.getBalance());
    setLastTx({ amount: amt.toFixed(2), name: recipient!.name, ref: tx.referenceId });
    setShowSuccess(true);
  };

  const handleDone = () => {
    setShowSuccess(false);
    setSelectedRecipient(null);
    setAmount('');
    setRemarks('');
    setLastTx(null);
  };

  const fetchAndInitPay = async () => {
    const cents = Math.round(parseFloat(payAmount) * 100);
    if (isNaN(cents) || cents < 50) { Alert.alert('Invalid Amount', 'Minimum payment is $0.50'); return; }
    if (!BankStore.canAfford(parseFloat(payAmount))) {
      setPayError(`Insufficient balance. Available: $${BankStore.getBalance().toLocaleString()}`);
      return;
    }
    setPayLoading(true);
    setPayError('');
    setPayReady(false);
    try {
      const response = await fetch(`${API_URL}/payment-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cents, currency: 'usd', customerName: 'Alex Johnson' }),
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
      if (error) { setPayError(error.message); } else { setPayReady(true); }
    } catch (err: any) {
      setPayError(err.message || 'Could not connect to payment server.');
    } finally {
      setPayLoading(false);
    }
  };

  const handlePresent = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      if (error.code !== 'Canceled') Alert.alert('Payment Failed', error.message);
    } else {
      const amt = parseFloat(payAmount);
      await BankStore.recordPayment(amt, payDesc || undefined);
      setBalance(BankStore.getBalance());
      Alert.alert('Payment Successful!', `$${amt.toFixed(2)} processed successfully.`, [
        { text: 'Done', onPress: () => { setPayReady(false); setPayAmount('10.99'); setPayDesc(''); } },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Tab Switcher */}
      <View style={[styles.tabRow, greenMode && { flexDirection: "column", gap: 8 }]}>
        <TouchableOpacity style={[styles.tabBtn, tab === 'send' && styles.tabBtnActive]} onPress={() => setTab('send')}>
          <Ionicons name="swap-horizontal" size={16} color={tab === 'send' ? '#fff' : primaryColor} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnText, tab === 'send' && styles.tabBtnTextActive]}>Send Money</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, tab === 'pay' && styles.tabBtnActive]} onPress={() => setTab('pay')}>
          <Ionicons name="card-outline" size={16} color={tab === 'pay' ? '#fff' : primaryColor} style={{ marginRight: 6 }} />
          <Text style={[styles.tabBtnText, tab === 'pay' && styles.tabBtnTextActive]}>Pay via Card</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Banner */}
      <View style={styles.balanceBanner}>
        <Ionicons name="wallet-outline" size={16} color={primaryColor} />
        <Text style={styles.balanceBannerText}>Available Balance: <Text style={styles.balanceBannerAmt}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text></Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {tab === 'send' ? (
          <>
            <Text style={styles.pageTitle}>Send Money</Text>
            <Text style={styles.pageSubtitle}>Transfer funds to your contacts instantly</Text>

            <Text style={styles.label}>Select Recipient</Text>
            {recipientsLoading && <RecipientShimmer />}
            <View style={styles.recipientList}>
              {!recipientsLoading && recipients.length === 0 && (
                <View style={styles.emptyRecipients}>
                  <Ionicons name="people-outline" size={32} color="#C7D2FE" />
                  <Text style={styles.emptyRecipientsText}>No other users found. Invite friends to sign up!</Text>
                </View>
              )}
              {recipients.map((r: Recipient) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.recipientCard, selectedRecipient === r.id && styles.recipientCardSelected]}
                  onPress={() => { setSelectedRecipient(r.id); setSendError(''); }}
                  testID={`recipient-${r.id}`}
                >
                  <View style={[styles.avatar, selectedRecipient === r.id && styles.avatarSelected]}>
                    <Text style={[styles.avatarText, selectedRecipient === r.id && styles.avatarTextSelected]}>{r.avatar}</Text>
                  </View>
                  <View style={styles.recipientInfo}>
                    <Text style={[styles.recipientName, selectedRecipient === r.id && styles.recipientNameSelected]}>{r.name}</Text>
                    <Text style={styles.recipientAccount}>{r.account}</Text>
                  </View>
                  {selectedRecipient === r.id && <Ionicons name="checkmark-circle" size={20} color={primaryColor} />}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#CCC"
                value={amount}
                onChangeText={v => { setAmount(v); setSendError(''); }}
                keyboardType="decimal-pad"
                testID="amount-input"
              />
            </View>
            <View style={[styles.quickAmounts, greenMode && { flexWrap: "wrap" }]}>
              {QUICK_AMOUNTS.map(a => (
                <TouchableOpacity key={a} style={[styles.quickPill, amount === a.toString() && styles.quickPillActive]}
                  onPress={() => setAmount(a.toString())}>
                  <Text style={[styles.quickPillText, amount === a.toString() && styles.quickPillTextActive]}>${a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Remarks (optional)</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Add a note..."
              placeholderTextColor="#94A3B8"
              value={remarks}
              onChangeText={setRemarks}
              testID="remarks-input"
            />

            {sendError ? <Text style={styles.error}>{sendError}</Text> : null}

            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} testID="send-btn">
              <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.sendBtnText}>Send Money</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.pageTitle}>Pay via Card</Text>
            <Text style={styles.pageSubtitle}>Secure payments powered by Stripe</Text>

            <View style={styles.stripeBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
              <Text style={styles.stripeBadgeText}>Secured by Stripe</Text>
            </View>

            <Text style={styles.label}>Payment Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={payAmount}
                onChangeText={v => { setPayAmount(v); setPayReady(false); setPayError(''); }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#CCC"
                testID="pay-amount-input"
              />
            </View>

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.remarksInput}
              value={payDesc}
              onChangeText={setPayDesc}
              placeholder="What's this payment for?"
              placeholderTextColor="#94A3B8"
              testID="pay-desc-input"
            />

            {payError ? (
              <View style={styles.errorCard}>
                <Ionicons name="warning-outline" size={16} color="#DC2626" />
                <Text style={styles.errorCardText}>{payError}</Text>
              </View>
            ) : null}

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={15} color="#0891B2" />
              <Text style={styles.infoText}>Start the server: <Text style={styles.infoCode}>cd server && npm start</Text></Text>
            </View>

            {!payReady ? (
              <TouchableOpacity style={[styles.sendBtn, payLoading && styles.sendBtnDisabled]} onPress={fetchAndInitPay} disabled={payLoading} testID="init-pay-btn">
                {payLoading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="card-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
                <Text style={styles.sendBtnText}>{payLoading ? 'Preparing...' : 'Proceed to Payment'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.payReadyBtn} onPress={handlePresent} testID="pay-btn">
                <Ionicons name="lock-closed-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.sendBtnText}>Pay ${parseFloat(payAmount).toFixed(2)} Now</Text>
              </TouchableOpacity>
            )}

            <View style={styles.testCards}>
              <Text style={styles.testCardsTitle}>Test Card Numbers</Text>
              {[
                { num: '4242 4242 4242 4242', label: 'Success' },
                { num: '4000 0025 0000 3155', label: 'Requires Auth' },
                { num: '4000 0000 0000 9995', label: 'Declined' },
              ].map(c => (
                <View key={c.num} style={styles.testCardRow}>
                  <Text style={styles.testCardNum}>{c.num}</Text>
                  <Text style={styles.testCardLabel}>{c.label}</Text>
                </View>
              ))}
              <Text style={styles.testCardNote}>Any future expiry · Any CVC · Any postal code</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color="#059669" />
            </View>
            <Text style={styles.modalTitle}>Transfer Successful!</Text>
            <Text style={styles.modalSubtitle}>${lastTx?.amount} sent to {lastTx?.name}</Text>
            {remarks ? <Text style={styles.modalRemarks}>"{remarks}"</Text> : null}
            <View style={styles.modalRef}>
              <Text style={styles.modalRefLabel}>Reference ID</Text>
              <Text style={styles.modalRefValue}>{lastTx?.ref}</Text>
            </View>
            <View style={styles.modalBalanceRow}>
              <Text style={styles.modalBalanceLabel}>New Balance</Text>
              <Text style={styles.modalBalanceValue}>${BankStore.getBalance().toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} testID="done-btn">
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  tabRow: { flexDirection: 'row', margin: 16, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  tabBtnActive: { backgroundColor: BSColors.primary },
  tabBtnText: { color: BSColors.primary, fontSize: 13, fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },
  balanceBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2FF', marginHorizontal: 16, marginBottom: 4, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  balanceBannerText: { color: '#475569', fontSize: 13 },
  balanceBannerAmt: { color: BSColors.primary, fontWeight: '700' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  pageTitle: { color: '#0F172A', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageSubtitle: { color: '#64748B', fontSize: 14, marginBottom: 24 },
  label: { color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  recipientList: { gap: 10, marginBottom: 24 },
  recipientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  recipientCardSelected: { borderColor: BSColors.primary, backgroundColor: '#EEF2FF' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarSelected: { backgroundColor: BSColors.primary },
  avatarText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
  avatarTextSelected: { color: '#fff' },
  recipientInfo: { flex: 1 },
  recipientName: { color: '#0F172A', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recipientNameSelected: { color: BSColors.primaryDark },
  recipientAccount: { color: '#94A3B8', fontSize: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#C7D2FE', paddingHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  currencySymbol: { color: '#334155', fontSize: 24, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#0F172A', paddingVertical: 16 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  quickPill: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  quickPillActive: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  quickPillText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  quickPillTextActive: { color: '#fff' },
  remarksInput: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#C7D2FE', paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A', marginBottom: 24 },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 14, textAlign: 'center' },
  sendBtn: { backgroundColor: BSColors.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  payReadyBtn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  stripeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#BBF7D0' },
  stripeBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorCardText: { color: '#DC2626', fontSize: 13, flex: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  infoText: { color: '#0369A1', fontSize: 12, flex: 1 },
  infoCode: { fontWeight: '700' },
  testCards: { marginTop: 24, backgroundColor: '#F8FAFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  testCardsTitle: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 10 },
  testCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  testCardNum: { color: '#475569', fontSize: 12, fontFamily: 'monospace' },
  testCardLabel: { color: '#64748B', fontSize: 12 },
  testCardNote: { color: '#94A3B8', fontSize: 11, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' },
  successIcon: { marginBottom: 16 },
  modalTitle: { color: '#0F172A', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  modalSubtitle: { color: '#475569', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  modalRemarks: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
  modalRef: { backgroundColor: '#F8FAFF', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalRefLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  modalRefValue: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  modalBalanceRow: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 24 },
  modalBalanceLabel: { color: '#64748B', fontSize: 12, marginBottom: 4 },
  modalBalanceValue: { color: BSColors.primary, fontSize: 18, fontWeight: '800' },
  doneBtn: { backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptyRecipients: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  emptyRecipientsText: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
});