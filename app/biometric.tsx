import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CORRECT_PIN = '1234';

export default function BiometricScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'biometric' | 'pin'>('biometric');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const isSignup = AuthStore.getFlow() === 'signup';

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

  const handleSuccess = () => {
    setVerified(true);
    setTimeout(navigateToDashboard, 600);
  };

  const handlePinChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(digits);
    setPinError('');
    if (digits.length === 4) {
      setTimeout(() => {
        if (digits === CORRECT_PIN) {
          handleSuccess();
        } else {
          setPinError('Incorrect PIN. Please try again.');
          setPin('');
        }
      }, 150);
    }
  };

  const triggerBiometric = async () => {
    setBioLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setBioLoading(false);
        handleSuccess();
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to continue',
        fallbackLabel: 'Use PIN instead',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      setBioLoading(false);
      if (result.success) {
        handleSuccess();
      } else if (result.error === 'user_cancel') {
        // stay
      } else if (result.error === 'user_fallback') {
        setMode('pin');
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        handleSuccess();
      }
    } catch {
      setBioLoading(false);
      handleSuccess();
    }
  };

  const switchMode = (m: 'biometric' | 'pin') => {
    setMode(m);
    setPin('');
    setPinError('');
    setBioLoading(false);
    if (m === 'pin') setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>

          <Image source={require('@/assets/images/browserstack-logo.png')} style={s.logo} contentFit="contain" testID="bs-logo-bio" />

          {isSignup && (
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 4 of 5 — Identity Verification</Text>
            </View>
          )}

          <Text style={s.title}>Verify Your Identity</Text>
          <Text style={s.subtitle}>
            {isSignup ? 'Register your identity to secure your account' : 'Confirm your identity to access your account'}
          </Text>

          {/* Toggle tabs */}
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, mode === 'biometric' && s.tabActive]}
              onPress={() => switchMode('biometric')}
              testID="tab-biometric"
            >
              <Ionicons name="finger-print-outline" size={16} color={mode === 'biometric' ? BSColors.white : BSColors.primary} style={{ marginRight: 6 }} />
              <Text style={[s.tabText, mode === 'biometric' && s.tabTextActive]}>Biometric</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, mode === 'pin' && s.tabActive]}
              onPress={() => switchMode('pin')}
              testID="tab-pin"
            >
              <Ionicons name="keypad-outline" size={16} color={mode === 'pin' ? BSColors.white : BSColors.primary} style={{ marginRight: 6 }} />
              <Text style={[s.tabText, mode === 'pin' && s.tabTextActive]}>PIN</Text>
            </TouchableOpacity>
          </View>

          {verified ? (
            <View style={s.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color={BSColors.successDark} />
              <Text style={s.successText}>Identity Verified!</Text>
            </View>
          ) : mode === 'biometric' ? (
            /* ── Biometric mode ── */
            <View style={s.modeContent}>
              <View style={s.bioIconCircle}>
                {bioLoading
                  ? null
                  : <Ionicons name="finger-print" size={72} color={BSColors.primary} />}
              </View>
              <Text style={s.modeHint}>Use your fingerprint or Face ID to verify</Text>

              <TouchableOpacity
                style={[s.primaryBtn, bioLoading && s.primaryBtnDisabled]}
                onPress={triggerBiometric}
                disabled={bioLoading}
                testID="fingerprint-btn"
              >
                {bioLoading
                  ? <Text style={s.primaryBtnText}>Verifying...</Text>
                  : <>
                      <Ionicons name="finger-print-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={s.primaryBtnText}>Scan Biometric</Text>
                    </>}
              </TouchableOpacity>

              <TouchableOpacity style={s.switchLink} onPress={() => switchMode('pin')}>
                <Text style={s.switchLinkText}>Use PIN instead</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── PIN mode ── */
            <View style={s.modeContent}>
              <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={s.pinRow} testID="pin-display">
                {Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={[s.pinBox, pin[i] ? s.pinBoxFilled : null, i === pin.length && s.pinBoxActive]}>
                    <Text style={s.pinDigit}>{pin[i] ? '●' : ''}</Text>
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={s.hiddenInput}
                value={pin}
                onChangeText={handlePinChange}
                keyboardType="number-pad"
                maxLength={4}
                testID="pin-input"
                autoFocus
                secureTextEntry
              />

              {pinError ? <Text style={s.error} testID="pin-error">{pinError}</Text> : null}

              <TouchableOpacity
                style={[s.primaryBtn, pin.length < 4 && s.primaryBtnDisabled]}
                onPress={() => {
                  if (pin === CORRECT_PIN) {
                    handleSuccess();
                  } else {
                    setPinError('Incorrect PIN. Please try again.');
                    setPin('');
                  }
                }}
                disabled={pin.length < 4}
                testID="verify-pin-btn"
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.primaryBtnText}>Verify PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.switchLink} onPress={() => switchMode('biometric')}>
                <Text style={s.switchLinkText}>Use biometric instead</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPageAlt },
  flex: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 36, paddingBottom: 32 },
  logo: { width: 180, height: 48, marginBottom: 16 },
  stepBadge: { backgroundColor: BSColors.indigoBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: BSColors.primary + '40' },
  stepBadgeText: { color: BSColors.primary, fontSize: 12, fontWeight: '600' },
  title: { color: '#111', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 24 },
  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: BSColors.indigoBg, borderRadius: 12, padding: 4, marginBottom: 32, borderWidth: 1, borderColor: BSColors.indigoBorder },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  tabActive: { backgroundColor: BSColors.primary },
  tabText: { color: BSColors.primary, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: BSColors.white },
  // Mode content
  modeContent: { width: '100%', alignItems: 'center' },
  bioIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: BSColors.indigoBg, borderWidth: 2, borderColor: BSColors.indigoBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modeHint: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 32 },
  // PIN boxes (same style as OTP boxes)
  pinRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  pinBox: { width: 60, height: 68, borderRadius: 12, borderWidth: 2, borderColor: BSColors.indigoBorder, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center' },
  pinBoxFilled: { borderColor: BSColors.primary, backgroundColor: BSColors.indigoBg },
  pinBoxActive: { borderColor: BSColors.primary, borderWidth: 2.5 },
  pinDigit: { color: '#111', fontSize: 24, fontWeight: '700' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: { color: BSColors.errorDark, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  // Primary button (same as OTP verify button)
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 48,
    marginBottom: 16, width: '100%',
    shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: BSColors.white, fontSize: 16, fontWeight: '700' },
  switchLink: { marginTop: 4 },
  switchLinkText: { color: BSColors.primary, fontSize: 14, fontWeight: '600' },
  // Success
  successContainer: { alignItems: 'center', marginTop: 40 },
  successText: { color: BSColors.successDark, fontSize: 20, fontWeight: '700', marginTop: 16 },
});