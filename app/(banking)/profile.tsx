import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BSColors } from '@/constants/theme';

const USER = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  accountNumber: 'ACC-00482-7731',
  accountType: 'Premium Savings',
  memberSince: 'January 2021',
  phone: '+1 (555) 234-5678',
};

const MENU_ITEMS = [
  { label: 'Security Settings', icon: 'shield-checkmark-outline', color: '#4F46E5' },
  { label: 'Notifications', icon: 'notifications-outline', color: '#059669' },
  { label: 'Linked Accounts', icon: 'link-outline', color: '#D97706' },
  { label: 'Help & Support', icon: 'help-circle-outline', color: '#0891B2' },
  { label: 'Privacy Policy', icon: 'document-text-outline', color: '#6B7280' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar + name */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AJ</Text>
          </View>
          <Text style={styles.userName}>{USER.name}</Text>
          <Text style={styles.userEmail}>{USER.email}</Text>
          <View style={styles.badge}>
            <Ionicons name="star" size={12} color={BSColors.orange} />
            <Text style={styles.badgeText}>Premium Member</Text>
          </View>
        </View>

        {/* Account details */}
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.detailCard}>
          {[
            { label: 'Account Number', value: USER.accountNumber, icon: 'card-outline' },
            { label: 'Account Type', value: USER.accountType, icon: 'wallet-outline' },
            { label: 'Phone', value: USER.phone, icon: 'call-outline' },
            { label: 'Member Since', value: USER.memberSince, icon: 'calendar-outline' },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.detailRow, i < arr.length - 1 && styles.detailBorder]}>
              <View style={styles.detailIcon}>
                <Ionicons name={item.icon as any} size={18} color={BSColors.orange} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/' as any)} testID="logout-btn">
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  pageTitle: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  avatarCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: BSColors.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  userName: { color: '#111', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: '#888', fontSize: 14, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8F3', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: BSColors.orange + '40' },
  badgeText: { color: BSColors.orange, fontSize: 12, fontWeight: '600' },
  sectionTitle: { color: '#111', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  detailCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF8F3', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailInfo: { flex: 1 },
  detailLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  detailValue: { color: '#111', fontSize: 14, fontWeight: '600' },
  menuCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuLabel: { flex: 1, color: '#333', fontSize: 14, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
});