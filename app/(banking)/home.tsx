import { BalanceShimmer, TransactionShimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { BankStore } from '@/store/banking';
import { ThemeStore } from '@/store/theme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// IP-based currency lookup — HTTPS endpoint, works from React Native
const IP_GEO_URL = 'https://ipapi.co/json/';

const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', INR: '🇮🇳', AUD: '🇦🇺',
  CAD: '🇨🇦', JPY: '🇯🇵', CNY: '🇨🇳', SGD: '🇸🇬', AED: '🇦🇪',
  BRL: '🇧🇷', MXN: '🇲🇽', ZAR: '🇿🇦', CHF: '🇨🇭', KRW: '🇰🇷',
  SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', NZD: '🇳🇿', HKD: '🇭🇰',
};

export default function HomeScreen() {
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [balance, setBalance] = useState(BankStore.getBalance());
  const [recentTxs, setRecentTxs] = useState(BankStore.getTransactions().slice(0, 4));
  const [greenMode, setGreenMode] = useState(ThemeStore.isGreenMode());
  const [userName, setUserName] = useState(AuthStore.getUser()?.fullName || 'Welcome');
  const [dataLoading, setDataLoading] = useState(BankStore.isLoading());
  const [showNotifs, setShowNotifs] = useState(false);

  // GPS location (header badge)
  const [locationName, setLocationName] = useState('Detecting...');
  const [locationLoading, setLocationLoading] = useState(true);

  // IP geolocation currency
  const [ipCurrency, setIpCurrency] = useState<{ code: string; country: string; city: string } | null>(null);
  const [ipLoading, setIpLoading] = useState(true);

  const primaryColor = greenMode ? '#059669' : BSColors.primary;
  const accentColor = greenMode ? '#10B981' : BSColors.accent;

  useEffect(() => {
    BankStore.sync().then(() => setDataLoading(false)).catch(() => setDataLoading(false));
    const unsub = BankStore.subscribe(() => {
      setBalance(BankStore.getBalance());
      setRecentTxs(BankStore.getTransactions().slice(0, 4));
    });
    import('@/store/api').then(({ api }) => {
      api.getProfile().then(p => { if (p?.fullName) setUserName(p.fullName); }).catch(() => {});
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = ThemeStore.subscribe(() => setGreenMode(ThemeStore.isGreenMode()));
    return unsub;
  }, []);

  // GPS location for header badge — dynamic import avoids top-level Location name clash
  useEffect(() => {
    (async () => {
      try {
        const Loc = await import('expo-location');
        const { status } = await Loc.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.Low });
          const [place] = await Loc.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (place) {
            const city = place.city || place.subregion || place.region || '';
            const country = place.country || '';
            setLocationName(city ? `${city}, ${country}` : country || 'Unknown');
          } else { setLocationName('Unknown'); }
        } else { setLocationName('Location off'); }
      } catch { setLocationName('Unknown'); }
      setLocationLoading(false);
    })();
  }, []);

  // Fetch IP geolocation on mount
  useEffect(() => {
    fetchIpCurrency();
  }, []);

  const fetchIpCurrency = useCallback(async () => {
    setIpLoading(true);
    try {
      const res = await fetch(IP_GEO_URL, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      // ipapi.co returns currency, country_name, city fields
      if (!data?.error && data?.currency) {
        setIpCurrency({
          code: data.currency,
          country: data.country_name || '',
          city: data.city || '',
        });
      } else {
        // Fallback: derive from device timezone
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const TZ_CC: Record<string, string> = {
          'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'America/New_York': 'US',
          'America/Los_Angeles': 'US', 'America/Chicago': 'US', 'Europe/London': 'GB',
          'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Asia/Tokyo': 'JP',
          'Asia/Shanghai': 'CN', 'Asia/Singapore': 'SG', 'Asia/Dubai': 'AE',
          'Australia/Sydney': 'AU', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
        };
        const CC_CUR: Record<string, string> = {
          IN: 'INR', US: 'USD', GB: 'GBP', FR: 'EUR', DE: 'EUR',
          JP: 'JPY', CN: 'CNY', SG: 'SGD', AE: 'AED', AU: 'AUD',
          BR: 'BRL', MX: 'MXN',
        };
        const cc = TZ_CC[tz] || 'US';
        setIpCurrency({ code: CC_CUR[cc] || 'USD', country: cc, city: '' });
      }
    } catch {
      // Fallback to device timezone on any error
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const TZ_CC: Record<string, string> = {
        'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'America/New_York': 'US',
        'America/Los_Angeles': 'US', 'Europe/London': 'GB', 'Europe/Paris': 'FR',
        'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Singapore': 'SG',
        'Asia/Dubai': 'AE', 'Australia/Sydney': 'AU',
      };
      const CC_CUR: Record<string, string> = {
        IN: 'INR', US: 'USD', GB: 'GBP', FR: 'EUR', JP: 'JPY',
        CN: 'CNY', SG: 'SGD', AE: 'AED', AU: 'AUD',
      };
      const cc = TZ_CC[tz] || 'US';
      setIpCurrency({ code: CC_CUR[cc] || 'USD', country: cc, city: '' });
    } finally {
      setIpLoading(false);
    }
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

  const currencyFlag = ipCurrency ? (CURRENCY_FLAG[ipCurrency.code] || '💱') : '💱';
  const currencyLabel = ipCurrency
    ? `${currencyFlag} ${ipCurrency.code}`
    : '💱 Currency';

  const QUICK_ACTIONS = [
    { label: 'Transfer', icon: 'swap-horizontal' as const, color: primaryColor, bg: primaryColor + '15', onPress: () => router.push('/(banking)/transfer' as any) },
    { label: 'Chat', icon: 'chatbubbles-outline' as const, color: '#7C3AED', bg: '#7C3AED15', onPress: () => router.push('/(banking)/chat' as any) },
    { label: 'Pay Bills', icon: 'receipt-outline' as const, color: '#D97706', bg: '#D9770615', onPress: () => router.push('/(banking)/transfer' as any) },
    { label: 'Scan QR', icon: 'qr-code-outline' as const, color: '#DC2626', bg: '#DC262615', onPress: openQRScanner },
    { label: 'Shop', icon: 'bag-outline' as const, color: '#059669', bg: '#05966915', onPress: () => router.push('/(banking)/shop' as any) },
    { label: 'Network', icon: 'wifi-outline' as const, color: '#0891B2', bg: '#0891B215', onPress: () => router.push('/(banking)/network' as any) },
    { label: 'Shake', icon: 'phone-portrait-outline' as const, color: '#7C3AED', bg: '#7C3AED15', onPress: () => router.push('/(banking)/testfeatures' as any) },
    {
      label: currencyLabel,
      icon: 'globe-outline' as const,
      color: accentColor,
      bg: accentColor + '15',
      onPress: () => router.push({ pathname: '/(banking)/currency' as any, params: ipCurrency ? { code: ipCurrency.code, country: ipCurrency.country, city: ipCurrency.city } : {} }),
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.locationBadge} onPress={async () => {
              setLocationLoading(true);
              try {
                const Loc = await import('expo-location');
                const { status } = await Loc.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  const loc = await Loc.getCurrentPositionAsync({ accuracy: Loc.Accuracy.Low });
                  const [place] = await Loc.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                  if (place) {
                    const city = place.city || place.subregion || place.region || '';
                    const country = place.country || '';
                    setLocationName(city ? `${city}, ${country}` : country || 'Unknown');
                  }
                }
              } catch { /* ignore */ }
              setLocationLoading(false);
            }}>
              {locationLoading
                ? <ActivityIndicator size="small" color={primaryColor} style={{ marginRight: 4 }} />
                : <Ionicons name="location-outline" size={12} color={primaryColor} />}
              <Text style={[styles.locationText, { color: primaryColor }]} numberOfLines={1}>{locationName}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notifBtn} onPress={() => setShowNotifs(true)} testID="notif-btn">
              <Ionicons name="notifications-outline" size={22} color={BSColors.textPrimary} />
              <View style={[styles.notifDot, { backgroundColor: BSColors.error }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Theme Toggle */}
        <View style={[styles.themeToggleRow, { borderColor: primaryColor + '30', backgroundColor: primaryColor + '08' }]}>
          <Ionicons name={greenMode ? 'leaf-outline' : 'color-palette-outline'} size={16} color={primaryColor} />
          <Text style={[styles.themeToggleLabel, { color: primaryColor }]}>{greenMode ? 'Green Mode ON' : 'Default Theme'}</Text>
          <Switch
            value={greenMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: BSColors.mediumGray, true: '#6EE7B7' }}
            thumbColor={greenMode ? '#059669' : primaryColor}
            testID="theme-toggle"
          />
        </View>

        {/* Balance Card — shifts slightly left+top in green mode (Percy visual diff use-case) */}
        <View style={[styles.balanceCard, { backgroundColor: primaryColor }, greenMode && styles.balanceCardGreen]}>
          {dataLoading ? <BalanceShimmer /> : (
            <>
              <View style={styles.balanceCardTop}>
                <View>
                  <Text style={styles.balanceLabel}>Total Balance</Text>
                  <Text style={styles.balanceCurrency}>USD</Text>
                </View>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={styles.eyeBtn}>
                  <Ionicons name={balanceVisible ? 'eye-outline' : 'eye-off-outline'} size={22} color="rgba(255,255,255,0.85)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••••'}
              </Text>
              <View style={styles.balanceDividerLine} />
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemIcon}>
                    <Ionicons name="trending-up-outline" size={14} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View>
                    <Text style={styles.balanceItemLabel}>Savings</Text>
                    <Text style={styles.balanceItemValue}>{balanceVisible ? `$${savings.toLocaleString()}` : '••••'}</Text>
                  </View>
                </View>
                <View style={styles.balanceVertDivider} />
                <View style={styles.balanceItem}>
                  <View style={styles.balanceItemIcon}>
                    <Ionicons name="wallet-outline" size={14} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View>
                    <Text style={styles.balanceItemLabel}>Checking</Text>
                    <Text style={styles.balanceItemValue}>{balanceVisible ? `$${checking.toLocaleString()}` : '••••'}</Text>
                  </View>
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
              <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                {action.label === currencyLabel && ipLoading
                  ? <ActivityIndicator size="small" color={action.color} />
                  : <Ionicons name={action.icon} size={22} color={action.color} />
                }
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={1}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(banking)/transactions' as any)}>
            <Text style={[styles.seeAll, { color: primaryColor }]}>
              {greenMode ? 'See all' : 'See all →'}
            </Text>
          </TouchableOpacity>
        </View>
        {dataLoading ? <TransactionShimmer /> : (
          <View style={styles.transactionCard}>
            {recentTxs.length === 0 ? (
              <View style={styles.emptyTx}>
                <Ionicons name="receipt-outline" size={32} color={BSColors.mediumGray} />
                <Text style={styles.emptyTxText}>No transactions yet</Text>
              </View>
            ) : recentTxs.map((tx, i) => (
              <View key={tx.id} style={[styles.txRow, i < recentTxs.length - 1 && styles.txBorder]}>
                <View style={[styles.txIconWrap, { backgroundColor: tx.amount > 0 ? BSColors.success + '15' : BSColors.error + '10' }]}>
                  <Ionicons name={tx.icon as any} size={18} color={tx.amount > 0 ? BSColors.success : BSColors.darkGray} />
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

      {/* Notifications Modal */}
      <Modal visible={showNotifs} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: BSColors.bgPage }}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifs(false)} style={styles.notifCloseBtn}>
              <Ionicons name="close" size={22} color={BSColors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {[
              { icon: 'checkmark-circle-outline', color: BSColors.success, title: 'Transfer Successful', body: 'Your transfer of $250.00 was completed.', time: '2 min ago' },
              { icon: 'card-outline', color: primaryColor, title: 'Card Payment', body: 'A payment of $45.99 was made with your card.', time: '1 hr ago' },
              { icon: 'alert-circle-outline', color: BSColors.warning, title: 'Low Balance Alert', body: 'Your checking account balance is below $100.', time: '3 hr ago' },
              { icon: 'gift-outline', color: '#7C3AED', title: 'Cashback Earned', body: 'You earned $5.00 cashback on your last purchase.', time: 'Yesterday' },
              { icon: 'shield-checkmark-outline', color: BSColors.info, title: 'Security Update', body: 'Your account password was changed successfully.', time: '2 days ago' },
            ].map((n, i) => (
              <View key={i} style={styles.notifItem}>
                <View style={[styles.notifIconWrap, { backgroundColor: n.color + '15' }]}>
                  <Ionicons name={n.icon as any} size={20} color={n.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifItemTitle}>{n.title}</Text>
                  <Text style={styles.notifItemBody}>{n.body}</Text>
                  <Text style={styles.notifItemTime}>{n.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  safe: { flex: 1, backgroundColor: BSColors.bgPage },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { color: BSColors.darkGray, fontSize: 13, fontWeight: '500' },
  userName: { color: BSColors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: BSColors.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1, maxWidth: 130 },
  locationText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  notifDot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: BSColors.white },

  // Theme toggle
  themeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 18, borderWidth: 1 },
  themeToggleLabel: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Balance card
  balanceCard: { borderRadius: 24, padding: 24, marginBottom: 24, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  balanceCardGreen: { marginLeft: -6, marginTop: -4 },
  balanceCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginBottom: 2 },
  balanceCurrency: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  eyeBtn: { padding: 4 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },
  balanceDividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceItemIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  balanceItemLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 2 },
  balanceItemValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  balanceVertDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },

  // Quick actions
  sectionTitle: { color: BSColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  quickAction: { width: '18%', alignItems: 'center', gap: 7, flexGrow: 1, maxWidth: '20%' },
  quickActionIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { color: BSColors.textSecondary, fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Transactions
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  transactionCard: { backgroundColor: BSColors.white, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: BSColors.lightGray },
  txIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txMerchant: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  txCategory: { color: BSColors.darkGray, fontSize: 12 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txCredit: { color: BSColors.success },
  txDebit: { color: BSColors.error },
  emptyTx: { padding: 32, alignItems: 'center', gap: 10 },
  emptyTxText: { color: BSColors.darkGray, fontSize: 13 },

  // Notifications
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray },
  notifTitle: { color: BSColors.textPrimary, fontSize: 20, fontWeight: '800' },
  notifCloseBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: BSColors.lightGray, alignItems: 'center', justifyContent: 'center' },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: BSColors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  notifIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifItemTitle: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  notifItemBody: { color: BSColors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  notifItemTime: { color: BSColors.darkGray, fontSize: 11 },

  // QR
  qrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#000' },
  qrClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  qrTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  qrHint: { backgroundColor: '#000', padding: 20, alignItems: 'center' },
  qrHintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
});