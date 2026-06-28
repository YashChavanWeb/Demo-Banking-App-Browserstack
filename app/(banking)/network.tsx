import { BSColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export default function NetworkScreen() {
  const { primaryColor, primaryBg, primaryBorder } = useTheme();
  const router = useRouter();
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-store' });
      setOnline(res.ok);
    } catch {
      setOnline(false);
    }
    setChecking(false);
  };

  useEffect(() => { checkConnection(); }, []);

  const isOnline = online === true;
  const statusColor = online === null ? '#94A3B8' : isOnline ? '#059669' : '#DC2626';
  const statusBg = online === null ? '#F1F5F9' : isOnline ? '#F0FDF4' : '#FEF2F2';
  const statusIcon = online === null ? 'help-circle-outline' : isOnline ? 'wifi-outline' : 'wifi-outline';
  const statusText = online === null ? 'Checking...' : isOnline ? 'Online' : 'Offline';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Network Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: statusBg, borderColor: statusColor + '40' }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon as any} size={56} color={statusColor} />
          </View>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          <Text style={styles.statusDesc}>
            {online === null
              ? 'Checking your connection...'
              : isOnline
              ? 'Your device is connected to the internet.'
              : 'Your device is not connected to the internet.'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="radio-button-on-outline" size={18} color={statusColor} />
            <Text style={styles.infoLabel}>Connection Status</Text>
            <Text style={[styles.infoValue, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.checkBtn, checking && styles.checkBtnDisabled]}
          onPress={checkConnection}
          disabled={checking}
          testID="check-connection-btn"
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.checkBtnText}>{checking ? 'Checking...' : 'Check Again'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  statusCard: { borderRadius: 24, padding: 40, alignItems: 'center', marginBottom: 20, borderWidth: 1.5 },
  statusIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  statusText: { fontSize: 32, fontWeight: '800', marginBottom: 10 },
  statusDesc: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { flex: 1, color: '#475569', fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BSColors.primary, borderRadius: 14, paddingVertical: 16 },
  checkBtnDisabled: { opacity: 0.6 },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});