import { BSColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

const PRODUCTS = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', category: 'Electronics', rating: 4.5, reviews: 1240 },
  { id: 'p2', name: 'Running Shoes', price: 129.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', category: 'Footwear', rating: 4.8, reviews: 856 },
  { id: 'p3', name: 'Coffee Maker', price: 49.99, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', category: 'Kitchen', rating: 4.3, reviews: 432 },
  { id: 'p4', name: 'Sunglasses', price: 59.99, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80', category: 'Accessories', rating: 4.6, reviews: 678 },
  { id: 'p5', name: 'Backpack', price: 89.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', category: 'Bags', rating: 4.7, reviews: 923 },
  { id: 'p6', name: 'Smart Watch', price: 199.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', category: 'Electronics', rating: 4.9, reviews: 2100 },
];

export default function ShopScreen() {
  const { primaryColor, primaryBg, primaryBorder } = useTheme();
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart(prev => {
    const next = { ...prev };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Dynamic Data</Text>
        <View style={styles.cartBadgeWrap}>
          <Ionicons name="cart-outline" size={24} color={primaryColor} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Swipeable Product Cards */}
      <FlatList
        ref={flatListRef}
        data={PRODUCTS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
          setActiveIndex(idx);
        }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
            <View style={styles.productInfo}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
              <Text style={styles.productName}>{item.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{renderStars(item.rating)}</Text>
                <Text style={styles.ratingText}>{item.rating} ({item.reviews.toLocaleString()} reviews)</Text>
              </View>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>

              <View style={styles.cartControls}>
                {cart[item.id] ? (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)} testID={`remove-${item.id}`}>
                      <Ionicons name="remove" size={20} color={primaryColor} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{cart[item.id]}</Text>
                    <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => addToCart(item.id)} testID={`add-${item.id}`}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item.id)} testID={`add-${item.id}`}>
                    <Ionicons name="cart-outline" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {PRODUCTS.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      {/* Cart Summary */}
      {cartCount > 0 && (
        <View style={styles.cartSummary}>
          <View>
            <Text style={styles.cartSummaryLabel}>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</Text>
            <Text style={styles.cartSummaryTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => Alert.alert('Checkout', `Total: $${cartTotal.toFixed(2)}\n\nThis would proceed to payment.`)}
            testID="checkout-btn"
          >
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  cartBadgeWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#DC2626', borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  flatListContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
  productCard: { width: CARD_WIDTH, marginRight: 16, backgroundColor: '#fff', borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  productImage: { width: '100%', height: 260, backgroundColor: '#F1F5F9' },
  productInfo: { padding: 20 },
  categoryBadge: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  categoryText: { color: BSColors.primary, fontSize: 11, fontWeight: '700' },
  productName: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  stars: { color: '#F59E0B', fontSize: 16 },
  ratingText: { color: '#64748B', fontSize: 12 },
  productPrice: { color: BSColors.primary, fontSize: 28, fontWeight: '800', marginBottom: 16 },
  cartControls: { marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { backgroundColor: BSColors.primary },
  qtyText: { color: '#0F172A', fontSize: 20, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: BSColors.primary, borderRadius: 14, paddingVertical: 14 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C7D2FE' },
  dotActive: { width: 24, backgroundColor: BSColors.primary },
  cartSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  cartSummaryLabel: { color: '#64748B', fontSize: 12, marginBottom: 2 },
  cartSummaryTotal: { color: BSColors.primary, fontSize: 20, fontWeight: '800' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BSColors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});