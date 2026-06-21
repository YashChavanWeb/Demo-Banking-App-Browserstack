import { Redirect } from 'expo-router';

// Legacy redirect — banking tabs are now at /(banking)/home
export default function DashboardRedirect() {
  return <Redirect href={'/(banking)/home' as any} />;
}