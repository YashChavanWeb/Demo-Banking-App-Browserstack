/**
 * A11y Demo Screen — Banking Feed
 * Intentional WCAG violations embedded silently (no inspector UI):
 * 1. WCAG 1.4.3  — handle/meta text in #888888 on white (~3.5:1 contrast)
 * 2. WCAG 1.1.1  — icon-only buttons (close, bookmark) with no accessibilityLabel
 * 3. WCAG 1.3.1  — "Trending" section title has no accessibilityRole="header"
 * 4. WCAG 2.4.7  — "Follow" button hidden from a11y tree
 * 5. WCAG 2.5.3  — "Like" button: visual text absent, accessibilityLabel mismatch
 * 6. WCAG 4.1.2  — custom View-based toggle; state not announced
 * 7. Mobile      — post captions use allowFontScaling={false}
 * 8. Mobile      — "See all" touch target is 28×16 pt (below 44×44)
 */

import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');

interface Post {
    id: string;
    user: string;
    handle: string;
    avatar: string;
    avatarColor: string;
    time: string;
    image: string;
    caption: string;
    tag: string;
    likes: number;
    comments: { id: string; user: string; text: string }[];
}

const STORIES = [
    { id: 's1', user: 'sarah_m',   color: '#6366F1', avatar: 'SM' },
    { id: 's2', user: 'james_ok',  color: '#059669', avatar: 'JO' },
    { id: 's3', user: 'mei_fin',   color: '#D97706', avatar: 'ML' },
    { id: 's4', user: 'carlos_r',  color: '#DC2626', avatar: 'CR' },
    { id: 's5', user: 'priya_s',   color: '#7C3AED', avatar: 'PS' },
];

const FEED: Post[] = [
    {
        id: 'p1', user: 'Sarah Mitchell', handle: '@sarah_m', avatar: 'SM', avatarColor: '#6366F1',
        time: '2m ago',
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
        caption: 'Just set up automatic savings — $200 moved to my emergency fund this month! Consistency is key.',
        tag: 'Savings', likes: 248, comments: [
            { id: 'c1', user: 'alex_b', text: 'Great habit! Keep it up.' },
            { id: 'c2', user: 'priya_s', text: 'I do the same every month.' },
        ],
    },
    {
        id: 'p2', user: 'James Okafor', handle: '@james_ok', avatar: 'JO', avatarColor: '#059669',
        time: '15m ago',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
        caption: 'Paid off my credit card balance in full. Feels amazing to be completely debt-free!',
        tag: 'Payment', likes: 612, comments: [
            { id: 'c3', user: 'dana_k', text: 'Congrats! Huge milestone.' },
        ],
    },
    {
        id: 'p3', user: 'Mei Lin', handle: '@mei_finance', avatar: 'ML', avatarColor: '#D97706',
        time: '1h ago',
        image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
        caption: 'Diversified my portfolio today — added index funds and a small crypto position. Long game.',
        tag: 'Investing', likes: 384, comments: [],
    },
    {
        id: 'p4', user: 'Carlos Rivera', handle: '@carlos_r', avatar: 'CR', avatarColor: '#DC2626',
        time: '3h ago',
        image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        caption: 'Cancelled 3 unused subscriptions and saved $47/mo. Review yours — you might be surprised.',
        tag: 'Budgeting', likes: 1120, comments: [
            { id: 'c4', user: 'yuki_t', text: 'Did this last week, saved $60!' },
            { id: 'c5', user: 'sam_w', text: 'Which app do you use to track?' },
        ],
    },
    {
        id: 'p5', user: 'Priya Sharma', handle: '@priya_s', avatar: 'PS', avatarColor: '#7C3AED',
        time: '5h ago',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        caption: 'Set a 6-month emergency fund goal. Tracking every rupee. Financial freedom is a journey.',
        tag: 'Goals', likes: 537, comments: [
            { id: 'c6', user: 'mei_fin', text: 'Love this mindset!' },
        ],
    },
];

