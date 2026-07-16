import { CurrencyShimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Map IANA timezone → ISO country code (covers major zones)
const TZ_TO_COUNTRY: Record<string, string> = {
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'America/St_Johns': 'CA',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO',
  'Europe/Athens': 'GR', 'Europe/Lisbon': 'PT', 'Europe/Moscow': 'RU',
  'Europe/Istanbul': 'TR', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG', 'Asia/Seoul': 'KR', 'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA', 'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA',
  'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK',
  'Asia/Kathmandu': 'NP', 'Asia/Yangon': 'MM', 'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Taipei': 'TW', 'Asia/Beirut': 'LB', 'Asia/Jerusalem': 'IL',
  'Asia/Amman': 'JO', 'Asia/Baghdad': 'IQ', 'Asia/Tehran': 'IR',
  'Asia/Tashkent': 'UZ', 'Asia/Almaty': 'KZ', 'Asia/Baku': 'AZ',
  'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
  'Africa/Johannesburg': 'ZA', 'Africa/Casablanca': 'MA', 'Africa/Accra': 'GH',
  'Africa/Addis_Ababa': 'ET', 'Africa/Dar_es_Salaam': 'TZ',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU', 'Pacific/Auckland': 'NZ',
  'Pacific/Fiji': 'FJ', 'America/Sao_Paulo': 'BR', 'America/Buenos_Aires': 'AR',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
  'America/Lima': 'PE', 'America/Santiago': 'CL', 'America/Caracas': 'VE',
  'America/Mexico_City': 'MX', 'America/Monterrey': 'MX',
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', FR: 'EUR', DE: 'EUR',
  IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR',
  PT: 'EUR', GR: 'EUR', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', RU: 'RUB',
  IN: 'INR', JP: 'JPY', CN: 'CNY', HK: 'HKD', SG: 'SGD', KR: 'KRW',
  AE: 'AED', SA: 'SAR', KW: 'KWD', QA: 'QAR', PK: 'PKR', BD: 'BDT',
  LK: 'LKR', NP: 'NPR', MM: 'MMK', TH: 'THB', ID: 'IDR', PH: 'PHP',
  MY: 'MYR', TW: 'TWD', LB: 'LBP', IL: 'ILS', JO: 'JOD', IQ: 'IQD',
  IR: 'IRR', UZ: 'UZS', KZ: 'KZT', AZ: 'AZN', EG: 'EGP', NG: 'NGN',
  KE: 'KES', ZA: 'ZAR', MA: 'MAD', GH: 'GHS', ET: 'ETB', TZ: 'TZS',
  AU: 'AUD', NZ: 'NZD', FJ: 'FJD', BR: 'BRL', AR: 'ARS', CO: 'COP',
  PE: 'PEN', CL: 'CLP', VE: 'VES', MX: 'MXN',
};

const COUNTRY_NAME_MAP: Record<string, string> = {
  US: 'United States', CA: 'Canada', GB: 'United Kingdom', IE: 'Ireland',
  FR: 'France', DE: 'Germany', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  BE: 'Belgium', AT: 'Austria', FI: 'Finland', PT: 'Portugal', GR: 'Greece',
  CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', PL: 'Poland',
  CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania', TR: 'Turkey', RU: 'Russia',
  IN: 'India', JP: 'Japan', CN: 'China', HK: 'Hong Kong', SG: 'Singapore',
  KR: 'South Korea', AE: 'UAE', SA: 'Saudi Arabia', KW: 'Kuwait', QA: 'Qatar',
  PK: 'Pakistan', BD: 'Bangladesh', LK: 'Sri Lanka', NP: 'Nepal', TH: 'Thailand',
  ID: 'Indonesia', PH: 'Philippines', MY: 'Malaysia', TW: 'Taiwan', EG: 'Egypt',
  NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', MA: 'Morocco', GH: 'Ghana',
  AU: 'Australia', NZ: 'New Zealand', BR: 'Brazil', AR: 'Argentina',
  CO: 'Colombia', PE: 'Peru', CL: 'Chile', MX: 'Mexico',
};

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

interface LocaleInfo {
  timezone: string;
  countryCode: string;
  countryName: string;
  currencyCode: string;
  currencyName: string;
  flag: string;
}

function detectLocaleInfo(overrideCode?: string, overrideCountry?: string): LocaleInfo {
  // Use Intl API (available in Hermes/JSC) to get device timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const countryCode = TZ_TO_COUNTRY[timezone] || 'US';
  const currencyCode = overrideCode || COUNTRY_TO_CURRENCY[countryCode] || 'USD';
  const countryName = overrideCountry || COUNTRY_NAME_MAP[countryCode] || countryCode;
  return {
    timezone,
    countryCode,
    countryName,
    currencyCode,
    currencyName: CURRENCY_NAME[currencyCode] || currencyCode,
    flag: CURRENCY_FLAG[currencyCode] || '💱',
  };
}

export default function CurrencyScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const params = useLocalSearchParams<{ code?: string; country?: string; city?: string }>();

  // Simulate a brief "detecting" shimmer so the screen doesn't flash instantly
  const [loading, setLoading] = useState(true);
  const [localeInfo, setLocaleInfo] = useState<LocaleInfo | null>(null);

  useEffect(() => {
    // Detect synchronously but show shimmer for UX polish
    const info = detectLocaleInfo(params.code, params.country);
    const timer = setTimeout(() => {
      setLocaleInfo(info);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const currencyCode = localeInfo?.currencyCode || '—';
  const flag = localeInfo?.flag || '💱';
  const currencyName = localeInfo?.currencyName || '—';

  const INFO_ROWS = localeInfo ? [
    { icon: 'earth-outline', label: 'Country', value: localeInfo.countryName },
    { icon: 'flag-outline', label: 'Country Code', value: localeInfo.countryCode },
    { icon: 'time-outline', label: 'Timezone', value: localeInfo.timezone },
    { icon: 'cash-outline', label: 'Currency Code', value: currencyCode },
    { icon: 'pricetag-outline', label: 'Currency Name', value: currencyName },
    { icon: 'globe-outline', label: 'Detection Method', value: 'Device timezone' },
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BSColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Local Currency</Text>
        <View style={styles.refreshBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <CurrencyShimmer />
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
              <Text style={styles.heroFlag}>{flag}</Text>
              <Text style={styles.heroCode}>{currencyCode}</Text>
              <Text style={styles.heroName}>{currencyName}</Text>
              <View style={styles.heroBadge}>
                <Ionicons name="phone-portrait-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroBadgeText}>Detected from device timezone</Text>
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
                Currency is determined by your device's timezone setting. Users in different regions will see their local currency automatically.
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