/**
 * TransactionAuthModal
 * Two-step transaction authentication: PIN (1234) → Biometric
 * Usage:
 *   <TransactionAuthModal
 *     visible={showAuth}
 *     amount="$50.00"
 *     onSuccess={() => { setShowAuth(false); proceedWithTransaction(); }}
 *     onCancel={() => setShowAuth(false)}
 *   />
 */
import { BSColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CORRECT_PIN = '1234';

type Step = 'pin' | 'biometric' | 'success' | 'failed';

interface Props {
  visible: boolean;
  amount?: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionAuthModal({ visible, amount, description, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [bioLoading, setBioLoading] = useState(false);
  const [failReason, setFailReason] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('pin');
      setPin('');
      setPinError('');
      setFailReason('');
      setBioLoading(false);
    }
  }, [visible]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePinKey = (key: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    setPinError('');
    if (newPin.length === 4) {
      // Auto-validate after 4 digits
      setTimeout(() => validatePin(newPin), 150);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError('');
  };

  const validatePin = (enteredPin: string) => {
    if (enteredPin === CORRECT_PIN) {
      setStep('biometric');
      // Auto-trigger biometric after short delay
      setTimeout(() => triggerBiometric(), 400);
    } else {
      shake();
      setPinError('Incorrect PIN. Transaction blocked.');
      setPin('');
      setTimeout(() => {
        setFailReason('Incorrect PIN entered. Transaction could not be completed.');
        setStep('failed');
      }, 800);
    }
  };

  const triggerBiometric = async () => {
    setBioLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // No biometric hardware/enrollment — auto-pass for demo
        setBioLoading(false);
        setStep('success');
        setTimeout(() => onSuccess(), 600);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm transaction with biometrics',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      setBioLoading(false);
      if (result.success) {
        setStep('success');
        setTimeout(() => onSuccess(), 600);
      } else {
        const reason = result.error === 'user_cancel' ? 'Biometric authentication was cancelled.' : 'Biometric authentication failed.';
        setFailReason(`${reason} Transaction could not be completed.`);
        setStep('failed');
      }
    } catch {
      setBioLoading(false);
      setFailReason('Biometric authentication failed. Transaction could not be completed.');
      setStep('failed');
    }
  };

  const handleRetry = () => {
    setStep('pin');
    setPin('');
    setPinError('');
    setFailReason('');
    setBioLoading(false);
  };

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerIcon}>
              <Ionicons name="shield-checkmark" size={24} color={BSColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Authorize Transaction</Text>
              {amount && <Text style={s.headerAmount}>{amount}{description ? ` · ${description}` : ''}</Text>}
            </View>
            <TouchableOpacity onPress={onCancel} testID="auth-cancel-btn">
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Step indicator */}
          <View style={s.steps}>
            <View style={[s.stepDot, (step === 'pin' || step === 'biometric' || step === 'success') && s.stepDotActive]}>
              <Text style={s.stepDotText}>1</Text>
            </View>
            <View style={[s.stepLine, (step === 'biometric' || step === 'success') && s.stepLineActive]} />
            <View style={[s.stepDot, (step === 'biometric' || step === 'success') && s.stepDotActive]}>
              <Text style={s.stepDotText}>2</Text>
            </View>
          </View>
          <View style={s.stepLabels}>
            <Text style={s.stepLabel}>PIN</Text>
            <Text style={s.stepLabel}>Biometric</Text>
          </View>

          {/* PIN step */}
          {step === 'pin' && (
            <View style={s.body}>
              <Text style={s.stepTitle}>Enter Transaction PIN</Text>
              <Text style={s.stepSub}>Enter your 4-digit PIN to authorize</Text>
              <Animated.View style={[s.pinDots, { transform: [{ translateX: shakeAnim }] }]}>
                {[0,1,2,3].map(i => (
                  <View key={i} style={[s.pinDot, pin.length > i && s.pinDotFilled]} />
                ))}
              </Animated.View>
              {pinError ? <Text style={s.errorText} testID="pin-error">{pinError}</Text> : null}
              <View style={s.keypad}>
                {KEYS.map((key, idx) => (
                  key === '' ? <View key={idx} style={s.keyEmpty} /> :
                  key === '⌫' ? (
                    <TouchableOpacity key={idx} style={s.keyBtn} onPress={handlePinDelete} testID="pin-delete">
                      <Ionicons name="backspace-outline" size={22} color="#334155" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity key={idx} style={s.keyBtn} onPress={() => handlePinKey(key)} testID={`pin-key-${key}`}>
                      <Text style={s.keyText}>{key}</Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            </View>
          )}

          {/* Biometric step */}
          {step === 'biometric' && (
            <View style={s.body}>
              <Text style={s.stepTitle}>Biometric Verification</Text>
              <Text style={s.stepSub}>Confirm your identity to complete the transaction</Text>
              <View style={s.bioCircle}>
                {bioLoading
                  ? <ActivityIndicator size="large" color={BSColors.primary} />
                  : <Ionicons name="finger-print-outline" size={56} color={BSColors.primary} />}
              </View>
              <Text style={s.bioHint}>{bioLoading ? 'Waiting for biometric...' : 'Touch the sensor or use Face ID'}</Text>
              {!bioLoading && (
                <TouchableOpacity style={s.bioRetryBtn} onPress={triggerBiometric} testID="bio-retry-btn">
                  <Text style={s.bioRetryText}>Try Again</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Success step */}
          {step === 'success' && (
            <View style={s.body}>
              <View style={s.successCircle}>
                <Ionicons name="checkmark-circle" size={72} color="#059669" />
              </View>
              <Text style={s.successTitle}>Authorized!</Text>
              <Text style={s.successSub}>Processing your transaction...</Text>
            </View>
          )}

          {/* Failed step */}
          {step === 'failed' && (
            <View style={s.body}>
              <View style={s.failCircle}>
                <Ionicons name="close-circle" size={72} color="#DC2626" />
              </View>
              <Text style={s.failTitle}>Transaction Failed</Text>
              <Text style={s.failSub} testID="auth-fail-reason">{failReason}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={handleRetry} testID="auth-retry-btn">
                <Ionicons name="refresh-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={s.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={onCancel} testID="auth-cancel-final-btn">
                <Text style={s.cancelBtnText}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800' },
  headerAmount: { color: '#64748B', fontSize: 13, marginTop: 2 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingHorizontal: 60, gap: 0 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: BSColors.primary },
  stepDotText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: BSColors.primary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 52, marginTop: 6, marginBottom: 4 },
  stepLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  body: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 20 },
  stepTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  stepSub: { color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  pinDots: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C7D2FE', backgroundColor: '#fff' },
  pinDotFilled: { backgroundColor: BSColors.primary, borderColor: BSColors.primary },
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12, justifyContent: 'center', marginTop: 8 },
  keyBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  keyEmpty: { width: 64, height: 64 },
  keyText: { color: '#0F172A', fontSize: 22, fontWeight: '600' },
  bioCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bioHint: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  bioRetryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#EEF2FF' },
  bioRetryText: { color: BSColors.primary, fontSize: 14, fontWeight: '700' },
  successCircle: { marginBottom: 16, marginTop: 8 },
  successTitle: { color: '#059669', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  successSub: { color: '#64748B', fontSize: 14 },
  failCircle: { marginBottom: 16, marginTop: 8 },
  failTitle: { color: '#DC2626', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  failSub: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginBottom: 12 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 10 },
  cancelBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});