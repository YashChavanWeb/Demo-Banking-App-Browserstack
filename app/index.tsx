import { BSColors } from '@/constants/theme';
import { api } from '@/store/api';
import { AuthStore } from '@/store/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const autoFillRegular = () => { setEmail('yash@gmail.com'); setPassword('12345678'); setError(''); };
  const autoFillWrong = () => { setEmail('yash@gmail.com'); setPassword('wrongpass'); setError(''); };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      await AuthStore.setToken(res.token);
      AuthStore.setUser(res.user);
      AuthStore.setRole(res.user.role as any);
      AuthStore.setFlow('login');
      AuthStore.setEmail(email);
      router.replace('/otp' as any);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/browserstack-logo.png')} style={styles.logo} contentFit="contain" testID="bs-logo" />
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={v => { setEmail(v); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
              secureTextEntry={!showPassword}
              testID="password-input"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(s => !s)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? <Text style={styles.error} testID="login-error">{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          testID="login-btn"
        >
          {loading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : null}
          <Text style={styles.primaryBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/signup' as any)} testID="goto-signup">
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Sign Up</Text></Text>
        </TouchableOpacity>

        {/* Mock Data Controller Bar */}
        <View style={styles.mockBar}>
          <Text style={styles.mockBarTitle}>⚡ Mock Data Controller</Text>
          <View style={styles.mockButtons}>
            <TouchableOpacity style={styles.mockBtn} onPress={autoFillRegular} testID="autofill-regular">
              <Text style={styles.mockBtnText}>Regular User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mockBtn, styles.mockBtnWrong]} onPress={autoFillWrong} testID="autofill-incorrect">
              <Text style={styles.mockBtnText}>Wrong Login</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  content: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 32 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 200, height: 54 },
  title: { color: '#0F172A', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#64748B', fontSize: 15, textAlign: 'center', marginBottom: 36 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#334155', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#C7D2FE', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#0F172A',
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#C7D2FE',
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A',
  },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  eyeIcon: { fontSize: 16 },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 14, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: BSColors.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginBottom: 20, marginTop: 8,
    shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { marginBottom: 36 },
  linkText: { color: '#64748B', textAlign: 'center', fontSize: 14 },
  link: { color: BSColors.primary, fontWeight: '700' },
  mockBar: {
    backgroundColor: '#EEF2FF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#C7D2FE', marginTop: 8,
  },
  mockBarTitle: { color: BSColors.primary, fontWeight: '700', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  mockButtons: { flexDirection: 'row', gap: 8 },
  mockBtn: { flex: 1, backgroundColor: BSColors.primary, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  mockBtnWrong: { backgroundColor: '#94A3B8' },
  mockBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});