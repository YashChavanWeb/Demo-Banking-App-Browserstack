import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';

type Control = { id: string; label: string; description: string; icon: string; iconColor: string; value: boolean; danger?: boolean };

const INIT_CONTROLS: Control[] = [
  { id: 'maintenance', label: 'Maintenance Mode', description: 'Temporarily disable app access for all users', icon: 'construct-outline', iconColor: '#D97706', value: false, danger: true },
  { id: 'signups', label: 'Disable New Signups', description: 'Prevent new user registrations', icon: 'person-add-outline', iconColor: '#DC2626', value: false, danger: true },
  { id: 'transfers', label: 'Freeze All Transfers', description: 'Block all money transfers system-wide', icon: 'ban-outline', iconColor: '#DC2626', value: false, danger: true },
  { id: 'notifications', label: 'Push Notifications', description: 'Send system-wide push notifications', icon: 'notifications-outline', iconColor: '#4F46E5', value: true },
  { id: 'twofa', label: 'Enforce 2FA', description: 'Require two-factor auth for all logins', icon: 'shield-checkmark-outline', iconColor: '#059669', value: true },
  { id: 'audit', label: 'Audit Logging', description: 'Log all admin actions for compliance', icon: 'document-text-outline', iconColor: '#0891B2', value: true },
];

export default function ControlsTab() {
  const [controls, setControls] = useState<Control[]>(INIT_CONTROLS);

  const toggle = (id: string, current: boolean, label: string, danger?: boolean) => {
    if (danger && !current) {
      Alert.alert('Warning', `Enabling "${label}" will affect all users. Are you sure?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', style: 'destructive', onPress: () => setControls(p => p.map(c => c.id === id ? { ...c, value: true } : c)) },
      ]);
    } else {
      setControls(p => p.map(c => c.id === id ? { ...c, value: !c.value } : c));
    }
  };

  const activeCount = controls.filter(c => c.value).length;
  const dangerCount = controls.filter(c => c.danger && c.value).length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>System Controls</Text>
          <Text style={s.headerSub}>{activeCount} active · {dangerCount} critical enabled</Text>
        </View>
        {dangerCount > 0 && (
          <View style={s.alertBadge}>
            <Ionicons name="warning-outline" size={14} color="#DC2626" />
            <Text style={s.alertBadgeText}>{dangerCount} Critical</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {dangerCount > 0 && (
          <View style={s.warningBanner}>
            <Ionicons name="warning" size={18} color="#DC2626" />
            <Text style={s.warningText}>{dangerCount} critical system control{dangerCount > 1 ? 's are' : ' is'} currently active. This may affect all users.</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Critical Controls</Text>
        <View style={s.controlGroup}>
          {controls.filter(c => c.danger).map((ctrl, i, arr) => (
            <View key={ctrl.id} style={[s.controlRow, i < arr.length - 1 && s.controlBorder]}>
              <View style={[s.controlIcon, { backgroundColor: ctrl.iconColor + '15' }]}>
                <Ionicons name={ctrl.icon as any} size={20} color={ctrl.iconColor} />
              </View>
              <View style={s.controlInfo}>
                <Text style={s.controlLabel}>{ctrl.label}</Text>
                <Text style={s.controlDesc}>{ctrl.description}</Text>
              </View>
              <Switch
                value={ctrl.value}
                onValueChange={() => toggle(ctrl.id, ctrl.value, ctrl.label, ctrl.danger)}
                trackColor={{ false: '#E0E0E0', true: '#FECACA' }}
                thumbColor={ctrl.value ? '#DC2626' : '#fff'}
                testID={`toggle-${ctrl.id}`}
              />
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>General Settings</Text>
        <View style={s.controlGroup}>
          {controls.filter(c => !c.danger).map((ctrl, i, arr) => (
            <View key={ctrl.id} style={[s.controlRow, i < arr.length - 1 && s.controlBorder]}>
              <View style={[s.controlIcon, { backgroundColor: ctrl.iconColor + '15' }]}>
                <Ionicons name={ctrl.icon as any} size={20} color={ctrl.iconColor} />
              </View>
              <View style={s.controlInfo}>
                <Text style={s.controlLabel}>{ctrl.label}</Text>
                <Text style={s.controlDesc}>{ctrl.description}</Text>
              </View>
              <Switch
                value={ctrl.value}
                onValueChange={() => toggle(ctrl.id, ctrl.value, ctrl.label)}
                trackColor={{ false: '#E0E0E0', true: '#BBF7D0' }}
                thumbColor={ctrl.value ? '#059669' : '#fff'}
                testID={`toggle-${ctrl.id}`}
              />
            </View>
          ))}
        </View>

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#0891B2" />
          <Text style={s.infoText}>All changes are applied immediately to the active session. No backend persistence in this prototype.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { color: '#111', fontSize: 17, fontWeight: '700' },
  headerSub: { color: '#888', fontSize: 12, marginTop: 1 },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  alertBadgeText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA' },
  warningText: { flex: 1, color: '#DC2626', fontSize: 13, fontWeight: '500' },
  sectionTitle: { color: '#111', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  controlGroup: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  controlRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  controlBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  controlIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  controlInfo: { flex: 1, marginRight: 8 },
  controlLabel: { color: '#111', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  controlDesc: { color: '#888', fontSize: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#E0F2FE', borderRadius: 12, padding: 14 },
  infoText: { flex: 1, color: '#0369A1', fontSize: 13 },
});