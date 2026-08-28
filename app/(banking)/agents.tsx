/**
 * Agents Screen — AI Banking Chatbot
 * - TTS: fires ONLY when user taps the play button on a specific message
 * - STT: mic button is UI-only (expo-speech is TTS-only; no auto-trigger on keyboard focus)
 * - Keyboard: KeyboardAvoidingView with correct platform offsets
 * - Self-Healing toggle: silently swaps testIDs; info icon opens bottom-sheet
 */

import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @react-native-voice/voice requires a dev build — guard for Expo Go
let Voice: any = null;
try { Voice = require('@react-native-voice/voice').default; } catch { Voice = null; }

interface ToolCall { name: string; result: string; }
interface Message {
    id: string;
    role: 'user' | 'agent';
    text: string;
    toolCalls?: ToolCall[];
    timestamp: string;
}

const FLOWS: Record<string, { text: string; toolCalls?: ToolCall[] }> = {
    balance: {
        text: 'Your checking account has $4,250.00 and savings has $12,800.00. Total portfolio: $17,050.00.',
        toolCalls: [{ name: 'get_account_balance', result: '{ "checking": 4250, "savings": 12800 }' }],
    },
    transfer: {
        text: "I can help you transfer funds. Your daily limit is $5,000 and you've used $0 today. Who would you like to send money to?",
        toolCalls: [{ name: 'check_transfer_limits', result: '{ "daily_limit": 5000, "used_today": 0 }' }],
    },
    transactions: {
        text: 'Your last 3 transactions:\n• -$45.00 — Netflix (2h ago)\n• +$2,400.00 — Salary deposit (yesterday)\n• -$120.00 — Grocery Store (2 days ago)',
        toolCalls: [{ name: 'fetch_transactions', result: '{ "count": 3 }' }],
    },
    fraud: {
        text: 'Security scan complete. No suspicious activity in the last 30 days. Security score: 94/100. Consider enabling biometric login.',
        toolCalls: [
            { name: 'scan_fraud_signals', result: '{ "alerts": 0, "risk": "low" }' },
            { name: 'get_security_score', result: '{ "score": 94 }' },
        ],
    },
    invest: {
        text: 'Based on your moderate risk profile: 60% index funds, 30% bonds, 10% cash. Projected annual return: 7.2%.',
        toolCalls: [
            { name: 'get_risk_profile', result: '{ "profile": "moderate" }' },
            { name: 'generate_allocation', result: '{ "equity": 60, "bonds": 30, "cash": 10 }' },
        ],
    },
    default: {
        text: "Hi! I'm your AI banking assistant. I can help you with:\n• Check balance\n• Transfer funds\n• Recent transactions\n• Fraud & security check\n• Investment advice\n\nWhat would you like to do?",
    },
};

const QUICK_ACTIONS = [
    { id: 'balance',      label: 'Balance',      icon: 'wallet-outline' as const },
    { id: 'transfer',     label: 'Transfer',     icon: 'swap-horizontal' as const },
    { id: 'transactions', label: 'Transactions', icon: 'list-outline' as const },
    { id: 'fraud',        label: 'Security',     icon: 'shield-checkmark-outline' as const },
    { id: 'invest',       label: 'Invest',       icon: 'trending-up-outline' as const },
];

function getResponse(input: string) {
    const l = input.toLowerCase();
    if (l.includes('balance') || l.includes('account')) return FLOWS.balance;
    if (l.includes('transfer') || l.includes('send')) return FLOWS.transfer;
    if (l.includes('transaction') || l.includes('history') || l.includes('recent')) return FLOWS.transactions;
    if (l.includes('fraud') || l.includes('security') || l.includes('suspicious')) return FLOWS.fraud;
    if (l.includes('invest') || l.includes('portfolio') || l.includes('fund')) return FLOWS.invest;
    return FLOWS.default;
}

function ts() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

const STABLE = {
    input:       'agent-chat-input',
    send:        'agent-send-button',
    quickAction: (id: string) => `agent-quick-action-${id}`,
    message:     (id: string) => `agent-message-${id}`,
};
const CHANGED = {
    input:       'agentScreen-messageInput',
    send:        'agentScreen-submitButton',
    quickAction: (id: string) => `agentScreen-shortcut-${id}`,
    message:     (id: string) => `agentScreen-chatBubble-${id}`,
};
const LOCATOR_INFO = [
    { element: 'Chat Input',   stable: 'agent-chat-input',        changed: 'agentScreen-messageInput' },
    { element: 'Send Button',  stable: 'agent-send-button',       changed: 'agentScreen-submitButton' },
    { element: 'Quick Action', stable: 'agent-quick-action-{id}', changed: 'agentScreen-shortcut-{id}' },
    { element: 'Message',      stable: 'agent-message-{id}',      changed: 'agentScreen-chatBubble-{id}' },
];

