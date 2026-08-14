import { Shimmer } from '@/components/shimmer';
import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/store/api';
import { AuthStore } from '@/store/auth';
import { BankStore } from '@/store/banking';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Self-contained HTML verification page — no server needed
// The "Verify & Return to App" button fires the deep link demobankingapp://verified
const VERIFY_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFF;padding:24px;box-sizing:border-box}
  .card{background:#fff;border-radius:20px;padding:36px 28px;max-width:360px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08);text-align:center}
  .logo{font-size:40px;margin-bottom:16px}
  h1{color:#0F172A;font-size:22px;margin:0 0 8px}
  p{color:#64748B;font-size:14px;line-height:1.6;margin:0 0 28px}
  .badge{display:inline-flex;align-items:center;gap:6px;background:#EEF2FF;color:#4F46E5;border-radius:20px;padding:6px 14px;font-size:12px;font-weight:600;margin-bottom:24px}
  button{background:#4F46E5;color:#fff;border:none;border-radius:12px;padding:16px 32px;font-size:16px;font-weight:700;cursor:pointer;width:100%;transition:opacity 0.2s}
  button:active{opacity:0.8}
  .success{display:none;color:#059669;font-size:18px;font-weight:700;margin-top:20px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🔐</div>
  <h1>Email Verification</h1>
  <p>Click the button below to verify your identity and return to the BrowserStack Bank app automatically.</p>
  <div class="badge">✓ Secure · One-tap verification</div>
  <button onclick="verify()">Verify &amp; Return to App</button>
  <div class="success" id="ok">✅ Verified! Returning to app...</div>
</div>
<script>
function verify(){
  document.getElementById('ok').style.display='block';
  window.location.href='demobankingapp://verified?source=email&ts='+Date.now();
}
</script>
</body>
</html>`;

const DEFAULT_USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+1 (555) 234-5678',
  dob: 'March 15, 1990',
  address: '123 Main Street, San Francisco, CA 94102',
  accountNumber: '****4521',
  accountType: 'Premium Checking',
  memberSince: 'January 2022',
  kycStatus: 'Verified',
};

export default function ProfileScreen() {
  const { primaryColor, primaryBg, primaryBorder, greenMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ deeplink_verified?: string }>();
  const [balance, setBalance] = useState(BankStore.getBalance());
  const [txCount, setTxCount] = useState(BankStore.getTransactions().length);
  const [userInfo, setUserInfo] = useState(DEFAULT_USER);
  const [profileLoading, setProfileLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Handle deep-link return from browser verification
  useEffect(() => {
    if (params.deeplink_verified === '1') {
      setEmailVerified(true);
      Alert.alert('✅ Email Verified', 'Your identity has been verified successfully via the browser.');
    }
  }, [params.deeplink_verified]);

  useEffect(() => {
    const unsub = BankStore.subscribe(() => {
      setBalance(BankStore.getBalance());
      setTxCount(BankStore.getTransactions().length);
    });
    // Load real profile from API
    api.getProfile().then(profile => {
      if (profile) {
        setUserInfo(prev => ({
          ...prev,
          name: profile.fullName || prev.name,
          email: profile.email || prev.email,
          kycStatus: profile.kycStatus === 'verified' ? 'Verified' : 'Pending',
          memberSince: profile.memberSince
            ? new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : prev.memberSince,
        }));
      }
    }).catch(() => { /* use defaults */ }).finally(() => setProfileLoading(false));
    return unsub;
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await AuthStore.logout();
        router.replace('/' as any);
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profileLoading ? (
            <>
              <Shimmer width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
              <Shimmer width={160} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
              <Shimmer width={200} height={14} borderRadius={7} style={{ marginBottom: 10 }} />
              <Shimmer width={100} height={24} borderRadius={12} />
            </>
          ) : (
            <>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInfo.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{userInfo.name}</Text>
              <Text style={styles.userEmail}>{userInfo.email}</Text>
              <View style={styles.kycBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.kycText}>KYC {userInfo.kycStatus}</Text>
              </View>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, greenMode && { flexDirection: "column" }]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{txCount}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          {profileLoading ? (
            [1,2,3,4,5].map(i => (
              <View key={i} style={[styles.infoRow, i === 5 && { borderBottomWidth: 0 }]}>
                <Shimmer width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Shimmer width="30%" height={11} borderRadius={6} />
                  <Shimmer width="65%" height={14} borderRadius={7} />
                </View>
              </View>
            ))
          ) : (
            [
              { icon: 'person-outline', label: 'Full Name', value: userInfo.name },
              { icon: 'mail-outline', label: 'Email', value: userInfo.email },
              { icon: 'call-outline', label: 'Phone', value: userInfo.phone },
              { icon: 'calendar-outline', label: 'Date of Birth', value: userInfo.dob },
              { icon: 'location-outline', label: 'Address', value: userInfo.address },
            ].map((item, i, arr) => (
              <View key={item.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={primaryColor} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Account Info */}
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.infoCard}>
          {profileLoading ? (
            [1,2,3].map(i => (
              <View key={i} style={[styles.infoRow, i === 3 && { borderBottomWidth: 0 }]}>
                <Shimmer width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Shimmer width="30%" height={11} borderRadius={6} />
                  <Shimmer width="55%" height={14} borderRadius={7} />
                </View>
              </View>
            ))
          ) : (
            [
              { icon: 'card-outline', label: 'Account Number', value: userInfo.accountNumber },
              { icon: 'briefcase-outline', label: 'Account Type', value: userInfo.accountType },
              { icon: 'time-outline', label: 'Member Since', value: userInfo.memberSince },
            ].map((item, i, arr) => (
              <View key={item.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={primaryColor} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Market Insights card */}
        <TouchableOpacity
          style={[styles.insightsCard, { backgroundColor: primaryColor }]}
          onPress={() => router.push({ pathname: '/(banking)/webview' as any, params: { url: 'https://finance.yahoo.com/', title: 'Market Insights' } })}
          testID="market-insights-btn"
          activeOpacity={0.85}
        >
          <View style={styles.insightsLeft}>
            <View style={styles.insightsIconWrap}>
              <Ionicons name="trending-up" size={22} color={primaryColor} />
            </View>
            <View>
              <Text style={styles.insightsTitle}>Market Insights</Text>
              <Text style={styles.insightsSub}>Live financial news & markets</Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.infoCard}>
          {[
            { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Notifications', 'Notification settings coming soon.') },
            { icon: 'lock-closed-outline', label: 'Security & Privacy', onPress: () => Alert.alert('Security', 'Security settings coming soon.') },
            { icon: 'newspaper-outline', label: 'Financial News', onPress: () => router.push({ pathname: '/(banking)/webview' as any, params: { url: 'https://www.reuters.com/finance/', title: 'Financial News' } }) },
            { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Support', 'Contact support@browserstackbank.com') },
          ].map((item, i, arr) => (
            <TouchableOpacity key={item.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={item.onPress}>
              <View style={styles.infoIconWrap}>
                <Ionicons name={item.icon as any} size={18} color={primaryColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={primaryBorder} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Verify via Browser — deep-link demo */}
        <TouchableOpacity
          style={[styles.verifyCard, emailVerified && styles.verifyCardDone]}
          onPress={() => {
            const encoded = encodeURIComponent(VERIFY_HTML);
            router.push({
              pathname: '/(banking)/webview' as any,
              params: { url: `data:text/html,${encoded}`, title: 'Email Verification' },
            });
          }}
          testID="verify-browser-btn"
          activeOpacity={0.85}
        >
          <View style={[styles.verifyIcon, { backgroundColor: emailVerified ? '#D1FAE5' : '#EEF2FF' }]}>
            <Ionicons name={emailVerified ? 'checkmark-circle' : 'open-outline'} size={22} color={emailVerified ? '#059669' : primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.verifyTitle, emailVerified && { color: '#059669' }]}>
              {emailVerified ? 'Email Verified ✓' : 'Verify via Browser'}
            </Text>
            <Text style={styles.verifySub}>
              {emailVerified ? 'Identity confirmed via browser deep-link' : 'Opens browser → verify → auto-returns to app'}
            </Text>
          </View>
          {!emailVerified && <Ionicons name="chevron-forward" size={16} color={primaryColor} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} testID="logout-btn">
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BSColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: BSColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  userName: { color: '#0F172A', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: '#64748B', fontSize: 14, marginBottom: 10 },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#BBF7D0' },
  kycText: { color: '#059669', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statCardMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F1F5F9' },
  statValue: { color: BSColors.primary, fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  sectionTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { color: '#94A3B8', fontSize: 11, marginBottom: 2 },
  infoValue: { color: '#0F172A', fontSize: 14, fontWeight: '500' },
  insightsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  insightsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  insightsIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  insightsTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  insightsSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: '#FECACA' },
  logoutText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
  verifyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#C7D2FE' },
  verifyCardDone: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  verifyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verifyTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  verifySub: { color: '#64748B', fontSize: 12 },
});