import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';

type TxStatus = 'Completed' | 'Flagged' | 'Pending';

type Tx = {
  id: string; from: string; to: string; amount: number;
  date: string; type: 'Transfer' | 'Payment' | 'Deposit';
  status: TxStatus;
};

const ALL_TX: Tx[] = [
  { id: 'TXN001', from: 'Alex Johnson', to: 'Sarah Williams', amount: 1500, date: 'Jul 14, 2025', type: 'Transfer', status: 'Completed' },
  { id: 'TXN002', from: 'James Carter', to: 'External Bank', amount: 9800, date: 'Jul 13, 2025', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN003', from: 'Priya Sharma', to: 'Netflix', amount: 15.99, date: 'Jul 13, 2025', type: 'Payment', status: 'Completed' },
  { id: 'TXN004', from: 'System', to: 'Alex Johnson', amount: 4500, date: 'Jul 12, 2025', type: 'Deposit', status: 'Completed' },
  { id: 'TXN005', from: 'Sarah Williams', to: 'Unknown Recipient', amount: 3200, date: 'Jul 11, 2025', type: 'Transfer', status: 'Flagged' },
  { id: 'TXN006', from: 'James Carter', to: 'Amazon', amount: 89.50, date: 'Jul 10, 2025', type: 'Payment', status: 'Completed' },
  { id: 'TXN007', from: 'Priya Sharma', to: 'Tom Bradley', amount: 750, date: 'Jul 9, 2025', type: 'Transfer', status: 'Pending' },
];

const FILTERS: (TxStatus | 'All')[] = ['All', 'Completed', 'Flagged', 'Pending'];

const STATUS_COLORS: Record<TxStatus, { bg: string; text: string }> = {
  Completed: { bg: '#D1FAE5', text: '#059669' },
  Flagged: { bg: '#FEE2E2', text: '#DC2626' },
  Pending: { bg: '#FEF3C7', text: '#D97706' },
};

const TYPE_ICONS: Record<string, string> = {
  Transfer: 'swap-horizontal-outline',
  Payment: 'card-outline',
  Deposit: 'arrow-down-circle-outline',
};

export default function TransactionsTab() {
  const [filter, setFilter] = useState<TxStatus | 'All'>('All');

  const filtered = filter === 'All' ? ALL_TX : ALL_TX.filter(t => t.status === filter);
  const flaggedCount = ALL_TX.filter(t => t.status === 'Flagged').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Transaction Logs</Text>
          <Text style={s.headerSub}>{ALL_TX.length} total · {flaggedCount} flagged</Text>
        </View>
        {flaggedCount > 0 && (
          <View style={s.alertBadge}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={s.alertBadgeText}>{flaggedCount} Alerts</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Summary cards */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Volume', value: '$' + ALL_TX.reduce((a, t) => a + t.amount, 0).toLocaleString(), color: '#4F46E5' },
            { label: 'Flagged', value: String(flaggedCount), color: '#DC2626' },
            { label: 'Pending', value: String(ALL_TX.filter(t => t.status === 'Pending').length), color: '#D97706' },
          ].map(st => (
            <View key={st.label} style={s.statCard}>
              <Text style={[s.statValue, { color: st.color }]}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[s.filterPill, filter === f && s.filterPillActive]} onPress={() => setFilter(f)}>
              {f === 'Flagged' && <Ionicons name="warning-outline" size={12} color={filter === f ? '#fff' : '#DC2626'} />}
              <Text style={[s.filterPillText, filter === f && s.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction list */}
        {filtered.map(tx => (
          <View key={tx.id} style={[s.txCard, tx.status === 'Flagged' && s.txCardFlagged]}>
            <View style={s.txTop}>
              <View style={[s.txIcon, { backgroundColor: tx.status === 'Flagged' ? '#FEE2E2' : '#F5F6FA' }]}>
                <Ionicons name={TYPE_ICONS[tx.type] as any} size={18} color={tx.status === 'Flagged' ? '#DC2626' : '#555'} />
              </View>
              <View style={s.txInfo}>
                <Text style={s.txId}>{tx.id}</Text>
                <Text style={s.txParties}>{tx.from} → {tx.to}</Text>
                <Text style={s.txDate}>{tx.date} · {tx.type}</Text>
              </View>
              <View style={s.txRight}>
                <Text style={s.txAmount}>${tx.amount.toLocaleString()}</Text>
                <View style={[s.txBadge, { backgroundColor: STATUS_COLORS[tx.status].bg }]}>
                  <Text style={[s.txBadgeText, { color: STATUS_COLORS[tx.status].text }]}>{tx.status}</Text>
                </View>
              </View>
            </View>
            {tx.status === 'Flagged' && (
              <View style={s.flagNote}>
                <Ionicons name="warning-outline" size={13} color="#DC2626" />
                <Text style={s.flagNoteText}>Suspicious activity detected — large or unusual transfer</Text>
              </View>
            )}
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="swap-horizontal-outline" size={40} color="#CCC" />
            <Text style={s.emptyText}>No transactions found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEF2FF' },
  headerTitle: { color: '#111', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#888', fontSize: 12, marginTop: 1 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  alertBadgeText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11 },
  filterRow: { marginBottom: 14 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#C7D2FE' },
  filterPillActive: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  filterPillText: { color: '#555', fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#fff' },
  txCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  txCardFlagged: { borderLeftWidth: 3, borderLeftColor: '#DC2626' },
  txTop: { flexDirection: 'row', alignItems: 'center' },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txId: { color: '#888', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  txParties: { color: '#111', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  txDate: { color: '#AAA', fontSize: 11 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { color: '#111', fontSize: 14, fontWeight: '700' },
  txBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  txBadgeText: { fontSize: 10, fontWeight: '700' },
  flagNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#FEE2E2' },
  flagNoteText: { color: '#DC2626', fontSize: 12, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: '#AAA', fontSize: 14 },
});