import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';

const RECIPIENTS = [
  { id: '1', name: 'Sarah Williams', account: '****4521', avatar: 'SW' },
  { id: '2', name: 'James Carter', account: '****8834', avatar: 'JC' },
  { id: '3', name: 'Priya Sharma', account: '****2290', avatar: 'PS' },
  { id: '4', name: 'Tom Bradley', account: '****6617', avatar: 'TB' },
];

export default function TransferScreen() {
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const recipient = RECIPIENTS.find(r => r.id === selectedRecipient);

  const handleSend = () => {
    if (!selectedRecipient) { setError('Please select a recipient.'); return; }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setError('');
    setShowSuccess(true);
  };

  const handleDone = () => {
    setShowSuccess(false);
    setSelectedRecipient(null);
    setAmount('');
    setRemarks('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={styles.pageTitle}>Transfer Money</Text>
        <Text style={styles.pageSubtitle}>Send money to your contacts instantly</Text>

        {/* Recipients */}
        <Text style={styles.label}>Select Recipient</Text>
        <View style={styles.recipientList}>
          {RECIPIENTS.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.recipientCard, selectedRecipient === r.id && styles.recipientCardSelected]}
              onPress={() => { setSelectedRecipient(r.id); setError(''); }}
              testID={`recipient-${r.id}`}
            >
              <View style={[styles.avatar, selectedRecipient === r.id && styles.avatarSelected]}>
                <Text style={[styles.avatarText, selectedRecipient === r.id && styles.avatarTextSelected]}>{r.avatar}</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={[styles.recipientName, selectedRecipient === r.id && styles.recipientNameSelected]}>{r.name}</Text>
                <Text style={styles.recipientAccount}>{r.account}</Text>
              </View>
              {selectedRecipient === r.id && <Ionicons name="checkmark-circle" size={20} color={BSColors.orange} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#CCC"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            testID="amount-input"
          />
        </View>

        {/* Remarks */}
        <Text style={styles.label}>Remarks (optional)</Text>
        <TextInput
          style={styles.remarksInput}
          placeholder="Add a note..."
          placeholderTextColor="#AAA"
          value={remarks}
          onChangeText={setRemarks}
          testID="remarks-input"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} testID="send-btn">
          <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.sendBtnText}>Send Money</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color="#059669" />
            </View>
            <Text style={styles.modalTitle}>Transfer Successful!</Text>
            <Text style={styles.modalSubtitle}>
              ${Number(amount).toFixed(2)} sent to {recipient?.name}
            </Text>
            {remarks ? <Text style={styles.modalRemarks}>"{remarks}"</Text> : null}
            <View style={styles.modalRef}>
              <Text style={styles.modalRefLabel}>Reference ID</Text>
              <Text style={styles.modalRefValue}>TXN{Date.now().toString().slice(-8)}</Text>
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
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  pageTitle: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageSubtitle: { color: '#888', fontSize: 14, marginBottom: 28 },
  label: { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  recipientList: { gap: 10, marginBottom: 24 },
  recipientCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  recipientCardSelected: { borderColor: BSColors.orange, backgroundColor: '#FFF8F3' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarSelected: { backgroundColor: BSColors.orange },
  avatarText: { color: '#666', fontSize: 14, fontWeight: '700' },
  avatarTextSelected: { color: '#fff' },
  recipientInfo: { flex: 1 },
  recipientName: { color: '#111', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recipientNameSelected: { color: BSColors.orangeDark },
  recipientAccount: { color: '#999', fontSize: 12 },
  amountRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0',
    paddingHorizontal: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  currencySymbol: { color: '#333', fontSize: 24, fontWeight: '700', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#111', paddingVertical: 16 },
  remarksInput: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0',
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111', marginBottom: 24,
  },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 14, textAlign: 'center' },
  sendBtn: {
    backgroundColor: BSColors.orange, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: BSColors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' },
  successIcon: { marginBottom: 16 },
  modalTitle: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  modalSubtitle: { color: '#555', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  modalRemarks: { color: '#888', fontSize: 13, fontStyle: 'italic', marginBottom: 16 },
  modalRef: { backgroundColor: '#F5F6FA', borderRadius: 10, padding: 14, width: '100%', alignItems: 'center', marginBottom: 24 },
  modalRefLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  modalRefValue: { color: '#111', fontSize: 15, fontWeight: '700' },
  doneBtn: { backgroundColor: BSColors.orange, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 48 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});