import { BSColors } from '@/constants/theme';
import { BankStore, Transaction } from '@/store/banking';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/store/api';
import { TransactionShimmer } from '@/components/shimmer';

const FILTERS = ['All', 'Credit', 'Debit', 'Transfer', 'Payment'];

const CATEGORY_ICONS: Record<string, string> = {
  Income: 'briefcase-outline',
  Groceries: 'cart-outline',
  Entertainment: 'tv-outline',
  Transport: 'car-outline',
  Shopping: 'bag-outline',
  'Food & Drink': 'cafe-outline',
  Transfer: 'swap-horizontal-outline',
  Payment: 'card-outline',
};

export default function TransactionsScreen() {
  const { primaryColor, primaryBg, primaryBorder, greenMode } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>(BankStore.getTransactions());
  const [activeFilter, setActiveFilter] = useState('All');
  const [balance, setBalance] = useState(BankStore.getBalance());
  const [txLoading, setTxLoading] = useState(BankStore.isLoading());

  useEffect(() => {
    // Sync real data from API
    BankStore.sync().then(() => setTxLoading(false)).catch(() => setTxLoading(false));
    const unsub = BankStore.subscribe(() => {
      setTransactions(BankStore.getTransactions());
      setBalance(BankStore.getBalance());
    });
    return unsub;
  }, []);

  const filtered = transactions.filter(tx => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Credit') return tx.type === 'credit';
    if (activeFilter === 'Debit') return tx.type === 'debit';
    return tx.category === activeFilter;
  });

  const totalCredit = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Transactions</Text>

        {/* Summary Cards */}
        <View style={[styles.summaryRow, greenMode && { flexDirection: "column" }]}>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="arrow-down-circle-outline" size={20} color="#059669" />
            <Text style={styles.summaryLabel}>Total In</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>+${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="arrow-up-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.summaryLabel}>Total Out</Text>
            <Text style={[styles.summaryValue, { color: '#DC2626' }]}>-${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: primaryBg }]}>
            <Ionicons name="wallet-outline" size={20} color={primaryColor} />
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryValue, { color: primaryColor }]}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={primaryBorder} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {filtered.map((tx, i) => (
              <View key={tx.id} style={[styles.txRow, i < filtered.length - 1 && styles.txBorder]}>
                <View style={[styles.txIconWrap, { backgroundColor: tx.type === 'credit' ? '#F0FDF4' : '#F8FAFF' }]}>
                  <Ionicons
                    name={(CATEGORY_ICONS[tx.category] || tx.icon) as any}
                    size={20}
                    color={tx.type === 'credit' ? '#059669' : '#64748B'}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txMerchant}>{tx.merchant}</Text>
                  <Text style={styles.txMeta}>{tx.category} · {tx.date}</Text>
                  {tx.note ? <Text style={styles.txNote}>"{tx.note}"</Text> : null}
                  <Text style={styles.txRef}>{tx.referenceId}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, tx.amount > 0 ? styles.txCredit : styles.txDebit]}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={[styles.txTypeBadge, { backgroundColor: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2' }]}>
                    <Text style={[styles.txTypeBadgeText, { color: tx.type === 'credit' ? '#059669' : '#DC2626' }]}>
                      {tx.type === 'credit' ? 'Credit' : 'Debit'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  pageTitle: { color: '#0F172A', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  summaryLabel: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  summaryValue: { fontSize: 12, fontWeight: '800' },
  filterScroll: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  filterChipText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  txList: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  txIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  txInfo: { flex: 1 },
  txMerchant: { color: '#0F172A', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txMeta: { color: '#94A3B8', fontSize: 12, marginBottom: 2 },
  txNote: { color: '#64748B', fontSize: 11, fontStyle: 'italic', marginBottom: 2 },
  txRef: { color: '#C7D2FE', fontSize: 10 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txCredit: { color: '#059669' },
  txDebit: { color: '#DC2626' },
  txTypeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  txTypeBadgeText: { fontSize: 10, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
});