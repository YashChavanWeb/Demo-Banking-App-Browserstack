import { BSColors } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width = '100%', height = 16, borderRadius = 8, style }: ShimmerProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Preset shimmer layouts
export function CardShimmer() {
  return (
    <View style={styles.cardShimmer}>
      <Shimmer height={180} borderRadius={20} />
    </View>
  );
}

export function RecipientShimmer() {
  return (
    <View style={styles.recipientShimmer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.recipientRow}>
          <Shimmer width={44} height={44} borderRadius={22} />
          <View style={styles.recipientText}>
            <Shimmer width="60%" height={14} borderRadius={7} style={{ marginBottom: 6 }} />
            <Shimmer width="40%" height={11} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TransactionShimmer() {
  return (
    <View style={styles.txShimmer}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={styles.txRow}>
          <Shimmer width={40} height={40} borderRadius={12} />
          <View style={styles.txText}>
            <Shimmer width="55%" height={14} borderRadius={7} style={{ marginBottom: 6 }} />
            <Shimmer width="35%" height={11} borderRadius={6} />
          </View>
          <Shimmer width={60} height={14} borderRadius={7} />
        </View>
      ))}
    </View>
  );
}

export function CurrencyShimmer() {
  return (
    <View style={{ gap: 0 }}>
      {/* Hero card shimmer */}
      <View style={{ borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, backgroundColor: BSColors.indigoLight }}>
        <Shimmer width={64} height={64} borderRadius={32} style={{ marginBottom: 12 }} />
        <Shimmer width="40%" height={36} borderRadius={10} style={{ marginBottom: 8 }} />
        <Shimmer width="55%" height={16} borderRadius={8} style={{ marginBottom: 20 }} />
        <Shimmer width="60%" height={28} borderRadius={14} />
      </View>
      {/* Info rows shimmer */}
      <Shimmer width="35%" height={14} borderRadius={7} style={{ marginBottom: 12 }} />
      <View style={{ backgroundColor: BSColors.white, borderRadius: 18, overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: i < 7 ? 1 : 0, borderBottomColor: BSColors.lightGray }}>
            <Shimmer width={36} height={36} borderRadius={10} />
            <View style={{ flex: 1, gap: 6 }}>
              <Shimmer width="30%" height={11} borderRadius={6} />
              <Shimmer width="60%" height={14} borderRadius={7} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function BalanceShimmer() {
  return (
    <View style={styles.balanceShimmer}>
      <Shimmer width="50%" height={14} borderRadius={7} style={{ marginBottom: 12 }} />
      <Shimmer width="70%" height={36} borderRadius={10} style={{ marginBottom: 20 }} />
      <View style={styles.balanceRow}>
        <Shimmer width="40%" height={12} borderRadius={6} />
        <Shimmer width="40%" height={12} borderRadius={6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: { backgroundColor: BSColors.indigoBorder },
  cardShimmer: { marginBottom: 16 },
  recipientShimmer: { gap: 10, marginBottom: 24 },
  recipientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.white, borderRadius: 14, padding: 14, gap: 12 },
  recipientText: { flex: 1 },
  txShimmer: { backgroundColor: BSColors.white, borderRadius: 16, overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: BSColors.lightGray },
  txText: { flex: 1 },
  balanceShimmer: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
});