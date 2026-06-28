import { BSColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export default function ShakeScreen() {
  const { primaryColor, primaryBg, primaryBorder } = useTheme();
  const router = useRouter();
  const [shakeEnabled, setShakeEnabled] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const lastShakeTime = useRef(0);

  const triggerShakeEffect = useCallback(() => {
    const now = Date.now();
    if (now - lastShakeTime.current < 1500) return;
    lastShakeTime.current = now;
    setShakeCount(c => c + 1);
    setShowModal(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  useEffect(() => {
    if (!shakeEnabled) return;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Accelerometer } = require('expo-sensors');
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
      const dx = Math.abs(x - lastAccel.current.x);
      const dy = Math.abs(y - lastAccel.current.y);
      const dz = Math.abs(z - lastAccel.current.z);
      lastAccel.current = { x, y, z };
      if (dx + dy + dz > 2.5) triggerShakeEffect();
    });
    return () => sub.remove();
  }, [shakeEnabled, triggerShakeEffect]);

  const EMOJIS = ['🎉', '🚀', '⚡', '🎊', '🔥', '💥', '🌟', '🎯'];
  const emoji = EMOJIS[shakeCount % EMOJIS.length];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Shake Detection</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.phoneCard, { transform: [{ translateX: shakeAnim }] }]}>
          <Ionicons name="phone-portrait-outline" size={80} color={shakeEnabled ? '#D97706' : '#94A3B8'} />
          <Text style={styles.phoneLabel}>{shakeEnabled ? 'Shake me!' : 'Enable detection first'}</Text>
        </Animated.View>

        <View style={styles.countCard}>
          <Text style={styles.countLabel}>Shakes Detected</Text>
          <Text style={styles.countValue}>{shakeCount}</Text>
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: shakeEnabled ? '#DC2626' : '#D97706' }]}
          onPress={() => setShakeEnabled(e => !e)}
          testID="shake-toggle-btn"
        >
          <Ionicons name={shakeEnabled ? 'stop-circle-outline' : 'radio-outline'} size={20} color="#fff" />
          <Text style={styles.toggleBtnText}>{shakeEnabled ? 'Stop Detection' : 'Enable Shake Detection'}</Text>
        </TouchableOpacity>

        {shakeEnabled && (
          <View style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={16} color="#D97706" />
            <Text style={styles.hintText}>Shake your device to trigger the effect!</Text>
          </View>
        )}
      </View>

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.modalEmoji}>{emoji}</Text>
            <Text style={styles.modalTitle}>Shake #{shakeCount}!</Text>
            <Text style={styles.modalDesc}>Great shake! Keep going for more surprises.</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setShowModal(false)}>
              <Text style={styles.modalBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, alignItems: 'center' },
  phoneCard: { backgroundColor: '#fff', borderRadius: 24, padding: 40, alignItems: 'center', marginBottom: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  phoneLabel: { color: '#64748B', fontSize: 16, marginTop: 12, fontWeight: '600' },
  countCard: { backgroundColor: '#FEF3C7', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 24, width: '100%', borderWidth: 1, borderColor: '#FDE68A' },
  countLabel: { color: '#92400E', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  countValue: { color: '#D97706', fontSize: 48, fontWeight: '800' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 16, width: '100%', marginBottom: 12 },
  toggleBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hintCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, width: '100%', borderWidth: 1, borderColor: '#FDE68A' },
  hintText: { color: '#92400E', fontSize: 13, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center' },
  modalEmoji: { fontSize: 64, marginBottom: 12 },
  modalTitle: { color: '#0F172A', fontSize: 26, fontWeight: '800', marginBottom: 8 },
  modalDesc: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  modalBtn: { backgroundColor: BSColors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});