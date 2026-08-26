import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BiometricScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const isSignup = AuthStore.getFlow() === 'signup';

  // Skip biometric step if disabled in flow config
  React.useEffect(() => {
    if (isSignup) {
      const cfg = AuthStore.getFlowConfig();
      if (!cfg.biometric) {
        if (cfg.fileUpload) {
          router.replace('/kyc' as any);
        } else {
          router.replace('/(banking)/home' as any);
        }
      }
    }
  }, []);

  const navigateToDashboard = () => {
    const flow = AuthStore.getFlow();
    const role = AuthStore.getRole();
    if (flow === 'signup') {
      const cfg = AuthStore.getFlowConfig();
      if (cfg.fileUpload) {
        router.replace('/kyc' as any);
      } else {
        router.replace('/(banking)/home' as any);
      }
    } else {
      router.replace(role === 'admin' ? '/(admin)/users' as any : '/(banking)/home' as any);
    }
  };

  const handleScan = async () => {
    setStatus('scanning');
    setErrorMsg('');
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to continue',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setStatus('success');
        setTimeout(navigateToDashboard, 700);
      } else {
        setStatus('error');
        setErrorMsg('Biometric authentication failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Biometric authentication failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Image source={require('@/assets/images/browserstack-logo.png')} style={s.logo} contentFit="contain" testID="bs-logo-bio" />

        {isSignup && (
          <View style={s.stepBadge}>
            <Text style={s.stepBadgeText}>Step 4 of 5 — Biometric Registration</Text>
          </View>
        )}

        <Text style={s.title}>Biometric Verification</Text>
        <Text style={s.subtitle}>{isSignup ? 'Register your fingerprint to secure your account' : 'Confirm your identity to access your account'}</Text>

        <TouchableOpacity
          style={[s.fpCircle, status === 'scanning' && s.fpScanning, status === 'success' && s.fpSuccess, status === 'error' && s.fpError]}
          onPress={handleScan}
          testID="fingerprint-btn"
          activeOpacity={0.8}
          disabled={status === 'scanning' || status === 'success'}
        >
          {status === 'scanning' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Ionicons
              name={status === 'success' ? 'checkmark-circle' : status === 'error' ? 'close-circle' : 'finger-print'}
              size={72}
              color={status === 'idle' ? BSColors.primary : BSColors.white}
            />
          )}
        </TouchableOpacity>

        <Text style={s.fpLabel}>
          {status === 'idle' && 'Tap to scan fingerprint'}
          {status === 'scanning' && 'Scanning...'}
          {status === 'success' && 'Identity Verified!'}
          {status === 'error' && 'Authentication failed'}
        </Text>

        {errorMsg ? <Text style={s.errorMsg} testID="bio-error">{errorMsg}</Text> : null}

        <TouchableOpacity
          style={[s.scanBtn, (status === 'scanning' || status === 'success') && s.scanBtnDisabled]}
          onPress={handleScan}
          disabled={status === 'scanning' || status === 'success'}
          testID="scan-btn"
        >
          <Ionicons name="finger-print" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.scanBtnText}>{status === 'error' ? 'Try Again' : 'Scan Fingerprint'}</Text>
        </TouchableOpacity>

        <View style={s.secureNote}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
          <Text style={s.secureNoteText}>Secured by device biometrics — no data leaves your device</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPageAlt },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32 },
  logo: { width: 180, height: 48, marginBottom: 16 },
  stepBadge: { backgroundColor: BSColors.indigoBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: BSColors.primary + '40' },
  stepBadgeText: { color: BSColors.primary, fontSize: 12, fontWeight: '600' },
  title: { color: '#111', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 40 },
  fpCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: BSColors.indigoBg,
    borderWidth: 3, borderColor: BSColors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  fpScanning: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  fpSuccess: { backgroundColor: BSColors.successDark, borderColor: BSColors.successDark },
  fpError: { backgroundColor: BSColors.errorDark, borderColor: BSColors.errorDark },
  fpLabel: { color: '#555', fontSize: 15, fontWeight: '500', marginBottom: 8 },
  errorMsg: { color: BSColors.errorDark, fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16, marginBottom: 24,
    shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  scanBtnDisabled: { opacity: 0.5 },
  scanBtnText: { color: BSColors.white, fontSize: 15, fontWeight: '700' },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureNoteText: { color: '#888', fontSize: 12 },
});