export default function A11yScreen() {
    const router = useRouter();
    const { primaryColor, primaryBg, primaryBorder } = useTheme();
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [commentOpen, setCommentOpen] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    // VIOLATION 6: custom toggle — state not announced to a11y tree
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const mountAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => { Animated.timing(mountAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start(); }, [mountAnim]);

    const toggleLike = (id: string) => {
        setLikedPosts(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const renderStory = ({ item }: { item: typeof STORIES[0] }) => (
        <TouchableOpacity style={styles.storyItem} accessibilityLabel={`${item.user}'s story`}>
            <View style={[styles.storyRing, { borderColor: primaryColor }]}>
                <View style={[styles.storyAvatar, { backgroundColor: item.color }]}>
                    <Text style={styles.storyAvatarText}>{item.avatar}</Text>
                </View>
            </View>
            {/* VIOLATION 1: #888888 on white */}
            <Text style={styles.storyName} numberOfLines={1}>{item.user}</Text>
        </TouchableOpacity>
    );

    const renderPost = ({ item }: { item: Post }) => {
        const liked = likedPosts.has(item.id);
        return (
            <View style={styles.postCard}>
                {/* Post header */}
                <View style={styles.postHeader}>
                    <View style={[styles.postAvatar, { backgroundColor: item.avatarColor }]}>
                        <Text style={styles.postAvatarText}>{item.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.postUser}>{item.user}</Text>
                        {/* VIOLATION 1: low-contrast meta text */}
                        <Text style={styles.postMeta}>{item.handle} · {item.time}</Text>
                    </View>
                    <View style={[styles.tagPill, { backgroundColor: primaryBg, borderColor: primaryBorder }]}>
                        <Text style={[styles.tagText, { color: primaryColor }]}>{item.tag}</Text>
                    </View>
                    {/* VIOLATION 2: icon-only, no accessibilityLabel */}
                    <TouchableOpacity style={styles.moreBtn}>
                        <Ionicons name="ellipsis-horizontal" size={18} color={BSColors.darkGray} />
                    </TouchableOpacity>
                </View>

                {/* Post image */}
                <Image
                    source={{ uri: item.image }}
                    style={styles.postImage}
                    resizeMode="cover"
                    // VIOLATION 2: no accessibilityLabel on meaningful image
                />

                {/* Actions */}
                <View style={styles.actionsRow}>
                    {/* VIOLATION 5: accessibilityLabel mismatch */}
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => toggleLike(item.id)}
                        accessibilityLabel="Press to react to this post"
                    >
                        <Ionicons
                            name={liked ? 'heart' : 'heart-outline'}
                            size={24}
                            color={liked ? BSColors.errorDark : BSColors.textPrimary}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentOpen(commentOpen === item.id ? null : item.id)}>
                        <Ionicons name="chatbubble-outline" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="paper-plane-outline" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    {/* VIOLATION 2: bookmark icon, no accessibilityLabel */}
                    <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="bookmark-outline" size={22} color={BSColors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Likes */}
                <View style={styles.postBody}>
                    <Text style={styles.likesText}>{(item.likes + (liked ? 1 : 0)).toLocaleString()} likes</Text>

                    {/* VIOLATION 7: allowFontScaling=false */}
                    <Text style={styles.captionText} allowFontScaling={false}>
                        <Text style={styles.captionUser}>{item.user.split(' ')[0].toLowerCase()} </Text>
                        {item.caption}
                    </Text>

                    {item.comments.length > 0 && (
                        <View style={styles.commentsPreview}>
                            {item.comments.slice(0, 2).map(c => (
                                <Text key={c.id} style={styles.commentLine} numberOfLines={1}>
                                    <Text style={styles.commentUser}>{c.user} </Text>
                                    <Text style={styles.commentBody}>{c.text}</Text>
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* VIOLATION 1: low-contrast time text */}
                    <Text style={styles.timeAgo}>{item.time}</Text>
                </View>

                {/* Comment input */}
                {commentOpen === item.id && (
                    <View style={styles.commentInputRow}>
                        <View style={[styles.commentAvatarSm, { backgroundColor: primaryColor }]}>
                            <Text style={styles.commentAvatarSmText}>Me</Text>
                        </View>
                        <TextInput
                            style={styles.commentField}
                            placeholder="Add a comment…"
                            placeholderTextColor={BSColors.slate300}
                            value={commentText}
                            onChangeText={setCommentText}
                        />
                        <TouchableOpacity onPress={() => { setCommentText(''); setCommentOpen(null); }}>
                            <Text style={[styles.postCommentBtn, { color: primaryColor }]}>Post</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const ListHeader = () => (
        <View>
            {/* Stories row */}
            <View style={styles.storiesContainer}>
                <FlatList
                    data={STORIES}
                    keyExtractor={i => i.id}
                    renderItem={renderStory}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.storiesList}
                />
            </View>
            <View style={styles.divider} />

            {/* VIOLATION 3: "Trending" section title — no accessibilityRole="header" */}
            <View style={styles.trendingHeader}>
                <Text style={styles.trendingTitle}>Trending in Finance</Text>
                {/* VIOLATION 8: tiny touch target 28×16 */}
                <TouchableOpacity style={styles.seeAllBtn}>
                    <Text style={[styles.seeAllText, { color: primaryColor }]}>See all</Text>
                </TouchableOpacity>
            </View>

            {/* VIOLATION 4: "Follow" suggestions — hidden from a11y tree */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsRow}>
                {STORIES.slice(0, 3).map(s => (
                    <View key={s.id} style={styles.suggestionCard}>
                        <View style={[styles.suggestionAvatar, { backgroundColor: s.color }]}>
                            <Text style={styles.suggestionAvatarText}>{s.avatar}</Text>
                        </View>
                        <Text style={styles.suggestionName}>{s.user}</Text>
                        {/* VIOLATION 4: hidden from a11y tree */}
                        <View importantForAccessibility="no-hide-descendants" accessible={false}>
                            <TouchableOpacity style={[styles.followBtn, { backgroundColor: primaryColor }]}>
                                <Text style={styles.followBtnText}>Follow</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* VIOLATION 6: custom toggle — no state announcement */}
            <View style={styles.alertsRow}>
                <View>
                    <Text style={styles.alertsLabel}>Transaction Alerts</Text>
                    {/* VIOLATION 1: low-contrast sub-text */}
                    <Text style={styles.alertsSub}>Get notified on every transaction</Text>
                </View>
                <TouchableOpacity
                    style={[styles.customToggle, alertsEnabled && { backgroundColor: primaryColor }]}
                    onPress={() => setAlertsEnabled(v => !v)}
                    accessible={false}
                >
                    <View style={[styles.customThumb, alertsEnabled && styles.customThumbOn]} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View style={{ flex: 1, opacity: mountAnim, transform: [{ translateY: mountAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
                    <Ionicons name="arrow-back" size={22} color={BSColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>Banking Feed</Text>
                {/* VIOLATION 2: notification icon, no accessibilityLabel */}
                <TouchableOpacity style={styles.headerIconBtn}>
                    <Ionicons name="notifications-outline" size={24} color={BSColors.textPrimary} />
                    <View style={styles.notifDot} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    data={FEED}
                    keyExtractor={i => i.id}
                    renderItem={renderPost}
                    ListHeaderComponent={<ListHeader />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 32 }}
                />
            </KeyboardAvoidingView>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: BSColors.white },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    pageTitle: { fontSize: 18, fontWeight: '800', color: BSColors.textPrimary },
    headerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: BSColors.errorDark, borderWidth: 1.5, borderColor: BSColors.white },

    // Stories
    storiesContainer: { paddingVertical: 12 },
    storiesList: { paddingHorizontal: 12, gap: 16 },
    storyItem: { alignItems: 'center', width: 64 },
    storyRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, padding: 2, marginBottom: 4 },
    storyAvatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    storyAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    // VIOLATION 1: #C0C0C0 on white — contrast ~1.6:1, clearly fails 4.5:1
    storyName: { fontSize: 11, color: '#C0C0C0', textAlign: 'center' },

    divider: { height: 1, backgroundColor: BSColors.mediumGray },

    // Trending header — VIOLATION 3 (no accessibilityRole="header")
    trendingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
    trendingTitle: { fontSize: 15, fontWeight: '800', color: BSColors.textPrimary },
    // VIOLATION 8: 32×14 touch target — clearly below 44×44 minimum
    seeAllBtn: { width: 32, height: 14, alignItems: 'center', justifyContent: 'center' },
    seeAllText: { fontSize: 10, fontWeight: '700' },

    // Suggestions
    suggestionsRow: { paddingHorizontal: 12, gap: 10, paddingBottom: 12 },
    suggestionCard: { width: 110, backgroundColor: BSColors.bgPage, borderRadius: 14, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: BSColors.mediumGray },
    suggestionAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    suggestionAvatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    suggestionName: { fontSize: 11, color: BSColors.textPrimary, fontWeight: '600', textAlign: 'center' },
    followBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
    followBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Alerts toggle — VIOLATION 6
    alertsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: BSColors.mediumGray, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray, marginBottom: 4 },
    alertsLabel: { fontSize: 14, fontWeight: '700', color: BSColors.textPrimary },
    // VIOLATION 1: #C0C0C0 on white — contrast ~1.6:1
    alertsSub: { fontSize: 13, color: '#C0C0C0', marginTop: 2 },
    customToggle: { width: 46, height: 26, borderRadius: 13, backgroundColor: BSColors.mediumGray, justifyContent: 'center', paddingHorizontal: 2 },
    customThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: BSColors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    customThumbOn: { alignSelf: 'flex-end' },

    // Post card
    postCard: { backgroundColor: BSColors.white, marginBottom: 2 },
    postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    postAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    postAvatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    postUser: { fontSize: 13, fontWeight: '700', color: BSColors.textPrimary },
    // VIOLATION 1: #C0C0C0 on white — contrast ~1.6:1
    postMeta: { fontSize: 12, color: '#C0C0C0' },
    tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
    tagText: { fontSize: 10, fontWeight: '700' },
    moreBtn: { padding: 4 },
    postImage: { width: SW, height: SW * 0.75 },
    actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
    actionBtn: { marginRight: 14 },
    postBody: { paddingHorizontal: 12, paddingBottom: 12, gap: 4 },
    likesText: { fontSize: 13, fontWeight: '700', color: BSColors.textPrimary },
    // VIOLATION 7: allowFontScaling=false in JSX — fixed 16px, ignores system font scale
    captionText: { fontSize: 16, color: BSColors.textPrimary, lineHeight: 22 },
    captionUser: { fontWeight: '700' },
    commentsPreview: { gap: 2 },
    commentLine: { fontSize: 13, color: BSColors.textPrimary },
    commentUser: { fontWeight: '700' },
    commentBody: { color: BSColors.textPrimary },
    // VIOLATION 1: #C0C0C0 on white — contrast ~1.6:1
    timeAgo: { fontSize: 11, color: '#C0C0C0', marginTop: 2 },
    commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: BSColors.lightGray, gap: 8 },
    commentAvatarSm: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    commentAvatarSmText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    commentField: { flex: 1, fontSize: 13, color: BSColors.textPrimary, paddingVertical: 4 },
    postCommentBtn: { fontSize: 13, fontWeight: '700' },
});
