import { BSColors } from '@/constants/theme';
import { ThemeStore } from '@/store/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Register native FCM/APNs device token after login (auth token is available here)
async function registerPushTokenAfterLogin() {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    // getDevicePushTokenAsync returns the raw FCM token on Android and APNs token on iOS
    // This is what Firebase Admin SDK expects directly
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token) return;
    const { api } = await import('@/store/api');
    await api.registerPushToken(token, Platform.OS);
    console.log('[PushToken] FCM device token registered:', String(token).slice(0, 40));
  } catch (e: any) {
    console.log('[PushToken] Registration failed:', e?.message);
  }
}

export default function BankingLayout() {
  const [greenMode, setGreenMode] = useState(ThemeStore.isGreenMode());

  useEffect(() => {
    const unsub = ThemeStore.subscribe(() => setGreenMode(ThemeStore.isGreenMode()));
    // Register push token now that user is logged in
    registerPushTokenAfterLogin();
    return unsub;
  }, []);

  const primaryColor = greenMode ? BSColors.successDark : BSColors.accent;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: BSColors.slate300,
        tabBarStyle: {
          backgroundColor: BSColors.white,
          borderTopColor: BSColors.mediumGray,
          borderTopWidth: 1,
          paddingTop: 8,
          // No fixed height or paddingBottom — Expo Router's Tabs adds the correct
          // bottom safe-area inset automatically for each device (gesture nav, button
          // nav, notch, etc.), so the tab bar always sits above the system UI.
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={greenMode ? size + 6 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          title: 'Transfer',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal" size={greenMode ? size + 6 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={greenMode ? size + 6 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={greenMode ? size + 6 : size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={greenMode ? size + 6 : size} color={color} />,
        }}
      />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="testfeatures" options={{ href: null }} />
      <Tabs.Screen name="network" options={{ href: null }} />
      <Tabs.Screen name="shake" options={{ href: null }} />
      <Tabs.Screen name="shop" options={{ href: null }} />
      <Tabs.Screen name="currency" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="webview" options={{ href: null }} />
      <Tabs.Screen name="coming-soon" options={{ href: null }} />
      <Tabs.Screen name="local-app" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="a11y" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="agents" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="visual" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}