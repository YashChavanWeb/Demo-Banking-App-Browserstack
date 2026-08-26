/**
 * Visual Screen — Percy Visual Regression Demo
 * Toggle changes: colors, text values, font sizes, chart bar heights
 * These are subtle diffs caught by Percy pixel comparison, not naked eye
 */

import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const BAR_H = 120;

// ─── Two data states: stable vs percy-diff ────────────────────────────────────
const STATS_STABLE = [
    { label: 'Net Worth',    value: '$42,830', icon: 'trending-up-outline' as const,    up: true,  color: BSColors.successDark, bg: BSColors.successBg },
    { label: 'Monthly Save', value: '$1,700',  icon: 'wallet-outline' as const,         up: true,  color: BSColors.successDark, bg: BSColors.successBg },
    { label: 'Debt Ratio',   value: '18%',     icon: 'alert-circle-outline' as const,   up: false, color: BSColors.errorDark,   bg: BSColors.errorBg },
    { label: 'Credit Score', value: '742',     icon: 'star-outline' as const,           up: true,  color: BSColors.infoDark,    bg: BSColors.infoBg },
];
const STATS_PERCY = [
    { label: 'Net Worth',    value: '$43,210', icon: 'trending-up-outline' as const,    up: true,  color: BSColors.successDark, bg: BSColors.successBgLight },
    { label: 'Monthly Save', value: '$1,850',  icon: 'wallet-outline' as const,         up: true,  color: BSColors.successDark, bg: BSColors.successBgLight },
    { label: 'Debt Ratio',   value: '21%',     icon: 'alert-circle-outline' as const,   up: false, color: BSColors.warningDark, bg: BSColors.warningBg },
    { label: 'Credit Score', value: '756',     icon: 'star-outline' as const,           up: true,  color: BSColors.infoDeep,    bg: BSColors.infoBg },
];

const MONTHLY_STABLE = [
    { month: 'Jul', income: 3200, expense: 2100 },
    { month: 'Aug', income: 3800, expense: 2400 },
    { month: 'Sep', income: 3500, expense: 1900 },
    { month: 'Oct', income: 4200, expense: 2800 },
    { month: 'Nov', income: 3900, expense: 2200 },
    { month: 'Dec', income: 4800, expense: 3100 },
];
// Percy: only Aug and Oct bars change height
const MONTHLY_PERCY = [
    { month: 'Jul', income: 3200, expense: 2100 },
    { month: 'Aug', income: 4400, expense: 2800 },  // changed
    { month: 'Sep', income: 3500, expense: 1900 },
    { month: 'Oct', income: 3600, expense: 2200 },  // changed
    { month: 'Nov', income: 3900, expense: 2200 },
    { month: 'Dec', income: 4800, expense: 3100 },
];

const CATEGORIES_STABLE = [
    { label: 'Housing',   pct: 32, color: '#6366F1' },
    { label: 'Food',      pct: 22, color: '#059669' },
    { label: 'Transport', pct: 15, color: '#D97706' },
    { label: 'Health',    pct: 12, color: '#DC2626' },
    { label: 'Savings',   pct: 11, color: '#0891B2' },
    { label: 'Other',     pct: 8,  color: '#7C3AED' },
];
// Percy: swap Housing↔Food colors, swap Transport↔Health colors
const CATEGORIES_PERCY = [
    { label: 'Housing',   pct: 32, color: '#059669' },  // swapped with Food
    { label: 'Food',      pct: 22, color: '#6366F1' },  // swapped with Housing
    { label: 'Transport', pct: 15, color: '#DC2626' },  // swapped with Health
    { label: 'Health',    pct: 12, color: '#D97706' },  // swapped with Transport
    { label: 'Savings',   pct: 11, color: '#0891B2' },
    { label: 'Other',     pct: 8,  color: '#7C3AED' },
];

