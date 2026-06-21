import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { BSColors } from '@/constants/theme';

// Location-based content for 7 regions
type RegionContent = {
  region: string; flag: string; currency: string; currencySymbol: string;
  greeting: string; promoTitle: string; promoDesc: string;
  balance: string; savings: string; checking: string;
  transactions: { merchant: string; category: string; date: string; amount: number; icon: string }[];
  offers: { title: string; desc: string; icon: string; color: string }[];
};

const REGION_CONTENT: Record<string, RegionContent> = {
  US: {
    region: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$',
    greeting: 'Good morning', promoTitle: 'Earn 3% Cashback', promoDesc: 'On all dining & entertainment purchases this month',
    balance: '$24,850.00', savings: '$18,200.00', checking: '$6,650.00',
    transactions: [
      { merchant: 'Whole Foods', category: 'Groceries', date: 'Jul 14', amount: -67.40, icon: 'cart-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 5200.00, icon: 'briefcase-outline' },
      { merchant: 'Netflix', category: 'Entertainment', date: 'Jul 12', amount: -15.99, icon: 'tv-outline' },
      { merchant: 'Uber', category: 'Transport', date: 'Jul 11', amount: -24.50, icon: 'car-outline' },
    ],
    offers: [
      { title: 'Zero-Fee Transfers', desc: 'Send money across the US for free', icon: 'swap-horizontal-outline', color: '#4F46E5' },
      { title: 'High-Yield Savings', desc: '4.5% APY on savings accounts', icon: 'trending-up-outline', color: '#059669' },
    ],
  },
  IN: {
    region: 'India', flag: '🇮🇳', currency: 'INR', currencySymbol: '₹',
    greeting: 'Namaste', promoTitle: 'UPI Cashback Offer', promoDesc: 'Get ₹50 cashback on every 5 UPI transactions',
    balance: '₹20,45,000', savings: '₹15,00,000', checking: '₹5,45,000',
    transactions: [
      { merchant: 'BigBasket', category: 'Groceries', date: 'Jul 14', amount: -1840, icon: 'cart-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 85000, icon: 'briefcase-outline' },
      { merchant: 'Swiggy', category: 'Food', date: 'Jul 12', amount: -320, icon: 'restaurant-outline' },
      { merchant: 'Ola', category: 'Transport', date: 'Jul 11', amount: -180, icon: 'car-outline' },
    ],
    offers: [
      { title: 'Instant UPI Transfer', desc: 'Send money instantly via UPI', icon: 'flash-outline', color: '#DC2626' },
      { title: 'FD at 7.5% p.a.', desc: 'Book a Fixed Deposit today', icon: 'lock-closed-outline', color: '#059669' },
    ],
  },
  JP: {
    region: 'Japan', flag: '🇯🇵', currency: 'JPY', currencySymbol: '¥',
    greeting: 'こんにちは', promoTitle: 'ポイント還元キャンペーン', promoDesc: 'コンビニ決済で2%ポイント還元',
    balance: '¥3,240,000', savings: '¥2,400,000', checking: '¥840,000',
    transactions: [
      { merchant: '7-Eleven', category: 'Convenience', date: 'Jul 14', amount: -850, icon: 'storefront-outline' },
      { merchant: '給与振込', category: 'Income', date: 'Jul 13', amount: 380000, icon: 'briefcase-outline' },
      { merchant: 'Suica', category: 'Transport', date: 'Jul 12', amount: -1240, icon: 'train-outline' },
      { merchant: 'Amazon JP', category: 'Shopping', date: 'Jul 11', amount: -4500, icon: 'bag-outline' },
    ],
    offers: [
      { title: 'QRコード決済', desc: 'PayPayとの連携で5%還元', icon: 'qr-code-outline', color: '#DC2626' },
      { title: '定期預金 0.2%', desc: '1年定期預金キャンペーン', icon: 'lock-closed-outline', color: '#4F46E5' },
    ],
  },
  AU: {
    region: 'Australia', flag: '🇦🇺', currency: 'AUD', currencySymbol: 'A$',
    greeting: "G'day", promoTitle: 'BPAY Bonus Offer', promoDesc: 'Pay 3 bills via BPAY and earn 500 reward points',
    balance: 'A$38,500.00', savings: 'A$28,000.00', checking: 'A$10,500.00',
    transactions: [
      { merchant: 'Woolworths', category: 'Groceries', date: 'Jul 14', amount: -94.20, icon: 'cart-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 7800.00, icon: 'briefcase-outline' },
      { merchant: 'Spotify', category: 'Entertainment', date: 'Jul 12', amount: -11.99, icon: 'musical-notes-outline' },
      { merchant: 'Uber Eats', category: 'Food', date: 'Jul 11', amount: -38.50, icon: 'restaurant-outline' },
    ],
    offers: [
      { title: 'Offset Home Loan', desc: 'Link your savings to reduce interest', icon: 'home-outline', color: '#059669' },
      { title: 'Travel Insurance', desc: 'Free travel cover on Platinum card', icon: 'airplane-outline', color: '#D97706' },
    ],
  },
  GB: {
    region: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£',
    greeting: 'Good day', promoTitle: 'Open Banking Offer', promoDesc: 'Connect your accounts and earn £10 bonus',
    balance: '£19,200.00', savings: '£14,000.00', checking: '£5,200.00',
    transactions: [
      { merchant: 'Tesco', category: 'Groceries', date: 'Jul 14', amount: -52.80, icon: 'cart-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 4200.00, icon: 'briefcase-outline' },
      { merchant: 'TfL', category: 'Transport', date: 'Jul 12', amount: -8.40, icon: 'train-outline' },
      { merchant: 'Amazon UK', category: 'Shopping', date: 'Jul 11', amount: -34.99, icon: 'bag-outline' },
    ],
    offers: [
      { title: 'ISA Savings', desc: 'Tax-free savings up to £20,000/year', icon: 'shield-checkmark-outline', color: '#4F46E5' },
      { title: 'Contactless Limit', desc: 'Increased to £100 per transaction', icon: 'card-outline', color: '#059669' },
    ],
  },
  SG: {
    region: 'Singapore', flag: '🇸🇬', currency: 'SGD', currencySymbol: 'S$',
    greeting: 'Hello', promoTitle: 'PayNow Cashback', promoDesc: 'S$5 cashback on first 3 PayNow transfers',
    balance: 'S$32,400.00', savings: 'S$24,000.00', checking: 'S$8,400.00',
    transactions: [
      { merchant: 'FairPrice', category: 'Groceries', date: 'Jul 14', amount: -78.60, icon: 'cart-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 6500.00, icon: 'briefcase-outline' },
      { merchant: 'Grab', category: 'Transport', date: 'Jul 12', amount: -14.20, icon: 'car-outline' },
      { merchant: 'Lazada', category: 'Shopping', date: 'Jul 11', amount: -45.00, icon: 'bag-outline' },
    ],
    offers: [
      { title: 'CPF Top-Up Bonus', desc: 'Earn 1% extra on CPF top-ups', icon: 'trending-up-outline', color: '#DC2626' },
      { title: 'Multi-Currency', desc: 'Hold 12 currencies, zero fees', icon: 'globe-outline', color: '#0891B2' },
    ],
  },
  DEFAULT: {
    region: 'Global', flag: '🌍', currency: 'USD', currencySymbol: '$',
    greeting: 'Welcome', promoTitle: 'Global Banking Offer', promoDesc: 'Zero fees on international transfers this week',
    balance: '$24,850.00', savings: '$18,200.00', checking: '$6,650.00',
    transactions: [
      { merchant: 'Netflix', category: 'Entertainment', date: 'Jul 14', amount: -15.99, icon: 'tv-outline' },
      { merchant: 'Salary Credit', category: 'Income', date: 'Jul 13', amount: 4500.00, icon: 'briefcase-outline' },
      { merchant: 'Amazon', category: 'Shopping', date: 'Jul 12', amount: -89.50, icon: 'bag-outline' },
      { merchant: 'Starbucks', category: 'Food & Drink', date: 'Jul 11', amount: -6.75, icon: 'cafe-outline' },
    ],
    offers: [
      { title: 'Zero-Fee Transfers', desc: 'Send money globally for free', icon: 'swap-horizontal-outline', color: '#4F46E5' },
      { title: 'Rewards Program', desc: 'Earn points on every purchase', icon: 'star-outline', color: '#D97706' },
    ],
  },
};

function getRegionFromCoords(lat: number, lon: number): string {
  if (lat >= 24 && lat <= 37 && lon >= 68 && lon <= 97) return 'IN';
  if (lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146) return 'JP';
  if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154) return 'AU';
  if (lat >= 49 && lat <= 61 && lon >= -8 && lon <= 2) return 'GB';
  if (lat >= 1 && lat <= 2 && lon >= 103 && lon <= 104) return 'SG';
  if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) return 'US';
  return 'DEFAULT';
}

export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [regionKey, setRegionKey] = useState('DEFAULT');
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const key = getRegionFromCoords(loc.coords.latitude, loc.coords.longitude);
          setRegionKey(key);
        }
      } catch { /* use default */ }
      setLocationLoading(false);
    })();
  }, []);

  const content = REGION_CONTENT[regionKey];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{content.greeting},</Text>
            <Text style={styles.userName}>Alex Johnson</Text>
          </View>
          <View style={styles.headerRight}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={BSColors.orange} />
            ) : (
              <View style={styles.regionBadge}>
                <Text style={styles.regionFlag}>{content.flag}</Text>
                <Text style={styles.regionText}>{content.region}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardTop}>
            <Text style={styles.balanceLabel}>Total Balance ({content.currency})</Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={styles.eyeBtn}>
              <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{balanceVisible ? content.balance : '••••••••'}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-down-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.balanceItemLabel}>Savings</Text>
              <Text style={styles.balanceItemValue}>{balanceVisible ? content.savings : '••••'}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Ionicons name="arrow-up-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.balanceItemLabel}>Checking</Text>
              <Text style={styles.balanceItemValue}>{balanceVisible ? content.checking : '••••'}</Text>
            </View>
          </View>
        </View>

        {/* Regional Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoTitle}>{content.promoTitle}</Text>
            <Text style={styles.promoDesc}>{content.promoDesc}</Text>
          </View>
          <Ionicons name="gift-outline" size={28} color={BSColors.orange} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Transfer', icon: 'swap-horizontal' as const, color: '#4F46E5' },
            { label: 'Pay Bills', icon: 'receipt-outline' as const, color: '#059669' },
            { label: 'Scan QR', icon: 'qr-code-outline' as const, color: '#DC2626' },
          ].map(action => (
            <TouchableOpacity key={action.label} style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Regional Offers */}
        <Text style={styles.sectionTitle}>Offers for You</Text>
        {content.offers.map((offer, i) => (
          <TouchableOpacity key={i} style={styles.offerCard}>
            <View style={[styles.offerIcon, { backgroundColor: offer.color + '15' }]}>
              <Ionicons name={offer.icon as any} size={22} color={offer.color} />
            </View>
            <View style={styles.offerInfo}>
              <Text style={styles.offerTitle}>{offer.title}</Text>
              <Text style={styles.offerDesc}>{offer.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
        ))}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>
        <View style={styles.transactionCard}>
          {content.transactions.map((tx, i) => (
            <View key={i} style={[styles.txRow, i < content.transactions.length - 1 && styles.txBorder]}>
              <View style={styles.txIconWrap}>
                <Ionicons name={tx.icon as any} size={20} color={tx.amount > 0 ? '#059669' : '#666'} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txMerchant}>{tx.merchant}</Text>
                <Text style={styles.txCategory}>{tx.category} · {tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, tx.amount > 0 ? styles.txCredit : styles.txDebit]}>
                {tx.amount > 0 ? '+' : ''}{content.currencySymbol}{Math.abs(tx.amount).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { color: '#888', fontSize: 13 },
  userName: { color: '#111', fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  regionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  regionFlag: { fontSize: 14 },
  regionText: { color: '#555', fontSize: 11, fontWeight: '600' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: BSColors.orange, borderWidth: 1.5, borderColor: '#fff' },
  balanceCard: { backgroundColor: BSColors.orange, borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: BSColors.orange, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  balanceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center', gap: 4 },
  balanceDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  balanceItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balanceItemValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  promoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F3', borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: BSColors.orange + '30' },
  promoLeft: { flex: 1, marginRight: 12 },
  promoTitle: { color: '#111', fontSize: 14, fontWeight: '700', marginBottom: 3 },
  promoDesc: { color: '#666', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#111', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  seeAll: { color: BSColors.orange, fontSize: 13, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: '#444', fontSize: 12, fontWeight: '600' },
  offerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  offerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  offerInfo: { flex: 1 },
  offerTitle: { color: '#111', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  offerDesc: { color: '#888', fontSize: 12 },
  transactionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txMerchant: { color: '#111', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txCategory: { color: '#999', fontSize: 12 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txCredit: { color: '#059669' },
  txDebit: { color: '#DC2626' },
});