export default function AgentsScreen() {
    const router = useRouter();
    const { primaryColor, primaryBg, primaryBorder } = useTheme();

    const mountAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(mountAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, [mountAnim]);

    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', role: 'agent', text: FLOWS.default.text, timestamp: ts() },
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [healingOn, setHealingOn] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [micActive, setMicActive] = useState(false);
    const flatRef = useRef<FlatList>(null);

    const ids = healingOn ? CHANGED : STABLE;

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: `u${Date.now()}`, role: 'user', text: text.trim(), timestamp: ts() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTyping(true);
        setTimeout(() => {
            const resp = getResponse(text);
            const agentMsg: Message = {
                id: `a${Date.now()}`,
                role: 'agent',
                text: resp.text,
                toolCalls: resp.toolCalls,
                timestamp: ts(),
            };
            setMessages(prev => [...prev, agentMsg]);
            setTyping(false);
            // NO auto-speak — user must tap play button explicitly
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
        }, 1100);
    };

    // TTS: only called when user explicitly taps play on a message
    const handlePlay = (msgId: string, text: string) => {
        if (speakingId === msgId) {
            Speech.stop();
            setSpeakingId(null);
            return;
        }
        Speech.stop();
        setSpeakingId(msgId);
        const clean = text.replace(/\n•/g, ',').replace(/\*\*/g, '');
        Speech.speak(clean, {
            language: 'en-US',
            rate: 0.95,
            onDone: () => setSpeakingId(null),
            onError: () => setSpeakingId(null),
        });
    };

    // STT setup — only when native module is available (dev build)
    useEffect(() => {
        if (!Voice) return;
        Voice.onSpeechResults = (e: any) => {
            const text = e.value?.[0] ?? '';
            if (text) setInput((prev: string) => prev ? `${prev} ${text}` : text);
        };
        Voice.onSpeechError = () => setMicActive(false);
        Voice.onSpeechEnd = () => setMicActive(false);
        return () => { Voice?.destroy().then(() => Voice?.removeAllListeners()); };
    }, []);

    const handleMic = async () => {
        if (!Voice) {
            // Expo Go fallback — inform user
            setInput(prev => prev);
            return;
        }
        if (micActive) {
            await Voice.stop();
            setMicActive(false);
        } else {
            try {
                await Voice.start('en-US');
                setMicActive(true);
            } catch {
                setMicActive(false);
            }
        }
    };

    const renderBold = (text: string) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return (
            <Text>
                {parts.map((p, i) =>
                    i % 2 === 1
                        ? <Text key={i} style={{ fontWeight: '800' }}>{p}</Text>
                        : <Text key={i}>{p}</Text>
                )}
            </Text>
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        const isPlaying = speakingId === item.id;
        return (
            <View testID={ids.message(item.id)} style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={[styles.agentAvatar, { backgroundColor: primaryColor }]}>
                        <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                    </View>
                )}
                <View style={styles.bubbleWrap}>
                    {item.toolCalls && item.toolCalls.length > 0 && (
                        <View style={styles.toolBlock}>
                            {item.toolCalls.map((tc, i) => (
                                <View key={i} style={[styles.toolRow, { borderColor: primaryColor + '30' }]}>
                                    <Ionicons name="code-slash-outline" size={10} color={primaryColor} />
                                    <Text style={[styles.toolName, { color: primaryColor }]}>{tc.name}</Text>
                                    <Text style={styles.toolResult} numberOfLines={1}>{tc.result}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={[styles.bubble, isUser ? [styles.bubbleUser, { backgroundColor: primaryColor }] : styles.bubbleAgent]}>
                        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                            {renderBold(item.text)}
                        </Text>
                        <View style={styles.bubbleFooter}>
                            <Text style={[styles.bubbleTime, isUser && { color: 'rgba(255,255,255,0.55)' }]}>{item.timestamp}</Text>
                            <TouchableOpacity
                                onPress={() => handlePlay(item.id, item.text)}
                                style={styles.playBtn}
                                accessibilityLabel={isPlaying ? 'Stop reading' : 'Read message aloud'}
                            >
                                <Ionicons
                                    name={isPlaying ? 'stop-circle-outline' : 'play-circle-outline'}
                                    size={16}
                                    color={isUser ? 'rgba(255,255,255,0.7)' : BSColors.slate300}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <Animated.View style={[styles.flex, {
                opacity: mountAnim,
                transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
                        <Ionicons name="arrow-back" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <View style={[styles.headerAvatar, { backgroundColor: primaryColor }]}>
                            <Ionicons name="hardware-chip-outline" size={17} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>BS Banking Agent</Text>
                            <View style={styles.headerSubRow}>
                                <View style={[styles.onlineDot, { backgroundColor: BSColors.successDark }]} />
                                <Text style={styles.headerSub}>AI-powered · Online</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        <Switch
                            value={healingOn}
                            onValueChange={setHealingOn}
                            trackColor={{ false: BSColors.mediumGray, true: BSColors.warningDark }}
                            thumbColor={healingOn ? '#F59E0B' : BSColors.white}
                            accessibilityLabel="Toggle self-healing locator demo"
                            style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                        />
                        <TouchableOpacity onPress={() => setShowInfo(true)} accessibilityLabel="View changed locators">
                            <Ionicons name="information-circle-outline" size={18} color={healingOn ? BSColors.warningDark : BSColors.slate300} />
                        </TouchableOpacity>
                    </View>
                </View>

                {healingOn && (
                    <View style={styles.healingBanner}>
                        <Ionicons name="flash-outline" size={12} color="#D97706" />
                        <Text style={styles.healingBannerText}>Self-healing active — locators changed</Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
                >
                    <FlatList
                        ref={flatRef}
                        data={messages}
                        keyExtractor={i => i.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                        ListFooterComponent={typing ? (
                            <View style={styles.typingRow}>
                                <View style={[styles.agentAvatar, { backgroundColor: primaryColor }]}>
                                    <Ionicons name="hardware-chip-outline" size={14} color="#fff" />
                                </View>
                                <View style={styles.typingBubble}>
                                    {[0, 1, 2].map(i => <View key={i} style={[styles.typingDot, { backgroundColor: BSColors.slate300 }]} />)}
                                </View>
                            </View>
                        ) : null}
                    />

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quickRow}
                        keyboardShouldPersistTaps="handled"
                        style={styles.quickScroll}
                    >
                        {QUICK_ACTIONS.map(a => (
                            <TouchableOpacity
                                key={a.id}
                                testID={ids.quickAction(a.id)}
                                style={[styles.quickChip, { backgroundColor: primaryBg, borderColor: primaryBorder }, healingOn && styles.quickChipHighlight]}
                                onPress={() => sendMessage(a.label)}
                                accessibilityLabel={`Ask about ${a.label}`}
                                accessibilityRole="button"
                            >
                                <Ionicons name={a.icon} size={12} color={primaryColor} />
                                <Text style={[styles.quickChipText, { color: primaryColor }]}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.inputBar}>
                        <TouchableOpacity
                            style={[styles.iconBtn, micActive && { backgroundColor: BSColors.errorBg }]}
                            onPress={handleMic}
                            accessibilityLabel={micActive ? 'Stop microphone' : 'Start voice input'}
                        >
                            <Ionicons
                                name={micActive ? 'stop-circle-outline' : 'mic-outline'}
                                size={20}
                                color={micActive ? BSColors.errorDark : BSColors.darkGray}
                            />
                        </TouchableOpacity>
                        <TextInput
                            testID={ids.input}
                            style={[styles.inputField, healingOn && styles.inputHighlight]}
                            placeholder="Ask your banking agent…"
                            placeholderTextColor={BSColors.slate300}
                            value={input}
                            onChangeText={setInput}
                            onSubmitEditing={() => sendMessage(input)}
                            returnKeyType="send"
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            testID={ids.send}
                            style={[styles.sendBtn, { backgroundColor: input.trim() ? primaryColor : BSColors.mediumGray }, healingOn && styles.sendHighlight]}
                            onPress={() => sendMessage(input)}
                            disabled={!input.trim()}
                            accessibilityLabel="Send message"
                        >
                            <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>

            <Modal visible={showInfo} transparent animationType="slide" onRequestClose={() => setShowInfo(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInfo(false)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Self-Healing Locators</Text>
                        <Text style={styles.modalSub}>When the toggle is ON, these testIDs change to simulate a UI refactor. BrowserStack App Automate self-healing detects and adapts automatically.</Text>
                        {LOCATOR_INFO.map(l => (
                            <View key={l.element} style={styles.locatorCard}>
                                <Text style={styles.locatorElement}>{l.element}</Text>
                                <View style={styles.locatorRow}>
                                    <View style={[styles.locatorChip, { backgroundColor: BSColors.successBg }]}>
                                        <Text style={styles.locatorChipLabel}>Stable</Text>
                                        <Text style={[styles.locatorChipValue, { color: BSColors.successDark }]}>{l.stable}</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={12} color={BSColors.slate300} />
                                    <View style={[styles.locatorChip, { backgroundColor: BSColors.errorBg }]}>
                                        <Text style={styles.locatorChipLabel}>Changed</Text>
                                        <Text style={[styles.locatorChipValue, { color: BSColors.errorDark }]}>{l.changed}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity style={[styles.modalClose, { backgroundColor: primaryColor }]} onPress={() => setShowInfo(false)}>
                            <Text style={styles.modalCloseText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BSColors.bgPage },
    flex: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray, backgroundColor: BSColors.white, gap: 8 },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 14, fontWeight: '800', color: BSColors.textPrimary },
    headerSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
    onlineDot: { width: 6, height: 6, borderRadius: 3 },
    headerSub: { fontSize: 10, color: BSColors.darkGray },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    healingBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
    healingBannerText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
    messagesList: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 12 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    msgRowUser: { flexDirection: 'row-reverse' },
    agentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
    bubbleWrap: { maxWidth: '78%', gap: 4 },
    toolBlock: { gap: 3 },
    toolRow: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BSColors.bgPage, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1 },
    toolName: { fontSize: 10, fontWeight: '700', flexShrink: 0 },
    toolResult: { fontSize: 9, color: BSColors.darkGray, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1 },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
    bubbleAgent: { backgroundColor: BSColors.white, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    bubbleUser: { borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 14, color: BSColors.textPrimary, lineHeight: 20 },
    bubbleTextUser: { color: '#fff' },
    bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, gap: 6 },
    bubbleTime: { fontSize: 10, color: BSColors.slate300 },
    playBtn: { padding: 2 },
    typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 14, paddingBottom: 6 },
    typingBubble: { flexDirection: 'row', gap: 4, backgroundColor: BSColors.white, borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    typingDot: { width: 7, height: 7, borderRadius: 3.5, opacity: 0.5 },
    quickRow: { paddingHorizontal: 14, paddingVertical: 8, gap: 6, alignItems: 'center' },
    quickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, height: 34 },
    quickChipHighlight: { borderColor: '#D97706', borderWidth: 1.5 },
    quickChipText: { fontSize: 12, fontWeight: '600' },
    quickScroll: { maxHeight: 50, borderTopWidth: 1, borderTopColor: BSColors.lightGray },
    inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'android' ? 24 : 16, borderTopWidth: 1, borderTopColor: BSColors.mediumGray, gap: 8, backgroundColor: BSColors.white },
    iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: BSColors.lightGray },
    inputField: { flex: 1, backgroundColor: BSColors.lightGray, borderRadius: 20, paddingHorizontal: 14, paddingTop: 9, paddingBottom: 9, fontSize: 14, color: BSColors.textPrimary, maxHeight: 96, minHeight: 38 },
    inputHighlight: { borderWidth: 1.5, borderColor: '#D97706' },
    sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    sendHighlight: { borderWidth: 1.5, borderColor: '#D97706' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: BSColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: BSColors.mediumGray, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 17, fontWeight: '800', color: BSColors.textPrimary, marginBottom: 6 },
    modalSub: { fontSize: 13, color: BSColors.darkGray, lineHeight: 18, marginBottom: 20 },
    locatorCard: { backgroundColor: BSColors.bgPage, borderRadius: 12, padding: 12, marginBottom: 10 },
    locatorElement: { fontSize: 12, fontWeight: '700', color: BSColors.textPrimary, marginBottom: 8 },
    locatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    locatorChip: { flex: 1, borderRadius: 8, padding: 8 },
    locatorChipLabel: { fontSize: 9, fontWeight: '700', color: BSColors.darkGray, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    locatorChipValue: { fontSize: 11, fontWeight: '700' },
    modalClose: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
