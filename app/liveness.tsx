import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';

const RECORD_SECONDS = 8;

export default function LivenessScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<'ready' | 'recording' | 'done'>('ready');
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startVerification = async () => {
    if (!permission?.granted) { await requestPermission(); return; }
    setPhase('recording');
    setCountdown(RECORD_SECONDS);
    let count = RECORD_SECONDS;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('done');
      }
    }, 1000);
  };

  if (!permission) return <View style={s.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.container}>
          <Image source={require('@/assets/images/browserstack-logo.png')} style={s.logo} contentFit="contain" />
          <Ionicons name="camera-outline" size={56} color={BSColors.primary} style={{ marginBottom: 16 }} />
          <Text style={s.title}>Camera Access Required</Text>
          <Text style={s.subtitle}>We need camera access for liveness verification</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={requestPermission}>
            <Text style={s.primaryBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Image source={require('@/assets/images/browserstack-logo.png')} style={s.logo} contentFit="contain" />

        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>Step 3 of 5 — Liveness Check</Text>
        </View>

        <Text style={s.title}>Video Liveness Verification</Text>
        <Text style={s.subtitle}>Look directly at the camera and hold still for 8 seconds</Text>

        {phase === 'done' ? (
          <View style={s.successContainer}>
            <View style={s.successCircle}>
              <Ionicons name="checkmark-circle" size={80} color="#059669" />
            </View>
            <Text style={s.successTitle}>Video Verified Successfully</Text>
            <Text style={s.successSub}>Your liveness check is complete</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace('/biometric' as any)} testID="continue-btn">
              <Text style={s.primaryBtnText}>Continue to Biometric Setup</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.cameraFrame}>
              <CameraView ref={cameraRef} style={s.camera} facing="front" mode="video" />
              {phase === 'recording' && (
                <View style={s.countdownOverlay}>
                  <Text style={s.countdownText}>{countdown}</Text>
                </View>
              )}
              {phase === 'recording' && <View style={s.recDot} />}
            </View>

            {phase === 'ready' && <Text style={s.cameraHint}>Position your face within the circle</Text>}
            {phase === 'recording' && <Text style={s.recordingLabel}>Recording... {countdown}s remaining</Text>}

            <TouchableOpacity
              style={[s.primaryBtn, phase === 'recording' && s.primaryBtnDisabled]}
              onPress={startVerification}
              disabled={phase === 'recording'}
              testID="start-verification-btn"
            >
              <Ionicons name="videocam-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>{phase === 'ready' ? 'Start Verification' : 'Recording...'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 32, paddingBottom: 32 },
  logo: { width: 160, height: 44, marginBottom: 16 },
  stepBadge: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: BSColors.primary + '40' },
  stepBadgeText: { color: BSColors.primary, fontSize: 12, fontWeight: '600' },
  title: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  cameraFrame: { width: 220, height: 220, borderRadius: 110, overflow: 'hidden', borderWidth: 4, borderColor: BSColors.primary, marginBottom: 16, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  camera: { width: '100%', height: '100%' },
  countdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: '#fff', fontSize: 64, fontWeight: '800' },
  recDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626' },
  cameraHint: { color: '#888', fontSize: 13, marginBottom: 24 },
  recordingLabel: { color: BSColors.primary, fontSize: 14, fontWeight: '600', marginBottom: 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  successContainer: { alignItems: 'center', width: '100%', marginTop: 16 },
  successCircle: { marginBottom: 16 },
  successTitle: { color: '#111', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  successSub: { color: '#888', fontSize: 14, marginBottom: 28 },
});