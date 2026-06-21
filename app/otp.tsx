import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';

const VALID_OTP = '123456';

export default function OTPScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);
  const isSignup = AuthStore.getFlow() === 'signup';

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(digits);
    setError('');
  };

  const handleVerify = () => {
    if (otp.length < 6) { setError('Please enter a 6-digit OTP.'); return; }
    if (otp === VALID_OTP) {
      router.replace(isSignup ? '/liveness' as any : '/biometric' as any);
    } else {
      setError('Invalid OTP. Please try again.');
      setOtp('');
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <Image source={require('@/assets/images/browserstack-logo.png')} style={s.logo} contentFit="contain" testID="bs-logo-otp" />

          {isSignup && (
            <View style={s.stepBadge}>
              <Text style={s.stepBadgeText}>Step 2 of 5 — OTP Verification</Text>
            </View>
          )}

          <Text style={s.title}>OTP Verification</Text>
          <Text style={s.subtitle}>Enter the 6-digit code sent to your device</Text>
          <Text style={s.hint}>Hint: use <Text style={s.hintCode}>123456</Text></Text>

          {/* Tappable OTP boxes — focuses hidden input */}
          <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={s.otpRow} testID="otp-display">
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[s.otpBox, otp[i] ? s.otpBoxFilled : null, i === otp.length && s.otpBoxActive]}>
                <Text style={s.otpDigit}>{otp[i] || ''}</Text>
              </View>
            ))}
          </TouchableOpacity>

          {/* Hidden native input — uses device keyboard */}
          <TextInput
            ref={inputRef}
            style={s.hiddenInput}
            value={otp}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={6}
            testID="otp-input"
            autoFocus
          />

          {error ? <Text style={s.error} testID="otp-error">{error}</Text> : null}

          <TouchableOpacity
            style={[s.verifyBtn, otp.length < 6 && s.verifyBtnDisabled]}
            onPress={handleVerify}
            testID="verify-btn"
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.verifyBtnText}>Verify OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.resendRow} onPress={() => { setOtp(''); setError(''); }}>
            <Text style={s.resendText}>Didn't receive code? <Text style={s.resendLink}>Resend</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  container: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 36, paddingBottom: 32 },
  logo: { width: 180, height: 48, marginBottom: 16 },
  stepBadge: { backgroundColor: '#FFF8F3', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16, borderWidth: 1, borderColor: BSColors.orange + '40' },
  stepBadgeText: { color: BSColors.orange, fontSize: 12, fontWeight: '600' },
  title: { color: '#111', fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center', marginBottom: 6 },
  hint: { color: '#888', fontSize: 13, marginBottom: 28 },
  hintCode: { color: BSColors.orange, fontWeight: '700' },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#F7F7F7', alignItems: 'center', justifyContent: 'center' },
  otpBoxFilled: { borderColor: BSColors.orange, backgroundColor: '#FFF8F3' },
  otpBoxActive: { borderColor: BSColors.orange, borderWidth: 2.5 },
  otpDigit: { color: '#111', fontSize: 22, fontWeight: '700' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  verifyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: BSColors.orange, borderRadius: 12, paddingVertical: 15, paddingHorizontal: 48,
    marginBottom: 16, shadowColor: BSColors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  verifyBtnDisabled: { opacity: 0.45 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: { marginTop: 4 },
  resendText: { color: '#888', fontSize: 14 },
  resendLink: { color: BSColors.orange, fontWeight: '700' },
});