export default function VisualScreen() {
    const router = useRouter();
    const { primaryColor, primaryBg, primaryBorder } = useTheme();

    const mountAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(mountAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, [mountAnim]);

    const [percyMode, setPercyMode] = useState(false);

    const stats    = percyMode ? STATS_PERCY    : STATS_STABLE;
    const monthly  = percyMode ? MONTHLY_PERCY  : MONTHLY_STABLE;
    const cats     = percyMode ? CATEGORIES_PERCY : CATEGORIES_STABLE;
    const maxVal   = Math.max(...monthly.map(m => Math.max(m.income, m.expense)));

    // Only the "Debt Ratio" card (index 2) gets 2x font size when percy mode is ON
    const debtFontSize = percyMode ? 36 : 20;

    const renderBarChart = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Income vs Expenses</Text>
                <View style={styles.legend}>
                    <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
                    <Text style={styles.legendText}>Income</Text>
                    <View style={[styles.legendDot, { backgroundColor: BSColors.errorDark }]} />
                    <Text style={styles.legendText}>Expense</Text>
                </View>
            </View>
            <View style={styles.barChart}>
                {monthly.map((m) => {
                    const incH = (m.income / maxVal) * BAR_H;
                    const expH = (m.expense / maxVal) * BAR_H;
                    return (
                        <View key={m.month} style={styles.barGroup}>
                            <View style={styles.barPair}>
                                <View style={[styles.bar, { height: incH, backgroundColor: primaryColor, marginRight: 2 }]} />
                                <View style={[styles.bar, { height: expH, backgroundColor: BSColors.errorDark }]} />
                            </View>
                            <Text style={styles.barLabel}>{m.month}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );

    const renderPieChart = () => {
        let cumulative = 0;
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Spending Breakdown</Text>
                <View style={styles.pieRow}>
                    <View style={styles.pieContainer}>
                        {cats.map((cat) => {
                            const deg = (cat.pct / 100) * 360;
                            const rotation = cumulative;
                            cumulative += deg;
                            return (
                                <View
                                    key={cat.label}
                                    style={[
                                        styles.pieSlice,
                                        {
                                            borderTopColor: cat.color,
                                            borderRightColor: cat.pct > 25 ? cat.color : 'transparent',
                                            transform: [{ rotate: `${rotation}deg` }],
                                        },
                                    ]}
                                />
                            );
                        })}
                        <View style={styles.pieHole}>
                            <Text style={styles.pieHoleText}>Spend</Text>
                        </View>
                    </View>
                    <View style={styles.pieLegend}>
                        {cats.map(cat => (
                            <View key={cat.label} style={styles.pieLegendRow}>
                                <View style={[styles.pieLegendDot, { backgroundColor: cat.color }]} />
                                <Text style={styles.pieLegendLabel}>{cat.label}</Text>
                                <Text style={[styles.pieLegendPct, { color: cat.color }]}>{cat.pct}%</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    const renderLineChart = () => {
        const points = monthly.map((m, i) => ({
            x: (i / (monthly.length - 1)) * (SW - 88),
            y: BAR_H - (m.income / maxVal) * BAR_H,
        }));
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Income Trend</Text>
                <View style={styles.lineChart}>
                    {points.map((p, i) => (
                        <View key={i} style={[styles.linePoint, { left: p.x, top: p.y, backgroundColor: primaryColor }]}>
                            {i > 0 && (
                                <View style={[styles.lineSegment, {
                                    width: Math.sqrt(Math.pow(p.x - points[i - 1].x, 2) + Math.pow(p.y - points[i - 1].y, 2)),
                                    backgroundColor: primaryColor + '60',
                                    transform: [{ rotate: `${Math.atan2(p.y - points[i - 1].y, p.x - points[i - 1].x) * 180 / Math.PI}deg` }],
                                    left: -(Math.sqrt(Math.pow(p.x - points[i - 1].x, 2) + Math.pow(p.y - points[i - 1].y, 2))),
                                    top: 3,
                                }]} />
                            )}
                        </View>
                    ))}
                    {monthly.map((m, i) => (
                        <Text key={m.month} style={[styles.lineLabel, { left: points[i].x - 10 }]}>{m.month}</Text>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={[styles.flex, {
                opacity: mountAnim,
                transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
                        <Ionicons name="arrow-back" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.pageTitle}>Visual Dashboard</Text>
                        <Text style={styles.pageSubtitle}>App Percy · Visual Regression</Text>
                    </View>
                    <View style={styles.percyToggleWrap}>
                        <Text style={[styles.percyToggleLabel, { color: percyMode ? BSColors.warningDark : BSColors.slate300 }]}>Percy</Text>
                        <Switch
                            value={percyMode}
                            onValueChange={setPercyMode}
                            trackColor={{ false: BSColors.mediumGray, true: BSColors.warningDark }}
                            thumbColor={percyMode ? '#F59E0B' : BSColors.white}
                            accessibilityLabel="Toggle Percy visual diff mode"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {/* Stats grid */}
                    <View style={styles.statsGrid}>
                        {stats.map((s) => (
                            <View key={s.label} style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                                    <Ionicons name={s.icon} size={18} color={s.color} />
                                </View>
                                <Text style={[styles.statValue, { fontSize: s.label === 'Debt Ratio' ? debtFontSize : 20, color: s.color }]}>{s.value}</Text>
                                <Text style={styles.statLabel}>{s.label}</Text>
                                <View style={[styles.statBadge, { backgroundColor: s.bg }]}>
                                    <Ionicons name={s.up ? 'arrow-up' : 'arrow-down'} size={10} color={s.color} />
                                    <Text style={[styles.statBadgeText, { color: s.color }]}>
                                        {s.up ? 'Good' : 'Watch'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {renderBarChart()}
                    {renderLineChart()}
                    {renderPieChart()}
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BSColors.bgPage },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray, backgroundColor: BSColors.white },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 15, fontWeight: '800', color: BSColors.textPrimary },
    pageSubtitle: { fontSize: 10, color: BSColors.slate300, marginTop: 1 },
    percyToggleWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    percyToggleLabel: { fontSize: 11, fontWeight: '700' },
    content: { padding: 20, gap: 16, paddingBottom: 40 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { width: (SW - 50) / 2, backgroundColor: BSColors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontWeight: '800', color: BSColors.textPrimary, marginBottom: 2 },
    statLabel: { fontSize: 11, color: BSColors.darkGray, marginBottom: 6 },
    statBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
    statBadgeText: { fontSize: 10, fontWeight: '700' },

    card: { backgroundColor: BSColors.white, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: BSColors.textPrimary },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: BSColors.darkGray },

    barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: BAR_H + 20 },
    barGroup: { alignItems: 'center', flex: 1 },
    barPair: { flexDirection: 'row', alignItems: 'flex-end' },
    bar: { width: 10, borderRadius: 4 },
    barLabel: { fontSize: 9, color: BSColors.darkGray, marginTop: 4 },

    lineChart: { height: BAR_H + 20, position: 'relative', marginHorizontal: 4 },
    linePoint: { position: 'absolute', width: 8, height: 8, borderRadius: 4, marginLeft: -4, marginTop: -4 },
    lineSegment: { position: 'absolute', height: 2, transformOrigin: 'left center' },
    lineLabel: { position: 'absolute', bottom: 0, fontSize: 9, color: BSColors.darkGray },

    pieRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
    pieContainer: { width: 120, height: 120, borderRadius: 60, position: 'relative', overflow: 'hidden' },
    pieSlice: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 60, borderColor: 'transparent' },
    pieHole: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: BSColors.white, top: 30, left: 30, alignItems: 'center', justifyContent: 'center' },
    pieHoleText: { fontSize: 10, fontWeight: '800', color: BSColors.textPrimary },
    pieLegend: { flex: 1, gap: 6 },
    pieLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pieLegendDot: { width: 8, height: 8, borderRadius: 4 },
    pieLegendLabel: { flex: 1, fontSize: 11, color: BSColors.textPrimary },
    pieLegendPct: { fontSize: 11, fontWeight: '700' },
});
