import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RECORD_SECONDS = 8;
const SCAN_INTERVAL_MS = 800;   // take a snapshot every 800ms to check for eyes
const EYE_TIMEOUT_MS = 2000;    // if no eyes detected for 2s → retry

export default function LivenessScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<'ready' | 'recording' | 'done' | 'retry'>('ready');
  const [countdown, setCountdown] = useState(RECORD_SECONDS);
  const [eyesDetected, setEyesDetected] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eyeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseRef = useRef<string>('ready');

  const flowConfig = AuthStore.getFlowConfig();

  useEffect(() => {
    if (!flowConfig.cameraInjection) {
      router.replace('/biometric' as any);
    }
    return () => clearTimers();
  }, []);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (scanRef.current) clearInterval(scanRef.current);
    if (eyeTimeoutRef.current) clearTimeout(eyeTimeoutRef.current);
  };

  const resetEyeTimeout = () => {
    if (eyeTimeoutRef.current) clearTimeout(eyeTimeoutRef.current);
    eyeTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'recording') {
        clearTimers();
        phaseRef.current = 'retry';
        setPhase('retry');
      }
    }, EYE_TIMEOUT_MS);
  };

  const startVerification = async () => {
    if (!permission?.granted) { await requestPermission(); return; }
    phaseRef.current = 'recording';
    setPhase('recording');
    setCountdown(RECORD_SECONDS);
    setEyesDetected(false);

    // Start eye-loss timeout immediately
    resetEyeTimeout();

    // Periodic face scan using expo-face-detector
    scanRef.current = setInterval(async () => {
      if (phaseRef.current !== 'recording' || !cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: false,
          quality: 0.3,
          skipProcessing: true,
        });
        if (!photo?.uri) return;
        const result = await FaceDetector.detectFacesAsync(photo.uri, {
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
        });
        const hasEyes = result.faces.some(
          f => (f.leftEyeOpenProbability ?? 0) > 0.3 || (f.rightEyeOpenProbability ?? 0) > 0.3
        );
        if (hasEyes && phaseRef.current === 'recording') {
          setEyesDetected(true);
          resetEyeTimeout(); // reset 2s timer each time eyes are seen
        }
      } catch { /* ignore scan errors */ }
    }, SCAN_INTERVAL_MS);

    // Countdown timer
    let count = RECORD_SECONDS;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearTimers();
        phaseRef.current = 'done';
        setPhase('done');
      }
    }, 1000);
  };

  const handleRetry = () => {
    clearTimers();
    phaseRef.current = 'ready';
    setPhase('ready');
    setCountdown(RECORD_SECONDS);
    setEyesDetected(false);
  };

  const handleSkip = () => {
    clearTimers();
    router.replace('/biometric' as any);
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
          <TouchableOpacity style={s.skipBtn} onPress={handleSkip} testID="skip-liveness-btn">
            <Text style={s.skipBtnText}>Skip this step</Text>
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
        <Text style={s.subtitleHint}>Position your face to fill the frame</Text>

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
        ) : phase === 'retry' ? (
          <View style={s.retryContainer}>
            <View style={s.retryCircle}>
              <Ionicons name="eye-off-outline" size={56} color="#DC2626" />
            </View>
            <Text style={s.retryTitle}>Eyes Not Detected</Text>
            <Text style={s.retrySub}>
              Please look directly at the camera with your eyes open and try again.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={handleRetry} testID="retry-btn">
              <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} testID="skip-liveness-btn">
              <Text style={s.skipBtnText}>Skip this step</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.cameraFrame}>
              <CameraView
                ref={cameraRef}
                style={s.camera}
                facing="front"
                testID="liveness-camera-view"
              />
              {phase === 'recording' && (
                <View style={s.countdownOverlay}>
                  <Text style={s.countdownText}>{countdown}</Text>
                </View>
              )}
              {phase === 'recording' && <View style={s.recDot} />}
              {phase === 'recording' && eyesDetected && (
                <View style={s.eyesBadge}>
                  <Ionicons name="eye-outline" size={12} color="#fff" />
                  <Text style={s.eyesBadgeText}>Eyes detected ✓</Text>
                </View>
              )}
            </View>

            {phase === 'ready' && <Text style={s.cameraHint}>Hold still — face detection active</Text>}
            {phase === 'recording' && (
              <Text style={s.recordingLabel}>
                {eyesDetected ? `✓ Eyes detected · ${countdown}s remaining` : `Scanning... ${countdown}s`}
              </Text>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, phase === 'recording' && s.primaryBtnDisabled]}
              onPress={startVerification}
              disabled={phase === 'recording'}
              testID="start-verification-btn"
            >
              <Ionicons name="videocam-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>{phase === 'ready' ? 'Start Verification' : 'Recording...'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} testID="skip-liveness-btn">
              <Text style={s.skipBtnText}>Skip this step</Text>
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
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 4 },
  subtitleHint: { color: BSColors.primary, fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  cameraFrame: { width: 300, height: 380, borderRadius: 16, overflow: 'hidden', borderWidth: 4, borderColor: BSColors.primary, marginBottom: 16, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  camera: { width: '100%', height: '100%' },
  countdownOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  countdownText: { color: '#fff', fontSize: 64, fontWeight: '800' },
  recDot: { position: 'absolute', top: 12, right: 12, width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626' },
  eyesBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5,150,105,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  eyesBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cameraHint: { color: '#888', fontSize: 13, marginBottom: 16 },
  recordingLabel: { color: BSColors.primary, fontSize: 14, fontWeight: '600', marginBottom: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  skipBtn: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 20 },
  skipBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  successContainer: { alignItems: 'center', width: '100%', marginTop: 16 },
  successCircle: { marginBottom: 16 },
  successTitle: { color: '#111', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  successSub: { color: '#888', fontSize: 14, marginBottom: 28 },
  retryContainer: { alignItems: 'center', width: '100%', marginTop: 16 },
  retryCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  retryTitle: { color: '#DC2626', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  retrySub: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
});