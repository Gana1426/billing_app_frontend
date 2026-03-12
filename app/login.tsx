import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { authDbService } from "@/services/dbService";
import { moderateScale, scale, verticalScale } from "@/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t, theme, toggleLanguage, toggleTheme, language, isDark } =
    useAppTheme();
  const insets = useSafeAreaInsets();

  const logoScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!username || !password) {
      Alert.alert(t.APP_NAME, t.FILL_ALL_FIELDS);
      return;
    }

    try {
      // Use local SQLite database for authentication
      const result = await authDbService.login({ username, password });
      const user = result.data.user;

      if (!user) {
        Alert.alert(t.APP_NAME, "Login failed: User not found");
        return;
      }

      const userData = {
        username: user.username,
        role: user.role as "admin" | "shopkeeper",
        shopName: user.role === "shopkeeper" ? "Vegetable Store" : undefined,
      };

      await login(userData, result.data.access_token);

      if (user.role === "admin") {
        router.replace("/shop");
      } else {
        router.replace("/shop/mode-selection");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(t.APP_NAME, t.INVALID_CREDENTIALS);
    }
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: isDark ? "#121212" : "#F4F6F9" },
  ];

  const inputContainerStyle = [
    styles.inputContainer,
    {
      backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
      borderColor: isDark ? "#333" : "#E0E0E0",
    },
  ];

  const textColor = isDark ? "#FFFFFF" : "#1A1C1E";
  const placeholderColor = isDark ? "#888" : "#9CA3AF";
  const labelColor = isDark ? "#BBB" : "#555";
  const primaryColor = "#00A86B"; // Refined Green

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={isDark ? "#121212" : "#F4F6F9"}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={containerStyle}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Actions (Language & Theme) - Absolute to top */}
          <View
            style={[
              styles.headerActions,
              { paddingTop: insets.top + (Platform.OS === "android" ? 10 : 0) },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                toggleLanguage();
              }}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isDark ? "#333" : "#E8F5E9",
                  marginRight: 10,
                },
              ]}
            >
              <Text
                style={[
                  styles.langText,
                  { color: isDark ? "#FFF" : primaryColor },
                ]}
              >
                {language === "English" ? "தமிழ்" : "Eng"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                toggleTheme();
              }}
              style={[
                styles.actionButton,
                { backgroundColor: isDark ? "#333" : "#FFF" },
              ]}
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={18}
                color={isDark ? "#FFD600" : "#1A1C1E"}
              />
            </TouchableOpacity>
          </View>

          {/* Decorative Background */}
          <View
            style={[
              styles.bgDecorCircle,
              { backgroundColor: isDark ? "#1A3320" : "#E8F5E9" },
            ]}
          />
          <View
            style={[
              styles.bgDecorCircle2,
              { backgroundColor: isDark ? "#1A3320" : "#E8F5E9" },
            ]}
          />

          <View style={styles.content}>
            <Animated.View
              entering={FadeInDown.delay(200).duration(1000)}
              style={styles.logoContainer}
            >
              <Animated.View style={[animatedLogoStyle, styles.logoWrapper]}>
                <View
                  style={[styles.logoCircle, { backgroundColor: primaryColor }]}
                >
                  <MaterialCommunityIcons
                    name="leaf"
                    size={42}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.logoBadge}>
                  <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                </View>
              </Animated.View>

              <Text style={[styles.welcomeText, { color: textColor }]}>
                Welcome Back!
              </Text>
              <Text style={[styles.subtitle, { color: labelColor }]}>
                {language === "English"
                  ? "Sign in to manage your veggie shop"
                  : "உங்கள் காய்கறி கடையை நிர்வகிக்க உள்நுழையவும்"}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(400).duration(800)}
              style={styles.formContainer}
            >
              {/* Card-like container for inputs */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#1E1E1E" : "#FFF",
                    shadowColor: isDark ? "#000" : "#CCC",
                  },
                ]}
              >
                {/* Username */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.label, { color: labelColor }]}>
                    {t.USERNAME}
                  </Text>
                  <View
                    style={[
                      inputContainerStyle,
                      { backgroundColor: isDark ? "#2C2C2C" : "#F9FAFB" },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={placeholderColor}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Enter your username"
                      placeholderTextColor={placeholderColor}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.label, { color: labelColor }]}>
                    {t.PASSWORD}
                  </Text>
                  <View
                    style={[
                      inputContainerStyle,
                      { backgroundColor: isDark ? "#2C2C2C" : "#F9FAFB" },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={placeholderColor}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: textColor, flex: 1 }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={placeholderColor}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text
                    style={[styles.forgotPassword, { color: primaryColor }]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    { backgroundColor: primaryColor },
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>{t.LOGIN}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.signupLinkContainer}>
                <Text style={[styles.signupText, { color: labelColor }]}>
                  {language === "English"
                    ? "Don't have an account? "
                    : "கணக்கு இல்லையா? "}
                </Text>
                <TouchableOpacity onPress={() => router.push("/signup")}>
                  <Text
                    style={[styles.signupLinkText, { color: primaryColor }]}
                  >
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Footer now flows with content */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: labelColor }]}>
              © 2026 {t.APP_NAME} • v1.0.0
            </Text>
          </View>

          {/* Add extra padding at bottom to ensure scrolling past keyboard if needed */}
          <View style={{ height: verticalScale(50) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(10),
    zIndex: 10,
  },
  actionButton: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    minWidth: scale(40),
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  langText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  bgDecorCircle: {
    position: "absolute",
    top: -verticalScale(100),
    right: -scale(80),
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    opacity: 0.5,
  },
  bgDecorCircle2: {
    position: "absolute",
    top: verticalScale(100),
    left: -scale(100),
    width: scale(250),
    height: scale(250),
    borderRadius: scale(125),
    opacity: 0.4,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  logoWrapper: {
    marginBottom: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(24), // Squircle
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    transform: [{ rotate: "-5deg" }],
  },
  logoBadge: {
    position: "absolute",
    bottom: -verticalScale(5),
    right: -scale(5),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "#FFA000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scale(2),
    borderColor: "#FFF",
    elevation: 5,
  },
  welcomeText: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    fontWeight: "500",
    opacity: 0.8,
    maxWidth: "80%",
  },
  formContainer: {
    width: "100%",
  },
  card: {
    borderRadius: scale(24),
    padding: scale(24),
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  inputWrapper: {
    marginBottom: verticalScale(16),
  },
  label: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(6),
    marginLeft: scale(4),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(56),
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    borderWidth: scale(1),
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: moderateScale(16),
    fontWeight: "500",
  },
  eyeIcon: {
    padding: scale(10),
  },
  forgotPassword: {
    textAlign: "right",
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(20),
    marginTop: -verticalScale(5),
  },
  loginButton: {
    height: verticalScale(56),
    borderRadius: scale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(24),
  },
  signupText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  signupLinkText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  footer: {
    paddingVertical: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  footerText: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    opacity: 0.6,
  },
});
