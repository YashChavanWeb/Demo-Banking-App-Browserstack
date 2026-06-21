import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform,
} from 'react-native';
import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';

type PasswordOption = 'valid' | 'admin' | 'wrong' | '';

const PASSWORD_OPTIONS = [
  { label: 'Normal User', value: 'valid' as const },
  { label: 'Admin', value: 'admin' as const },
  { label: 'Incorrect Password', value: 'wrong' as const },
];

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState<PasswordOption>('');
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const autoFillRegular = () => { setEmail('user@example.com'); setPassword('valid'); setError(''); setDropdownOpen(false); };
  const autoFillAdmin = () => { setEmail('admin@browserstack.com'); setPassword('admin'); setError(''); setDropdownOpen(false); };
  const autoFillIncorrect = () => { setEmail('user@example.com'); setPassword('wrong'); setError(''); setDropdownOpen(false); };

  const handleLogin = () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (password === 'wrong') { setError('Invalid credentials. Please try again.'); return; }
    setError('');
    AuthStore.setRole(password === 'admin' ? 'admin' : 'user');
    AuthStore.setFlow('login');
    router.replace('/otp' as any);
  };

  const selectedLabel = PASSWORD_OPTIONS.find(o => o.value === password)?.label || '';

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
            placeholderTextColor="#AAA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            testID="email-input"
          />
        </View>

        {/* Password Dropdown */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)} testID="password-dropdown">
            <Text style={[styles.dropdownText, !password && styles.placeholder]}>
              {selectedLabel || 'Select password type'}
            </Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {PASSWORD_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownItem, password === opt.value && styles.dropdownItemSelected]}
                  onPress={() => { setPassword(opt.value); setDropdownOpen(false); }}
                  testID={`password-option-${opt.value}`}
                >
                  <Text style={[styles.dropdownItemText, password === opt.value && styles.dropdownItemTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.error} testID="login-error">{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} testID="login-btn">
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/signup' as any)} testID="goto-signup">
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Sign Up</Text></Text>
        </TouchableOpacity>

        {/* Mock Data Controller Bar — bottom */}
        <View style={styles.mockBar}>
          <Text style={styles.mockBarTitle}>⚡ Mock Data Controller</Text>
          <View style={styles.mockButtons}>
            <TouchableOpacity style={styles.mockBtn} onPress={autoFillRegular} testID="autofill-regular">
              <Text style={styles.mockBtnText}>Regular User</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mockBtn} onPress={autoFillAdmin} testID="autofill-admin">
              <Text style={styles.mockBtnText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mockBtn, styles.mockBtnWrong]} onPress={autoFillIncorrect} testID="autofill-incorrect">
              <Text style={styles.mockBtnText}>Wrong Login</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 28, paddingTop: 48, paddingBottom: 32 },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 200, height: 54 },
  title: { color: '#111', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 36 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#111',
  },
  dropdown: {
    backgroundColor: '#F7F7F7', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dropdownText: { fontSize: 15, color: '#111' },
  placeholder: { color: '#AAA' },
  dropdownArrow: { color: '#888', fontSize: 12 },
  dropdownMenu: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', marginTop: 4, overflow: 'hidden',
    ...(Platform.OS === 'web' ? { zIndex: 999 } : {}),
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemSelected: { backgroundColor: BSColors.orange },
  dropdownItemText: { fontSize: 15, color: '#111' },
  dropdownItemTextSelected: { color: '#fff', fontWeight: '600' },
  error: { color: '#D32F2F', fontSize: 13, marginBottom: 14, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: BSColors.orange, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginBottom: 20, marginTop: 8,
    shadowColor: BSColors.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { marginBottom: 36 },
  linkText: { color: '#666', textAlign: 'center', fontSize: 14 },
  link: { color: BSColors.orange, fontWeight: '700' },
  mockBar: {
    backgroundColor: '#FFF8F3', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: BSColors.orange, marginTop: 8,
  },
  mockBarTitle: { color: BSColors.orange, fontWeight: '700', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  mockButtons: { flexDirection: 'row', gap: 8 },
  mockBtn: { flex: 1, backgroundColor: BSColors.orange, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  mockBtnWrong: { backgroundColor: '#888' },
  mockBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});