import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ip-api.com: free, no auth, works from React Native (no browser UA required)
const IP_GEO_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,offset,org,lat,lon,currency,query';

const CURRENCY_FLAG: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', INR: '🇮🇳', AUD: '🇦🇺',
  CAD: '🇨🇦', JPY: '🇯🇵', CNY: '🇨🇳', SGD: '🇸🇬', AED: '🇦🇪',
  BRL: '🇧🇷', MXN: '🇲🇽', ZAR: '🇿🇦', CHF: '🇨🇭', KRW: '🇰🇷',
  SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', NZD: '🇳🇿', HKD: '🇭🇰',
  THB: '🇹🇭', MYR: '🇲🇾', IDR: '🇮🇩', PHP: '🇵🇭', TRY: '🇹🇷',
  SAR: '🇸🇦', QAR: '🇶🇦', KWD: '🇰🇼', EGP: '🇪🇬',
};

const CURRENCY_NAME: Record<string, string> = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', INR: 'Indian Rupee',
  AUD: 'Australian Dollar', CAD: 'Canadian Dollar', JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan', SGD: 'Singapore Dollar', AED: 'UAE Dirham',
  BRL: 'Brazilian Real', MXN: 'Mexican Peso', ZAR: 'South African Rand',
  CHF: 'Swiss Franc', KRW: 'South Korean Won', SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone', DKK: 'Danish Krone', NZD: 'New Zealand Dollar',
  HKD: 'Hong Kong Dollar', THB: 'Thai Baht', MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah', PHP: 'Philippine Peso', TRY: 'Turkish Lira',
  SAR: 'Saudi Riyal', QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar', EGP: 'Egyptian Pound',
};

interface GeoData {
  query: string;       // IP address
  city: string;
  regionName: string;
  country: string;     // country name
  countryCode: string;
  currency: string;
  timezone: string;
  offset: number;      // UTC offset in seconds
  org: string;
  lat: number;
  lon: number;
  status: string;
  message?: string;
}

export default function CurrencyScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const params = useLocalSearchParams<{ code?: string; country?: string; city?: string }>();

  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGeo = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(IP_GEO_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GeoData = await res.json();
      if (data.status === 'fail') throw new Error(data.message || 'Geolocation failed');
      setGeoData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGeo(); }, []);

  const currencyCode = geoData?.currency || params.code || '—';
  const flag = CURRENCY_FLAG[currencyCode] || '💱';
  const currencyName = CURRENCY_NAME[currencyCode] || currencyCode;

  const utcOffsetHours = geoData ? (geoData.offset >= 0 ? `+${geoData.offset / 3600}` : `${geoData.offset / 3600}`) : '';

  const INFO_ROWS = geoData ? [
    { icon: 'globe-outline', label: 'IP Address', value: geoData.query || '—' },
    { icon: 'map-outline', label: 'City', value: geoData.city || '—' },
    { icon: 'flag-outline', label: 'Region', value: geoData.regionName || '—' },
    { icon: 'earth-outline', label: 'Country', value: geoData.country || '—' },
    { icon: 'time-outline', label: 'Timezone', value: `${geoData.timezone} (UTC${utcOffsetHours})` },
    { icon: 'business-outline', label: 'ISP / Org', value: geoData.org || '—' },
    { icon: 'navigate-outline', label: 'Coordinates', value: `${geoData.lat?.toFixed(4)}, ${geoData.lon?.toFixed(4)}` },
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BSColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>IP Currency</Text>
        <TouchableOpacity onPress={fetchGeo} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={primaryColor} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Detecting your location via IP...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="warning-outline" size={40} color={BSColors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: primaryColor }]} onPress={fetchGeo}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
              <Text style={styles.heroFlag}>{flag}</Text>
              <Text style={styles.heroCode}>{currencyCode}</Text>
              <Text style={styles.heroName}>{currencyName}</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroBadgeText}>Detected from your IP address</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Location Details</Text>
            <View style={styles.infoCard}>
              {INFO_ROWS.map((row, i) => (
                <View key={row.label} style={[styles.infoRow, i < INFO_ROWS.length - 1 && styles.infoRowBorder]}>
                  <View style={[styles.infoIconWrap, { backgroundColor: primaryColor + '15' }]}>
                    <Ionicons name={row.icon as any} size={16} color={primaryColor} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={16} color={BSColors.info} />
              <Text style={styles.noteText}>
                Currency is determined by your IP geolocation — not your device GPS or SIM card. This reflects the country your internet request originates from.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: BSColors.textPrimary, fontSize: 18, fontWeight: '800' },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  loadingWrap: { alignItems: 'center', paddingTop: 80, gap: 16 },
  loadingText: { color: BSColors.darkGray, fontSize: 14 },
  errorWrap: { alignItems: 'center', paddingTop: 80, gap: 16 },
  errorText: { color: BSColors.error, fontSize: 14, textAlign: 'center' },
  retryBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroCard: { borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroFlag: { fontSize: 56, marginBottom: 8 },
  heroCode: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: 2 },
  heroName: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '500', marginBottom: 16 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  heroBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  sectionTitle: { color: BSColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoCard: { backgroundColor: BSColors.white, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: BSColors.lightGray },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { color: BSColors.darkGray, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '600' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: BSColors.primaryBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BSColors.primaryBorder },
  noteText: { color: BSColors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});