import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BSColors } from '@/constants/theme';

const INIT_CARDS = [
  { id: '1', type: 'Visa Debit', number: '**** **** **** 4521', expiry: '09/27', holder: 'ALEX JOHNSON', color: BSColors.orange, frozen: false },
  { id: '2', type: 'Mastercard Credit', number: '**** **** **** 8834', expiry: '03/26', holder: 'ALEX JOHNSON', color: '#1A1A2E', frozen: false },
];

export default function CardsScreen() {
  const [cards, setCards] = useState(INIT_CARDS);
  const [activeCard, setActiveCard] = useState('1');
  const card = cards.find(c => c.id === activeCard)!;
  const toggleFreeze = (id: string) => setCards(prev => prev.map(c => c.id === id ? { ...c, frozen: !c.frozen } : c));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Cards</Text>
        <Text style={styles.pageSubtitle}>Manage your payment cards</Text>

        <View style={styles.tabRow}>
          {cards.map(c => (
            <TouchableOpacity key={c.id} style={[styles.tab, activeCard === c.id && styles.tabActive]} onPress={() => setActiveCard(c.id)}>
              <Text style={[styles.tabText, activeCard === c.id && styles.tabTextActive]}>{c.type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.cardVisual, { backgroundColor: card.color }]}>
          {card.frozen && (
            <View style={styles.frozenOverlay}>
              <Ionicons name="snow-outline" size={36} color="#fff" />
              <Text style={styles.frozenLabel}>Card Frozen</Text>
            </View>
          )}
          <View style={styles.cardTopRow}>
            <Ionicons name="hardware-chip-outline" size={28} color="rgba(255,255,255,0.6)" />
            <Text style={styles.cardNetwork}>{card.type.split(' ')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.cardNumber}>{card.number}</Text>
          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
              <Text style={styles.cardFieldValue}>{card.holder}</Text>
            </View>
            <View>
              <Text style={styles.cardFieldLabel}>EXPIRES</Text>
              <Text style={styles.cardFieldValue}>{card.expiry}</Text>
            </View>
          </View>
        </View>

        <View style={styles.controlCard}>
          <View style={styles.controlRow}>
            <View style={styles.controlLeft}>
              <View style={[styles.controlIcon, { backgroundColor: card.frozen ? '#EFF6FF' : '#FFF8F3' }]}>
                <Ionicons name="snow-outline" size={20} color={card.frozen ? '#3B82F6' : BSColors.orange} />
              </View>
              <View>
                <Text style={styles.controlTitle}>{card.frozen ? 'Card Frozen' : 'Freeze Card'}</Text>
                <Text style={styles.controlSub}>{card.frozen ? 'Tap to unfreeze' : 'Disable all transactions'}</Text>
              </View>
            </View>
            <Switch value={card.frozen} onValueChange={() => toggleFreeze(card.id)}
              trackColor={{ false: '#E0E0E0', true: '#BFDBFE' }} thumbColor={card.frozen ? '#3B82F6' : '#fff'} testID="freeze-toggle" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Card Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { label: 'View PIN', icon: 'keypad-outline', color: '#4F46E5' },
            { label: 'Set Limit', icon: 'speedometer-outline', color: '#059669' },
            { label: 'Block Card', icon: 'ban-outline', color: '#DC2626' },
            { label: 'Statements', icon: 'document-text-outline', color: '#D97706' },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32 },
  pageTitle: { color: '#111', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageSubtitle: { color: '#888', fontSize: 14, marginBottom: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: BSColors.orange },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  cardVisual: { borderRadius: 20, padding: 24, marginBottom: 20, minHeight: 190, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, overflow: 'hidden', justifyContent: 'space-between' },
  frozenOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(59,130,246,0.3)', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 1 },
  frozenLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  cardNetwork: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  cardNumber: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 3, marginBottom: 24 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardFieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 1, marginBottom: 2 },
  cardFieldValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  controlCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  controlIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  controlTitle: { color: '#111', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  controlSub: { color: '#888', fontSize: 12 },
  sectionTitle: { color: '#111', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#333', fontSize: 13, fontWeight: '600' },
});