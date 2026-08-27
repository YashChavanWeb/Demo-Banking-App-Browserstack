import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LivenessScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [phase, setPhase] = useState<'ready' | 'capturing' | 'preview'>('ready');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const flowConfig = AuthStore.getFlowConfig();

  useEffect(() => {
    if (!flowConfig.cameraInjection) {
      if (flowConfig.biometric) {
        router.replace('/biometric' as any);
      } else if (flowConfig.fileUpload) {
        router.replace('/kyc' as any);
      } else {
        router.replace('/(banking)/home' as any);
      }
    }
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setPhase('capturing');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setPhase('preview');
      } else {
        setPhase('ready');
      }
    } catch {
      setPhase('ready');
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setPhase('ready');
  };

  const handleContinue = () => {
    if (flowConfig.biometric) {
      router.replace('/biometric' as any);
    } else if (flowConfig.fileUpload) {
      router.replace('/kyc' as any);
    } else {
      router.replace('/(banking)/home' as any);
    }
  };

  const handleSkip = () => {
    if (flowConfig.biometric) {
      router.replace('/biometric' as any);
    } else if (flowConfig.fileUpload) {
      router.replace('/kyc' as any);
    } else {
      router.replace('/(banking)/home' as any);
    }
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

        <Text style={s.title}>Liveness Verification</Text>
        <Text style={s.subtitle}>
          {phase === 'preview' ? 'Review your photo and continue or retake' : 'Position your face in the frame and take a photo'}
        </Text>

        {phase !== 'preview' ? (
          <>
            {/* Camera preview */}
            <View style={s.cameraFrame}>
              <CameraView
                ref={cameraRef}
                style={s.camera}
                facing={cameraFacing}
                testID="liveness-camera-view"
              />
              {/* Camera switch */}
              <TouchableOpacity
                style={s.cameraSwitchBtn}
                onPress={() => setCameraFacing(f => f === 'back' ? 'front' : 'back')}
                testID="camera-switch-btn"
                disabled={phase === 'capturing'}
              >
                <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
              </TouchableOpacity>
              {/* Camera indicator */}
              <View style={s.cameraIndicator}>
                <Ionicons name={cameraFacing === 'front' ? 'person-outline' : 'scan-outline'} size={10} color="#fff" />
                <Text style={s.cameraIndicatorText}>{cameraFacing === 'front' ? 'Front' : 'Back'}</Text>
              </View>
              {phase === 'capturing' && (
                <View style={s.capturingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={s.capturingText}>Capturing...</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[s.captureBtn, phase === 'capturing' && s.captureBtnDisabled]}
              onPress={handleCapture}
              disabled={phase === 'capturing'}
              testID="capture-btn"
            >
              <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={s.primaryBtnText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={handleSkip} testID="skip-liveness-btn">
              <Text style={s.skipBtnText}>Skip this step</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Photo preview */}
            <View style={s.previewFrame}>
              <Image
                source={{ uri: capturedUri! }}
                style={s.previewImage}
                contentFit="cover"
                testID="captured-photo"
              />
              <View style={s.previewBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={s.previewBadgeText}>Photo captured</Text>
              </View>
            </View>

            <View style={s.previewActions}>
              <TouchableOpacity style={s.retakeBtn} onPress={handleRetake} testID="retake-btn">
                <Ionicons name="refresh-outline" size={18} color={BSColors.primary} style={{ marginRight: 6 }} />
                <Text style={s.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.continueBtn} onPress={handleContinue} testID="continue-btn">
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPageAlt },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 32, paddingBottom: 32 },
  logo: { width: 160, height: 44, marginBottom: 16 },
  stepBadge: { backgroundColor: BSColors.indigoBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: BSColors.primary + '40' },
  stepBadgeText: { color: BSColors.primary, fontSize: 12, fontWeight: '600' },
  title: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  cameraFrame: { width: 300, height: 380, borderRadius: 16, overflow: 'hidden', borderWidth: 4, borderColor: BSColors.primary, marginBottom: 20, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  camera: { width: '100%', height: '100%' },
  cameraSwitchBtn: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cameraIndicator: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  cameraIndicatorText: { color: BSColors.white, fontSize: 10, fontWeight: '700' },
  capturingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  capturingText: { color: BSColors.white, fontSize: 16, fontWeight: '600' },
  captureBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  captureBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: BSColors.white, fontSize: 15, fontWeight: '700' },
  skipBtn: { marginTop: 4, paddingVertical: 8, paddingHorizontal: 20 },
  skipBtnText: { color: BSColors.slate300, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  previewFrame: { width: 300, height: 380, borderRadius: 16, overflow: 'hidden', borderWidth: 4, borderColor: BSColors.successDark, marginBottom: 20, shadowColor: BSColors.successDark, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  previewImage: { width: '100%', height: '100%' },
  previewBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5,150,105,0.85)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  previewBadgeText: { color: BSColors.white, fontSize: 10, fontWeight: '700' },
  previewActions: { flexDirection: 'row', gap: 12, width: '100%' },
  retakeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BSColors.indigoBg, borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: BSColors.primary + '40' },
  retakeBtnText: { color: BSColors.primary, fontSize: 15, fontWeight: '700' },
  continueBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: BSColors.successDark, borderRadius: 12, paddingVertical: 14 },
  continueBtnText: { color: BSColors.white, fontSize: 15, fontWeight: '700' },
});