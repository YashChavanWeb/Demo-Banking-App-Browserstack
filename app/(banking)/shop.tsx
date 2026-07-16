import { BSColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/store/api';
import { BankStore } from '@/store/banking';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48 - 12) / 2; // 2-column grid

const CATEGORIES = ['All', 'Electronics', 'Footwear', 'Kitchen', 'Accessories', 'Bags'];

const PRODUCTS = [
  { id: 'p1', name: 'Wireless Headphones', price: 79.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', category: 'Electronics', rating: 4.5, reviews: 1240 },
  { id: 'p2', name: 'Running Shoes', price: 129.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', category: 'Footwear', rating: 4.8, reviews: 856 },
  { id: 'p3', name: 'Coffee Maker', price: 49.99, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', category: 'Kitchen', rating: 4.3, reviews: 432 },
  { id: 'p4', name: 'Sunglasses', price: 59.99, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80', category: 'Accessories', rating: 4.6, reviews: 678 },
  { id: 'p5', name: 'Backpack', price: 89.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', category: 'Bags', rating: 4.7, reviews: 923 },
  { id: 'p6', name: 'Smart Watch', price: 199.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', category: 'Electronics', rating: 4.9, reviews: 2100 },
  { id: 'p7', name: 'Bluetooth Speaker', price: 59.99, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', category: 'Electronics', rating: 4.4, reviews: 540 },
  { id: 'p8', name: 'Yoga Mat', price: 34.99, image: 'https://images.unsplash.com/photo-1601925228008-f5e4c5e5e5e5?w=600&q=80', category: 'Accessories', rating: 4.2, reviews: 310 },
];

type CartMap = Record<string, number>;

// Use the shared API_URL from store/api (reads from EXPO_PUBLIC_API_URL env var)
import { API_URL } from '@/store/api';

export default function ShopScreen() {
  const { primaryColor } = useTheme();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [cart, setCart] = useState<CartMap>({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: PRODUCTS.find(p => p.id === id)!, qty }))
    .filter(i => i.product);

  const addToCart = (id: string) => setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart(prev => {
    const next = { ...prev };
    if (next[id] > 1) next[id]--;
    else delete next[id];
    return next;
  });
  const removeItemFully = (id: string) => setCart(prev => {
    const next = { ...prev };
    delete next[id];
    return next;
  });

  const filteredProducts = PRODUCTS.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCheckout = async () => {
    if (cartCount === 0) return;
    if (!BankStore.canAfford(cartTotal)) {
      setCheckoutError(`Insufficient balance. Available: $${BankStore.getBalance().toLocaleString()}`);
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const cents = Math.round(cartTotal * 100);
      const response = await fetch(`${API_URL}/payment-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cents, currency: 'usd', customerName: 'Shop Customer' }),
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const { paymentIntent, ephemeralKey, customer } = await response.json();
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'BrowserStack Shop',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: false,
        returnURL: 'demobankingapp://stripe-redirect',
      });
      if (initError) { setCheckoutError(initError.message); setCheckoutLoading(false); return; }
      setCheckoutLoading(false);
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') setCheckoutError(presentError.message);
      } else {
        // Record order in backend (deducts balance + saves order + transaction)
        const orderItems = cartItems.map(({ product, qty }) => ({
          id: product.id, name: product.name, price: product.price, qty,
        }));
        try {
          await api.placeOrder(orderItems, cartTotal, `Shop: ${cartItems.map(i => i.product.name).join(', ')}`);
          BankStore.sync().catch(() => {});
        } catch {
          // Fallback: record locally if server unavailable
          await BankStore.recordPayment(cartTotal, `Shop: ${cartItems.map(i => i.product.name).join(', ')}`);
        }
        setCart({});
        setShowCart(false);
        Alert.alert(
          'Order Placed! 🎉',
          `$${cartTotal.toFixed(2)} paid successfully.\n${cartCount} item${cartCount > 1 ? 's' : ''} will be delivered soon.`,
          [{ text: 'Continue Shopping' }]
        );
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
      setCheckoutLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const renderStars = (rating: number) => '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={BSColors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.pageTitle}>Shop</Text>
          <Text style={styles.pageSubtitle}>Discover & buy</Text>
        </View>
        <TouchableOpacity style={[styles.cartBtn, { marginLeft: 0 }]} onPress={() => { fetchOrders(); setShowOrders(true); }} testID="orders-icon">
          <Ionicons name="receipt-outline" size={20} color={BSColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setShowCart(true)} testID="cart-icon">
          <Ionicons name="bag-outline" size={22} color={BSColors.textPrimary} />
          {cartCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={BSColors.darkGray} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          testID="search-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.catFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, activeCategory === cat && { backgroundColor: primaryColor, borderColor: primaryColor }]}
              onPress={() => setActiveCategory(cat)}
              testID={`cat-${cat}`}
            >
              <Text style={[styles.catChipText, activeCategory === cat && { color: '#fff' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false} style={styles.gridScroll}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={BSColors.mediumGray} />
            <Text style={styles.emptyStateText}>No products found</Text>
          </View>
        ) : (
          <View style={styles.gridRow}>
            {filteredProducts.map(item => (
              <View key={item.id} style={styles.productCard}>
                <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                <View style={[styles.catBadge, { backgroundColor: primaryColor + '15' }]}>
                  <Text style={[styles.catBadgeText, { color: primaryColor }]}>{item.category}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.stars}>{renderStars(item.rating)}</Text>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                  <Text style={[styles.productPrice, { color: primaryColor }]}>${item.price.toFixed(2)}</Text>
                  {cart[item.id] ? (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { borderColor: primaryColor }]}
                        onPress={() => removeFromCart(item.id)}
                        testID={`remove-${item.id}`}
                      >
                        <Ionicons name="remove" size={16} color={primaryColor} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cart[item.id]}</Text>
                      <TouchableOpacity
                        style={[styles.qtyBtn, { backgroundColor: primaryColor, borderColor: primaryColor }]}
                        onPress={() => addToCart(item.id)}
                        testID={`add-${item.id}`}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addBtn, { backgroundColor: primaryColor }]}
                      onPress={() => addToCart(item.id)}
                      testID={`add-${item.id}`}
                    >
                      <Ionicons name="add" size={16} color="#fff" />
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: cartCount > 0 ? 100 : 24 }} />
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: primaryColor }]}
          onPress={() => setShowCart(true)}
          testID="floating-cart-btn"
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={[styles.floatingCartBadgeText, { color: primaryColor }]}>{cartCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>View Cart</Text>
          </View>
          <Text style={styles.floatingCartTotal}>${cartTotal.toFixed(2)}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Orders Modal */}
      <Modal visible={showOrders} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>My Orders</Text>
            <TouchableOpacity onPress={() => setShowOrders(false)} style={styles.cartCloseBtn}>
              <Ionicons name="close" size={22} color={BSColors.textPrimary} />
            </TouchableOpacity>
          </View>
          {ordersLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color={primaryColor} />
              <Text style={{ color: BSColors.darkGray, fontSize: 14 }}>Loading orders...</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="receipt-outline" size={48} color={BSColors.mediumGray} />
              <Text style={styles.emptyCartTitle}>No orders yet</Text>
              <Text style={styles.emptyCartSub}>Your completed orders will appear here</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              {orders.map((order: any) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardTop}>
                    <View style={[styles.orderStatusBadge, { backgroundColor: primaryColor + '15' }]}>
                      <Text style={[styles.orderStatusText, { color: primaryColor }]}>{order.status}</Text>
                    </View>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <Text style={styles.orderRef}>Ref: {order.referenceId}</Text>
                  <View style={{ marginTop: 8 }}>
                    {(order.items || []).map((item: any, i: number) => (
                      <Text key={i} style={styles.orderItem}>• {item.name} × {item.qty}</Text>
                    ))}
                  </View>
                  <View style={styles.orderTotal}>
                    <Text style={styles.orderTotalLabel}>Total paid</Text>
                    <Text style={[styles.orderTotalValue, { color: primaryColor }]}>${order.total?.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.cartModal}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Your Cart</Text>
            <TouchableOpacity onPress={() => setShowCart(false)} style={styles.cartCloseBtn}>
              <Ionicons name="close" size={22} color={BSColors.textPrimary} />
            </TouchableOpacity>
          </View>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="bag-outline" size={56} color={BSColors.mediumGray} />
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>Add items to get started</Text>
              <TouchableOpacity style={[styles.continueShoppingBtn, { backgroundColor: primaryColor }]} onPress={() => setShowCart(false)}>
                <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartList} contentContainerStyle={{ paddingBottom: 16 }}>
                {cartItems.map(({ product, qty }) => (
                  <View key={product.id} style={styles.cartItem}>
                    <Image source={{ uri: product.image }} style={styles.cartItemImage} resizeMode="cover" />
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={2}>{product.name}</Text>
                      <Text style={[styles.cartItemPrice, { color: primaryColor }]}>${product.price.toFixed(2)}</Text>
                      <View style={styles.cartQtyRow}>
                        <TouchableOpacity style={[styles.cartQtyBtn, { borderColor: primaryColor }]} onPress={() => removeFromCart(product.id)}>
                          <Ionicons name="remove" size={14} color={primaryColor} />
                        </TouchableOpacity>
                        <Text style={styles.cartQtyText}>{qty}</Text>
                        <TouchableOpacity style={[styles.cartQtyBtn, { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={() => addToCart(product.id)}>
                          <Ionicons name="add" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.cartItemRight}>
                      <Text style={[styles.cartItemTotal, { color: primaryColor }]}>${(product.price * qty).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => removeItemFully(product.id)} style={styles.cartRemoveBtn}>
                        <Ionicons name="trash-outline" size={18} color={BSColors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.orderSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal ({cartCount} items)</Text>
                  <Text style={styles.summaryValue}>${cartTotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={[styles.summaryValue, { color: BSColors.success }]}>Free</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={[styles.summaryTotalValue, { color: primaryColor }]}>${cartTotal.toFixed(2)}</Text>
                </View>
                {checkoutError ? (
                  <View style={styles.checkoutError}>
                    <Ionicons name="warning-outline" size={15} color={BSColors.error} />
                    <Text style={styles.checkoutErrorText}>{checkoutError}</Text>
                  </View>
                ) : null}
                <View style={styles.balanceRow}>
                  <Ionicons name="wallet-outline" size={14} color={BSColors.darkGray} />
                  <Text style={styles.balanceText}>Balance: <Text style={{ color: primaryColor, fontWeight: '700' }}>${BankStore.getBalance().toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text></Text>
                </View>
                <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: primaryColor }, checkoutLoading && { opacity: 0.7 }]} onPress={handleCheckout} disabled={checkoutLoading} testID="checkout-btn">
                  {checkoutLoading ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} /> : <Ionicons name="lock-closed-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
                  <Text style={styles.checkoutBtnText}>{checkoutLoading ? 'Processing...' : `Pay $${cartTotal.toFixed(2)}`}</Text>
                </TouchableOpacity>
                <Text style={styles.secureNote}>🔒 Secured by Stripe</Text>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BSColors.bgPage },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  pageTitle: { color: BSColors.textPrimary, fontSize: 18, fontWeight: '800' },
  pageSubtitle: { color: BSColors.darkGray, fontSize: 12 },
  cartBtn: { marginLeft: 'auto', width: 42, height: 42, borderRadius: 14, backgroundColor: BSColors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  cartBadge: { position: 'absolute', top: -4, right: -4, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: BSColors.bgPage },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: BSColors.white, marginHorizontal: 20, marginBottom: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BSColors.mediumGray },
  searchInput: { flex: 1, fontSize: 14, color: BSColors.textPrimary },
  catFilterWrap: { flexShrink: 0 },
  catRow: { paddingHorizontal: 20, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: BSColors.white, borderWidth: 1.5, borderColor: BSColors.mediumGray, flexShrink: 0 },
  catChipText: { color: BSColors.textSecondary, fontSize: 12, fontWeight: '600' },
  gridScroll: { flex: 1 },
  grid: { paddingHorizontal: 20 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: CARD_W, backgroundColor: BSColors.white, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  productImage: { width: '100%', height: 140, backgroundColor: BSColors.lightGray },
  catBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: 10, fontWeight: '700' },
  productInfo: { padding: 12 },
  productName: { color: BSColors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  stars: { color: BSColors.warning, fontSize: 12 },
  ratingText: { color: BSColors.darkGray, fontSize: 11 },
  productPrice: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 30, height: 30, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: BSColors.textPrimary, fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12, width: '100%' },
  emptyStateText: { color: BSColors.darkGray, fontSize: 15 },
  floatingCart: { position: 'absolute', bottom: 20, left: 20, right: 20, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8 },
  floatingCartLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  floatingCartBadge: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  floatingCartBadgeText: { fontSize: 13, fontWeight: '800' },
  floatingCartLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
  floatingCartTotal: { color: '#fff', fontSize: 15, fontWeight: '800', marginRight: 8 },
  cartModal: { flex: 1, backgroundColor: BSColors.bgPage },
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BSColors.mediumGray },
  cartTitle: { color: BSColors.textPrimary, fontSize: 20, fontWeight: '800' },
  cartCloseBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: BSColors.lightGray, alignItems: 'center', justifyContent: 'center' },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyCartTitle: { color: BSColors.textPrimary, fontSize: 18, fontWeight: '700' },
  emptyCartSub: { color: BSColors.darkGray, fontSize: 14 },
  continueShoppingBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  continueShoppingText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cartList: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  cartItem: { flexDirection: 'row', backgroundColor: BSColors.white, borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cartItemImage: { width: 72, height: 72, borderRadius: 12, backgroundColor: BSColors.lightGray },
  cartItemInfo: { flex: 1, paddingHorizontal: 12 },
  cartItemName: { color: BSColors.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 4, lineHeight: 18 },
  cartItemPrice: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartQtyBtn: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cartQtyText: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  cartItemRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  cartItemTotal: { fontSize: 15, fontWeight: '800' },
  cartRemoveBtn: { padding: 4 },
  orderSummary: { backgroundColor: BSColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: BSColors.darkGray, fontSize: 14 },
  summaryValue: { color: BSColors.textPrimary, fontSize: 14, fontWeight: '600' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: BSColors.mediumGray, paddingTop: 12, marginTop: 4, marginBottom: 14 },
  summaryTotalLabel: { color: BSColors.textPrimary, fontSize: 16, fontWeight: '700' },
  summaryTotalValue: { fontSize: 20, fontWeight: '800' },
  checkoutError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
  checkoutErrorText: { color: BSColors.error, fontSize: 12, flex: 1 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  balanceText: { color: BSColors.darkGray, fontSize: 13 },
  checkoutBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secureNote: { color: BSColors.darkGray, fontSize: 12, textAlign: 'center' },
  orderCard: { backgroundColor: BSColors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  orderCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderStatusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  orderStatusText: { fontSize: 12, fontWeight: '700' },
  orderDate: { color: BSColors.darkGray, fontSize: 12 },
  orderRef: { color: BSColors.darkGray, fontSize: 11, marginBottom: 4 },
  orderItem: { color: BSColors.textSecondary, fontSize: 13, marginBottom: 2 },
  orderTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: BSColors.lightGray },
  orderTotalLabel: { color: BSColors.darkGray, fontSize: 13 },
  orderTotalValue: { fontSize: 16, fontWeight: '800' },
});