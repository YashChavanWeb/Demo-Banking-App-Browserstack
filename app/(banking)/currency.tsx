import { CurrencyShimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RegionInfo {
  ip: string;
  city: string;
  region: string;
  country: string;          // ISO code e.g. "IN"
  countryName: string;      // e.g. "India"
  continent: string;
  timezone: string;
  currency: string;
  callingCode: string;
  languages: string;
  latitude: string;
  longitude: string;
  org: string;              // ISP / org
}

async function fetchRegionInfo(): Promise<RegionInfo> {
  // ip-api.com: free, no key, no 403 on mobile devices
  const res = await fetch(
    'http://ip-api.com/json/?fields=status,message,query,country,countryCode,regionName,city,timezone,currency,org,lat,lon'
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const d = await res.json();
  if (d.status !== 'success') throw new Error(d.message || 'Lookup failed');
  return {
    ip: d.query ?? '—',
    city: d.city ?? '—',
    region: d.regionName ?? '—',
    country: d.countryCode ?? '—',
    countryName: d.country ?? '—',
    continent: '—',          // ip-api free tier doesn't return continent
    timezone: d.timezone ?? '—',
    currency: d.currency ?? '—',
    callingCode: '—',        // not in free tier fields
    languages: '—',          // not in free tier fields
    latitude: d.lat != null ? String(d.lat) : '—',
    longitude: d.lon != null ? String(d.lon) : '—',
    org: d.org ?? '—',
  };
}

const CONTINENT_LABEL: Record<string, string> = {
  AF: 'Africa', AN: 'Antarctica', AS: 'Asia', EU: 'Europe',
  NA: 'North America', OC: 'Oceania', SA: 'South America',
};

export default function RegionScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<RegionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegionInfo()
      .then(setInfo)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const INFO_ROWS = info ? [
    { icon: 'location-outline',       label: 'City',           value: info.city },
    { icon: 'map-outline',            label: 'Region / State', value: info.region },
    { icon: 'flag-outline',           label: 'Country',        value: `${info.countryName} (${info.country})` },
    { icon: 'earth-outline',          label: 'Continent',      value: CONTINENT_LABEL[info.continent] ?? info.continent },
    { icon: 'time-outline',           label: 'Timezone',       value: info.timezone },
    { icon: 'cash-outline',           label: 'Currency',       value: info.currency },
    { icon: 'call-outline',           label: 'Calling Code',   value: info.callingCode },
    { icon: 'language-outline',       label: 'Languages',      value: info.languages },
    { icon: 'navigate-outline',       label: 'Coordinates',    value: `${info.latitude}, ${info.longitude}` },
    { icon: 'wifi-outline',           label: 'ISP / Org',      value: info.org },
    { icon: 'shield-outline',         label: 'IP Address',     value: info.ip },
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BSColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Region Info</Text>
        <View style={styles.refreshBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <CurrencyShimmer />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={BSColors.darkGray} />
            <Text style={styles.errorText}>Could not fetch region data</Text>
            <Text style={styles.errorSub}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Hero */}
            <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
              <Text style={styles.heroFlag}>🌍</Text>
              <Text style={styles.heroCode}>{info!.countryName}</Text>
              <Text style={styles.heroSub}>{info!.city}{info!.region !== info!.city ? `, ${info!.region}` : ''}</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="globe-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroBadgeText}>Detected from your IP address</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Region Details</Text>
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
                Region data is fetched live from your device's public IP address. Results reflect your current network location.
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
  refreshBtn: { width: 38, height: 38 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  heroCard: { borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroFlag: { fontSize: 56, marginBottom: 8 },
  heroCode: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500', marginBottom: 16, textAlign: 'center' },
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
  errorCard: { alignItems: 'center', paddingTop: 80, gap: 12 },
  errorText: { color: BSColors.textPrimary, fontSize: 16, fontWeight: '700' },
  errorSub: { color: BSColors.darkGray, fontSize: 13 },
});