import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { initializeDatabase } from "@/database/client";
import { seedDatabase } from "@/database/seed";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { t, theme, language } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      if (user.role === "admin") {
        router.replace("/shop");
      } else {
        router.replace("/shop");
      }
    }
  }, [user, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme === "dark" ? "#121212" : "#fff" },
        headerTintColor: theme === "dark" ? "#fff" : "#000",
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen
        name="forgot-password"
        options={{
          title:
            language === "Tamil" ? "கடவுச்சொல்லை மீட்டமை" : "Reset Password",
          headerShown: false,
        }}
      />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="admin/index" options={{ title: t.ADMIN }} />
      <Stack.Screen name="shop" options={{ headerShown: false }} />
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

  useEffect(() => {
    // Initialize SQLite database on app startup
    const initApp = async () => {
      try {
        await initializeDatabase();
        await seedDatabase();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initApp();
  }, []);

  return (
    <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
