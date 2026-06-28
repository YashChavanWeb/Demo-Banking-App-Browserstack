import { BalanceShimmer, TransactionShimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { BankStore } from '@/store/banking';
import { ThemeStore } from '@/store/theme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [locationName, setLocationName] = useState('Detecting...');
  const [locationLoading, setLocationLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [balance, setBalance] = useState(BankStore.getBalance());
  const [recentTxs, setRecentTxs] = useState(BankStore.getTransactions().slice(0, 4));
  const [greenMode, setGreenMode] = useState(ThemeStore.isGreenMode());
  const [userName, setUserName] = useState(AuthStore.getUser()?.fullName || 'Welcome');
  const [dataLoading, setDataLoading] = useState(BankStore.isLoading());

  const primaryColor = greenMode ? '#059669' : BSColors.primary;

  useEffect(() => {
    // Sync with backend on mount
    BankStore.sync().then(() => setDataLoading(false)).catch(() => setDataLoading(false));
    const unsub = BankStore.subscribe(() => {
      setBalance(BankStore.getBalance());
      setRecentTxs(BankStore.getTransactions().slice(0, 4));
    });
    // Load real profile
    import('@/store/api').then(({ api }) => {
      api.getProfile().then(p => { if (p?.fullName) setUserName(p.fullName); }).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = ThemeStore.subscribe(() => setGreenMode(ThemeStore.isGreenMode()));
    return unsub;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (place) {
            const city = place.city || place.subregion || place.region || '';
            const country = place.country || '';
            setLocationName(city ? `${city}, ${country}` : country || 'Unknown');
          } else {
            setLocationName('Unknown');
          }
        } else {
          setLocationName('Location off');
        }
      } catch { setLocationName('Unknown'); }
      setLocationLoading(false);
    })();
  }, []);

  const detectLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const [place] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        if (place) {
          const city = place.city || place.subregion || place.region || '';
          const country = place.country || '';
          setLocationName(city ? `${city}, ${country}` : country || 'Unknown');
        }
      } else {
        Alert.alert('Permission Denied', 'Location permission is required.');
      }
    } catch { Alert.alert('Error', 'Could not detect location.'); }
    setLocationLoading(false);
  }, []);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const openQRScanner = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera access is needed to scan QR codes.');
        return;
      }
    }
    setScanned(false);
    setShowQRModal(true);
  }, [cameraPermission, requestCameraPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setShowQRModal(false);
    Alert.alert('QR Code Scanned', `Data: ${data}`, [{ text: 'OK' }]);
  };

  const handleThemeToggle = () => {
    ThemeStore.toggle();
    setGreenMode(ThemeStore.isGreenMode());
  };

  const savings = BankStore.getSavings();
  const checking = BankStore.getChecking();

  const QUICK_ACTIONS = [
    { label: 'Transfer', icon: 'swap-horizontal' as const, color: primaryColor, onPress: () => router.push('/(banking)/transfer' as any) },
    { label: 'Pay Bills', icon: 'receipt-outline' as const, color: '#D97706', onPress: () => router.push('/(banking)/transfer' as any) },
    { label: 'Scan QR', icon: 'qr-code-outline' as const, color: '#DC2626', onPress: openQRScanner },
    { label: 'Test Features', icon: 'flask-outline' as const, color: '#7C3AED', onPress: () => router.push('/(banking)/testfeatures' as any) },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.locationBadge} onPress={detectLocation}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={primaryColor} style={{ marginRight: 4 }} />
              ) : (
                <Ionicons name="location-outline" size={12} color={primaryColor} />
              )}
              <Text style={[styles.locationText, { color: primaryColor }]} numberOfLines={1}>{locationName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <View style={[styles.notifDot, { backgroundColor: primaryColor }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.themeToggleRow, { borderColor: primaryColor + '40' }]}>
          <Ionicons name={greenMode ? 'leaf-outline' : 'color-palette-outline'} size={16} color={primaryColor} />
          <Text style={[styles.themeToggleLabel, { color: primaryColor }]}>{greenMode ? 'Green Mode ON' : 'Default Theme'}</Text>
          <Switch
            value={greenMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: '#E2E8F0', true: '#6EE7B7' }}
            thumbColor={greenMode ? '#059669' : '#4F46E5'}
            testID="theme-toggle"
          />
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: primaryColor, shadowColor: primaryColor }]}>
          {dataLoading ? <BalanceShimmer /> : (
            <>
              <View style={styles.balanceCardTop}>
                <Text style={styles.balanceLabel}>Total Balance (USD)</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={styles.eyeBtn}>
                  <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>{balanceVisible ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Ionicons name="arrow-down-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.balanceItemLabel}>Savings</Text>
                  <Text style={styles.balanceItemValue}>{balanceVisible ? `$${savings.toLocaleString()}` : '••••'}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Ionicons name="arrow-up-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.balanceItemLabel}>Checking</Text>
                  <Text style={styles.balanceItemValue}>{balanceVisible ? `$${checking.toLocaleString()}` : '••••'}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity key={action.label} style={styles.quickAction} onPress={action.onPress}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(banking)/transactions' as any)}>
            <Text style={[styles.seeAll, { color: primaryColor }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {dataLoading ? <TransactionShimmer /> : (
          <View style={styles.transactionCard}>
            {recentTxs.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>No transactions yet</Text>
              </View>
            ) : recentTxs.map((tx, i) => (
              <View key={tx.id} style={[styles.txRow, i < recentTxs.length - 1 && styles.txBorder]}>
                <View style={styles.txIconWrap}>
                  <Ionicons name={tx.icon as any} size={20} color={tx.amount > 0 ? '#059669' : '#666'} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txMerchant}>{tx.merchant}</Text>
                  <Text style={styles.txCategory}>{tx.category} · {tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, tx.amount > 0 ? styles.txCredit : styles.txDebit]}>
                  {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal visible={showQRModal} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.qrHeader}>
            <TouchableOpacity onPress={() => setShowQRModal(false)} style={styles.qrClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.qrTitle}>Scan QR Code</Text>
            <View style={{ width: 40 }} />
          </View>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.qrHint}>
            <Text style={styles.qrHintText}>Point camera at a QR code to scan</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greeting: { color: '#64748B', fontSize: 13 },
  userName: { color: '#0F172A', fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1, maxWidth: 140 },
  locationText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#fff' },
  themeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1 },
  themeToggleLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  balanceCard: { borderRadius: 20, padding: 24, marginBottom: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  balanceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500' },
  eyeBtn: { padding: 4 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, alignItems: 'center', gap: 4 },
  balanceDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  balanceItemLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balanceItemValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickAction: { width: '22%', alignItems: 'center', gap: 8 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: '#334155', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  transactionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txMerchant: { color: '#0F172A', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txCategory: { color: '#94A3B8', fontSize: 12 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txCredit: { color: '#059669' },
  txDebit: { color: '#DC2626' },
  qrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#000' },
  qrClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qrTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  qrHint: { backgroundColor: '#000', padding: 20, alignItems: 'center' },
  qrHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});