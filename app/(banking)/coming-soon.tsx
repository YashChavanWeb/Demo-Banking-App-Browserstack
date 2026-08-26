import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; desc: string }> = {
  Agent: { icon: 'hardware-chip-outline', color: BSColors.purple, desc: 'AI-powered banking agents that automate tasks, answer questions, and manage your finances intelligently.' },
  A11y: { icon: 'accessibility-outline', color: BSColors.infoDark, desc: 'Accessibility testing and compliance tools to ensure the app works for everyone, including users with disabilities.' },
  Visual: { icon: 'eye-outline', color: BSColors.warningDark, desc: 'Visual regression testing to catch UI changes and ensure pixel-perfect consistency across releases.' },
  Local: { icon: 'server-outline', color: BSColors.successDark, desc: 'BrowserStack Local integration for testing against your local or internal network environments.' },
};

export default function ComingSoonScreen() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const name = feature || 'Feature';
  const meta = FEATURE_META[name] ?? { icon: 'construct-outline' as const, color: BSColors.primary, desc: 'This feature is currently under development.' };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={64} color={meta.color} />
        </View>

        <View style={[styles.badge, { backgroundColor: meta.color + '15', borderColor: meta.color + '40' }]}>
          <Ionicons name="time-outline" size={13} color={meta.color} />
          <Text style={[styles.badgeText, { color: meta.color }]}>Coming Soon</Text>
        </View>

        <Text style={styles.title}>{name}</Text>
        <Text style={styles.desc}>{meta.desc}</Text>

        <View style={styles.card}>
          <Ionicons name="construct-outline" size={20} color="#94A3B8" style={{ marginBottom: 8 }} />
          <Text style={styles.cardTitle}>Under Development</Text>
          <Text style={styles.cardSub}>This feature is being built and will be available in a future release of the BrowserStack Bank demo app.</Text>
        </View>

        <TouchableOpacity style={[styles.backHomeBtn, { backgroundColor: meta.color }]} onPress={() => router.back()} testID="coming-soon-back-btn">
          <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPageAlt },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: BSColors.textPrimary, fontSize: 18, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 40 },
  iconWrap: { width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, marginBottom: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  title: { color: BSColors.textPrimary, fontSize: 26, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  desc: { color: BSColors.darkGray, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  card: { backgroundColor: BSColors.white, borderRadius: 18, padding: 20, alignItems: 'center', width: '100%', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { color: BSColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  cardSub: { color: BSColors.slate300, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  backHomeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  backHomeBtnText: { color: BSColors.white, fontSize: 15, fontWeight: '700' },
});