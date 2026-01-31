import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AppThemeProvider, useAppTheme } from '../context/ThemeContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t, theme, language } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/shop');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme === 'dark' ? '#121212' : '#fff' },
      headerTintColor: theme === 'dark' ? '#fff' : '#000',
    }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="admin/index" options={{ title: t.ADMIN }} />
      <Stack.Screen name="shop/index" options={{ title: t.BILLING }} />
      <Stack.Screen name="shop/history" options={{ title: language === 'Tamil' ? 'பில்லிங் வரலாறு' : 'Billing History' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </AppThemeProvider>
  );
}

function RootLayoutInner() {
  const { theme } = useAppTheme();

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
