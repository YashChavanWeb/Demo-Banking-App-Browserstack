import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PK ?? 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

export default function RootLayout() {
  const router = useRouter();
  // Use refs typed as any — expo-notifications is loaded dynamically to avoid
  // bundler issues when the native module isn't linked in Expo Go / web.
  const notifListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        const Constants = (await import('expo-constants')).default;

        // Show banners when app is foregrounded
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        // Android notification channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1E3A8A',
          });
        }

        // Request permission
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // Token registration is handled in (banking)/_layout.tsx after login
        // so the auth token is available when calling the server

        // Listeners
        notifListener.current = Notifications.addNotificationReceivedListener(() => {});
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.type === 'chat' && mounted) {
            router.push('/(banking)/chat' as any);
          }
        });
      } catch { /* expo-notifications not available (Expo Go / web) */ }
    })();

    return () => {
      mounted = false;
      notifListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PK} merchantIdentifier="merchant.com.browserstackbank" urlScheme="demobankingapp">
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="biometric" options={{ headerShown: false }} />
        <Stack.Screen name="liveness" options={{ headerShown: false }} />
        <Stack.Screen name="kyc" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(banking)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </StripeProvider>
  );
}