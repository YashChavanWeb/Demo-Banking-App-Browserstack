import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { BSColors } from '@/constants/theme';
import { AuthStore } from '@/store/auth';

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const autoFillNewUser = () => {
    setFullName('Alex Johnson');
    setEmail('alex.johnson@example.com');
    setPassword('SecurePass@123');
    setConfirmPassword('SecurePass@123');
    setError('');
  };

  const handleSignup = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    setError('');
    AuthStore.setRole('user');
    AuthStore.setFlow('signup');
    router.replace('/otp' as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/browserstack-logo.png')} style={styles.logo} contentFit="contain" testID="bs-logo-signup" />
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join BrowserStack today</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input} placeholder="Enter your full name"
            placeholderTextColor="#AAA" value={fullName}
            onChangeText={setFullName} testID="fullname-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input} placeholder="Enter your email"
            placeholderTextColor="#AAA" value={email}
            onChangeText={setEmail} keyboardType="email-address"
            autoCapitalize="none" testID="email-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input} placeholder="Create a password"
            placeholderTextColor="#AAA" value={password}
            onChangeText={setPassword} secureTextEntry testID="password-input"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input} placeholder="Confirm your password"
            placeholderTextColor="#AAA" value={confirmPassword}
            onChangeText={setConfirmPassword} secureTextEntry testID="confirm-password-input"
          />
        </View>

        {error ? <Text style={styles.error} testID="signup-error">{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignup} testID="signup-btn">
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/' as any)} testID="goto-login">
          <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Sign In</Text></Text>
        </TouchableOpacity>

        {/* Mock Data Controller Bar — bottom */}
        <View style={styles.mockBar}>
          <Text style={styles.mockBarTitle}>⚡ Mock Data Controller</Text>
          <TouchableOpacity style={styles.mockBtn} onPress={autoFillNewUser} testID="autofill-new-user">
            <Text style={styles.mockBtnText}>Auto-fill New User</Text>
          </TouchableOpacity>
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
  mockBtn: { backgroundColor: BSColors.orange, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  mockBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});