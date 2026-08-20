import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  {
    id: 'shake',
    title: 'Fraud Alert',
    subtitle: 'Shake to flag a suspicious transaction for fraud review',
    icon: 'phone-portrait-outline' as const,
    color: '#D97706',
    route: '/(banking)/shake',
  },
];

export default function TestFeaturesScreen() {
  const { primaryColor, primaryBg, primaryBorder } = useTheme();
  const router = useRouter();


  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Test Features</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Select a feature to explore</Text>
        {FEATURES.map(f => (
          <TouchableOpacity
            key={f.id}
            style={styles.featureCard}
            onPress={() => router.push(f.route as any)}
            testID={`feature-${f.id}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: f.color + '18' }]}>
              <Ionicons name={f.icon} size={28} color={f.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSubtitle}>{f.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={primaryColor} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  subtitle: { color: '#64748B', fontSize: 14, marginBottom: 20 },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureText: { flex: 1 },
  featureTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  featureSubtitle: { color: '#64748B', fontSize: 13 },
});