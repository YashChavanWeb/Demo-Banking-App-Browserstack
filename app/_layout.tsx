import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StripeProvider } from '@stripe/stripe-react-native';

// Replace with your Stripe publishable key (or load from env)
const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PK ?? 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';

export default function RootLayout() {
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