import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Animated, FlatList, RefreshControl,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DEFAULT_URL = process.env.EXPO_PUBLIC_LOCAL_APP_URL ?? 'http://localhost:5000';
const URL_KEY = 'local_app_server_url';

interface Stock {
    ticker: string; name: string; price: number; change: number;
    changePct: number; volume: string; mktCap: string; sector: string;
}
interface Market { index: string; value: number; change: number; changePct: number; status: string; }
interface Holding { ticker: string; shares: number; avgCost: number; currentPrice: number; value: number; gain: number; gainPct: number; name: string; }
interface Portfolio { totalValue: number; dayGain: number; dayGainPct: number; holdings: Holding[]; }
type Tab = 'market' | 'watchlist' | 'portfolio';

export default function LocalAppScreen() {
    const router = useRouter();
    const { primaryColor, primaryBg, primaryBorder } = useTheme();
    const [tab, setTab] = useState<Tab>('market');
    const [market, setMarket] = useState<Market | null>(null);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [watchlist, setWatchlist] = useState<Stock[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState(DEFAULT_URL);
    const [urlInput, setUrlInput] = useState(DEFAULT_URL);
    const [editingUrl, setEditingUrl] = useState(false);
    const mountAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(mountAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
        AsyncStorage.getItem(URL_KEY).then((saved: string | null) => {
            if (saved) { setServerUrl(saved); setUrlInput(saved); }
        });
    }, [mountAnim]);

    const saveUrl = async (url: string) => {
        const trimmed = url.trim().replace(/\/$/, '');
        setServerUrl(trimmed);
        setUrlInput(trimmed);
        setEditingUrl(false);
        await AsyncStorage.setItem(URL_KEY, trimmed);
    };

    const fetchAll = useCallback(async () => {
        setError(null);
        try {
            const url = await AsyncStorage.getItem(URL_KEY) ?? DEFAULT_URL;
            const [mRes, sRes, wRes, pRes] = await Promise.all([
                fetch(`${url}/api/market`),
                fetch(`${url}/api/stocks`),
                fetch(`${url}/api/watchlist`),
                fetch(`${url}/api/portfolio`),
            ]);
            setMarket(await mRes.json());
            setStocks(await sRes.json());
            setWatchlist(await wRes.json());
            setPortfolio(await pRes.json());
        } catch {
            setError(`Cannot reach server.\nTap the URL below the title to update it.\nMake sure the server is running:\n  cd local-app && npm start`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const onRefresh = () => { setRefreshing(true); fetchAll(); };
    const fmtPrice = (n: number) => `$${n.toFixed(2)}`;
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
    const isUp = (n: number) => n >= 0;

    const ChangeChip = ({ val }: { val: number }) => (
        <View style={[styles.chip, { backgroundColor: isUp(val) ? BSColors.successBg : BSColors.errorBg }]}>
            <Ionicons name={isUp(val) ? 'trending-up' : 'trending-down'} size={11} color={isUp(val) ? BSColors.successDark : BSColors.errorDark} />
            <Text style={[styles.chipText, { color: isUp(val) ? BSColors.successDark : BSColors.errorDark }]}>{fmtPct(val)}</Text>
        </View>
    );

    const StockRow = ({ item }: { item: Stock }) => (
        <View style={styles.stockRow}>
            <View style={[styles.tickerBadge, { backgroundColor: primaryBg, borderColor: primaryBorder }]}>
                <Text style={[styles.tickerText, { color: primaryColor }]}>{item.ticker}</Text>
            </View>
            <View style={styles.stockInfo}>
                <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.stockMeta}>{item.sector} · Vol {item.volume}</Text>
            </View>
            <View style={styles.stockRight}>
                <Text style={styles.stockPrice}>{fmtPrice(item.price)}</Text>
                <ChangeChip val={item.changePct} />
            </View>
        </View>
    );

    const renderMarket = () => (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
            {market && (
                <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
                    <Text style={styles.heroLabel}>{market.index}</Text>
                    <Text style={styles.heroValue}>{market.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                    <View style={styles.heroRow}>
                        <Ionicons name={isUp(market.change) ? 'trending-up' : 'trending-down'} size={16} color="#fff" />
                        <Text style={styles.heroChange}>{market.change >= 0 ? '+' : ''}{market.change.toFixed(2)} ({fmtPct(market.changePct)})</Text>
                        <View style={[styles.statusBadge, { backgroundColor: market.status === 'open' ? BSColors.successBg : BSColors.errorBg }]}>
                            <View style={[styles.statusDot, { backgroundColor: market.status === 'open' ? BSColors.successDark : BSColors.errorDark }]} />
                            <Text style={[styles.statusText, { color: market.status === 'open' ? BSColors.successDark : BSColors.errorDark }]}>{market.status === 'open' ? 'Market Open' : 'Market Closed'}</Text>
                        </View>
                    </View>
                </View>
            )}
            <Text style={styles.sectionTitle}>All Stocks</Text>
            <View style={styles.card}>
                {stocks.map((s, i) => (
                    <View key={s.ticker}>
                        <StockRow item={s} />
                        {i < stocks.length - 1 && <View style={styles.divider} />}
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderWatchlist = () => (
        <FlatList
            data={watchlist}
            keyExtractor={i => i.ticker}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Watchlist</Text>}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            renderItem={({ item }) => (
                <View style={styles.card}>
                    <View style={styles.watchRow}>
                        <View style={[styles.tickerBadgeLg, { backgroundColor: primaryBg, borderColor: primaryBorder }]}>
                            <Text style={[styles.tickerTextLg, { color: primaryColor }]}>{item.ticker}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stockName}>{item.name}</Text>
                            <Text style={styles.stockMeta}>Mkt Cap: {item.mktCap}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={styles.stockPrice}>{fmtPrice(item.price)}</Text>
                            <ChangeChip val={item.changePct} />
                        </View>
                    </View>
                </View>
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
        />
    );

    const renderPortfolio = () => (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
            {portfolio && (
                <>
                    <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
                        <Text style={styles.heroLabel}>Portfolio Value</Text>
                        <Text style={styles.heroValue}>${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        <View style={styles.heroRow}>
                            <Ionicons name={isUp(portfolio.dayGain) ? 'trending-up' : 'trending-down'} size={16} color="#fff" />
                            <Text style={styles.heroChange}>Today {portfolio.dayGain >= 0 ? '+' : ''}${portfolio.dayGain.toFixed(2)} ({fmtPct(portfolio.dayGainPct)})</Text>
                        </View>
                    </View>
                    <Text style={styles.sectionTitle}>Holdings</Text>
                    <View style={styles.card}>
                        {portfolio.holdings.map((h, i) => (
                            <View key={h.ticker}>
                                <View style={styles.holdingRow}>
                                    <View style={[styles.tickerBadge, { backgroundColor: primaryBg, borderColor: primaryBorder }]}>
                                        <Text style={[styles.tickerText, { color: primaryColor }]}>{h.ticker}</Text>
                                    </View>
                                    <View style={styles.stockInfo}>
                                        <Text style={styles.stockName}>{h.name}</Text>
                                        <Text style={styles.stockMeta}>{h.shares} shares · Avg ${h.avgCost.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.stockRight}>
                                        <Text style={styles.stockPrice}>${h.value.toFixed(2)}</Text>
                                        <ChangeChip val={h.gainPct} />
                                    </View>
                                </View>
                                {i < portfolio.holdings.length - 1 && <View style={styles.divider} />}
                            </View>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={{ flex: 1, opacity: mountAnim, transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
                        <Ionicons name="arrow-back" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.pageTitle}>Stocks Dashboard</Text>
                        {editingUrl ? (
                            <View style={styles.urlEditRow}>
                                <TextInput
                                    style={styles.urlInput}
                                    value={urlInput}
                                    onChangeText={setUrlInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                    returnKeyType="done"
                                    onSubmitEditing={() => saveUrl(urlInput)}
                                    placeholder="http://192.168.x.x:5000"
                                    placeholderTextColor={BSColors.slate300}
                                    autoFocus
                                />
                                <TouchableOpacity onPress={() => saveUrl(urlInput)} accessibilityLabel="Save server URL" accessibilityRole="button">
                                    <Ionicons name="checkmark-circle" size={22} color={primaryColor} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingUrl(false)} accessibilityLabel="Cancel URL edit" accessibilityRole="button">
                                    <Ionicons name="close-circle-outline" size={22} color={BSColors.darkGray} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setEditingUrl(true)} style={styles.urlRow} accessibilityLabel={`Server URL: ${serverUrl}. Tap to edit`} accessibilityRole="button">
                                <Text style={styles.pageSubtitle} numberOfLines={1}>{serverUrl}</Text>
                                <Ionicons name="pencil-outline" size={11} color={BSColors.slate300} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity onPress={onRefresh} style={styles.backBtn} accessibilityLabel="Refresh data" accessibilityRole="button">
                        <Ionicons name="refresh-outline" size={20} color={primaryColor} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabs}>
                    {(['market', 'watchlist', 'portfolio'] as Tab[]).map(t => (
                        <TouchableOpacity key={t} style={[styles.tab, tab === t && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]} onPress={() => setTab(t)} accessibilityLabel={t.charAt(0).toUpperCase() + t.slice(1)} accessibilityRole="tab" accessibilityState={{ selected: tab === t }}>
                            <Text style={[styles.tabText, tab === t && { color: primaryColor, fontWeight: '700' }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.body}>
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color={primaryColor} />
                            <Text style={styles.loadingText}>Connecting to {serverUrl}…</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.center}>
                            <Ionicons name="server-outline" size={48} color={BSColors.slate300} />
                            <Text style={styles.errorTitle}>Server Unreachable</Text>
                            <Text style={styles.errorText}>{error}</Text>
                            <View style={styles.errorUrlRow}>
                                <TextInput
                                    style={[styles.errorUrlInput, { borderColor: primaryColor }]}
                                    value={urlInput}
                                    onChangeText={setUrlInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardType="url"
                                    returnKeyType="done"
                                    onSubmitEditing={() => { saveUrl(urlInput); fetchAll(); }}
                                    placeholder="http://192.168.x.x:5000"
                                    placeholderTextColor={BSColors.slate300}
                                    testID="error-url-input"
                                />
                                <TouchableOpacity
                                    style={[styles.retryBtn, { backgroundColor: primaryColor, marginTop: 0 }]}
                                    onPress={() => { saveUrl(urlInput); fetchAll(); }}
                                    testID="retry-btn"
                                >
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            {tab === 'market' && renderMarket()}
                            {tab === 'watchlist' && renderWatchlist()}
                            {tab === 'portfolio' && renderPortfolio()}
                        </>
                    )}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BSColors.bgPage },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
    pageTitle: { color: BSColors.textPrimary, fontSize: 17, fontWeight: '800' },
    urlRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    pageSubtitle: { color: BSColors.slate300, fontSize: 11, fontWeight: '500', flex: 1 },
    urlEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    urlInput: { flex: 1, fontSize: 11, color: BSColors.textPrimary, backgroundColor: BSColors.lightGray, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, height: 28 },
    tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray, marginHorizontal: 20 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
    tabText: { fontSize: 13, color: BSColors.darkGray, fontWeight: '600' },
    body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    heroCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
    heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    heroChange: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    sectionTitle: { color: BSColors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 12 },
    card: { backgroundColor: BSColors.white, borderRadius: 18, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: 16 },
    stockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    holdingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    watchRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    tickerBadge: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tickerText: { fontSize: 12, fontWeight: '800' },
    tickerBadgeLg: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tickerTextLg: { fontSize: 13, fontWeight: '800' },
    stockInfo: { flex: 1 },
    stockName: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
    stockMeta: { color: BSColors.darkGray, fontSize: 11 },
    stockRight: { alignItems: 'flex-end', gap: 4 },
    stockPrice: { color: BSColors.textPrimary, fontSize: 15, fontWeight: '800' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
    chipText: { fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: BSColors.lightGray, marginLeft: 64 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: BSColors.darkGray, fontSize: 14, marginTop: 8 },
    errorTitle: { color: BSColors.textPrimary, fontSize: 17, fontWeight: '700' },
    errorText: { color: BSColors.darkGray, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    retryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    errorUrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', paddingHorizontal: 8, marginTop: 4 },
    errorUrlInput: { flex: 1, fontSize: 13, color: BSColors.textPrimary, backgroundColor: BSColors.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, height: 44 },
});
