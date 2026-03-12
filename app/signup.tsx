import { SOUTHERN_VEGETABLES } from "@/constants/Vegetables";
import { useAppTheme } from "@/context/ThemeContext";
import { authDbService } from "@/services/dbService";
import { getVegetableImage } from "@/utils/imageHelper";
import { moderateScale, scale, verticalScale } from "@/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    Alert,
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
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
    SlideInRight,
    SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVegs, setSelectedVegs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const router = useRouter();
  const { t, isDark, language, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const filteredVegetables = SOUTHERN_VEGETABLES.filter(
    (veg) =>
      veg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      veg.tamilName.includes(searchQuery),
  );

  const toggleVegetable = (id: string) => {
    Haptics.selectionAsync();
    setSelectedVegs((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (!username || !password || !shopName) {
      Alert.alert(t.APP_NAME, "Please fill all fields");
      return;
    }
    if (!agreeTerms) {
      Alert.alert(t.APP_NAME, "Please agree to the Terms of Service");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(2);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
  };

  const handleSignup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLoading(true);
    try {
      await authDbService.signup({
        username,
        password,
        role: "shopkeeper",
      });
      Alert.alert("Success", "Account created successfully! Please login.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Signup failed. Try again.";

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = [
    styles.container,
    { backgroundColor: isDark ? "#121212" : "#F4F6F9" },
  ];

  const inputContainerStyle = [
    styles.inputContainer,
    {
      backgroundColor: isDark ? "#2C2C2C" : "#F9FAFB",
      borderColor: isDark ? "#333" : "#E0E0E0",
    },
  ];

  const textColor = isDark ? "#FFFFFF" : "#1A1C1E";
  const placeholderColor = isDark ? "#888" : "#9CA3AF";
  const labelColor = isDark ? "#BBB" : "#6B7280";
  const primaryColor = "#00A86B";

  const renderStep1 = () => (
    <Animated.View
      entering={FadeInUp.delay(200)}
      exiting={SlideOutLeft}
      style={styles.formContainer}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" },
        ]}
      >
        {/* Shop Name */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: labelColor }]}>SHOP NAME</Text>
          <View style={inputContainerStyle}>
            <MaterialCommunityIcons
              name="store-outline"
              size={20}
              color={placeholderColor}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Fresh Garden Wholesale"
              placeholderTextColor={placeholderColor}
            />
          </View>
        </View>

        {/* Mobile/Username */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: labelColor }]}>
            {t.USERNAME}
          </Text>
          <View style={inputContainerStyle}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color={placeholderColor}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter 10 digit number"
              placeholderTextColor={placeholderColor}
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.label, { color: labelColor }]}>
            {t.PASSWORD}
          </Text>
          <View style={inputContainerStyle}>
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
              placeholder="Create a password"
              placeholderTextColor={placeholderColor}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={placeholderColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={styles.termsContainer}
          onPress={() => setAgreeTerms(!agreeTerms)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              agreeTerms && {
                backgroundColor: primaryColor,
                borderColor: primaryColor,
              },
              !agreeTerms && { borderColor: isDark ? "#666" : "#D1D5DB" },
            ]}
          >
            {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={[styles.termsText, { color: labelColor }]}>
            I agree to the{" "}
            <Text style={{ color: primaryColor, fontWeight: "600" }}>
              Terms of Service
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signupButton, { backgroundColor: primaryColor }]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.signupButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.loginLinkContainer}>
        <Text style={[styles.loginText, { color: labelColor }]}>
          Already have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={[styles.loginLinkText, { color: primaryColor }]}>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={SlideInRight} style={styles.step2Container}>
      <Text style={[styles.stepTitle, { color: textColor }]}>
        Select Top Selling Items
      </Text>
      <Text style={[styles.stepSubtitle, { color: labelColor }]}>
        Tap to pick your shop's most popular vegetables
      </Text>

      <View
        style={[
          inputContainerStyle,
          { marginBottom: 15, borderRadius: scale(12) },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={placeholderColor}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search vegetables..."
          placeholderTextColor={placeholderColor}
        />
      </View>

      {/* Use a nested View with limited height for list instead of full scroll to avoid nested scroll issues if needed */}
      <View style={{ flex: 1, minHeight: verticalScale(300) }}>
        <FlatList
          data={filteredVegetables}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => {
            const isSelected = selectedVegs.includes(item.id);
            return (
              <TouchableOpacity
                style={[
                  styles.vegItem,
                  isSelected && {
                    borderColor: primaryColor,
                    borderWidth: scale(2),
                  },
                  {
                    backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                    borderColor: isDark ? "#333" : "#E5E7EB",
                  },
                ]}
                onPress={() => toggleVegetable(item.id)}
              >
                <Image
                  source={getVegetableImage(item.image, item.name)}
                  style={styles.vegImage}
                />
                <View
                  style={[
                    styles.overlay,
                    isSelected && { backgroundColor: "rgba(0, 168, 107, 0.1)" },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: primaryColor },
                      ]}
                    >
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.vegName, { color: textColor }]}
                >
                  {language === "Tamil" ? item.tamilName : item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { borderColor: isDark ? "#444" : "#E5E7EB" },
          ]}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.completeButton,
            loading && { opacity: 0.7 },
            { backgroundColor: primaryColor },
          ]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.signupButtonText}>
            {loading ? "Creating..." : "Complete Signup"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

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
          {/* Header Actions */}
          <View
            style={[
              styles.headerActions,
              { paddingTop: insets.top + (Platform.OS === "android" ? 10 : 0) },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                toggleTheme();
              }}
              style={styles.themeButton}
            >
              <View
                style={[
                  styles.themeIconBg,
                  { backgroundColor: isDark ? "#333" : "#FFF" },
                ]}
              >
                <Ionicons
                  name={isDark ? "sunny" : "moon"}
                  size={18}
                  color={isDark ? "#FFD600" : "#1A1C1E"}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.bgDecorCircle,
              {
                backgroundColor: isDark ? "#1A3320" : "#E8F5E9",
                right: isDark ? -100 : -50,
              },
            ]}
          />

          <View style={styles.content}>
            {step === 1 && (
              <Animated.View
                entering={FadeInDown.delay(200)}
                style={styles.headerContainer}
              >
                <View style={styles.logoWrapper}>
                  <View style={styles.logoCircle}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={32}
                      color="#FFF"
                    />
                  </View>
                  <View style={styles.logoBadge}>
                    <Ionicons name="leaf" size={12} color="#FFF" />
                  </View>
                </View>

                <Text style={[styles.title, { color: textColor }]}>
                  {language === "Tamil"
                    ? "கணக்கை உருவாக்கவும்"
                    : "Create Account"}
                </Text>
                <Text style={[styles.subtitle, { color: labelColor }]}>
                  Join our wholesale community and simplify your daily vegetable
                  billing.
                </Text>
              </Animated.View>
            )}

            {step === 1 ? renderStep1() : renderStep2()}
          </View>

          {/* Spacer for keyboard */}
          <View style={{ height: 20 }} />
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
    alignItems: "flex-end",
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(10),
    zIndex: 10,
  },
  themeButton: {
    padding: scale(5),
  },
  bgDecorCircle: {
    position: "absolute",
    top: -verticalScale(50),
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    opacity: 0.5,
  },
  themeIconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingBottom: verticalScale(20),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  logoWrapper: {
    width: scale(80),
    height: scale(80),
    marginBottom: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(24),
    backgroundColor: "#00A86B", // Deep Green
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    transform: [{ rotate: "5deg" }],
  },
  logoBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: "#FFA000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scale(2),
    borderColor: "#FFF",
  },
  title: {
    fontSize: moderateScale(26),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: verticalScale(8),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: "center",
    lineHeight: moderateScale(20),
    fontWeight: "400",
    maxWidth: scale(280),
  },
  formContainer: {
    width: "100%",
  },
  card: {
    borderRadius: scale(24),
    padding: scale(20),
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(25),
    marginTop: verticalScale(5),
    paddingHorizontal: scale(5),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: scale(2),
    marginRight: scale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  termsText: {
    fontSize: moderateScale(13),
    flex: 1,
    lineHeight: moderateScale(18),
  },
  signupButton: {
    height: verticalScale(56),
    borderRadius: scale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  signupButtonText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
    marginRight: scale(8),
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: verticalScale(24),
  },
  loginText: {
    fontSize: moderateScale(14),
    fontWeight: "500",
  },
  loginLinkText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  // Step 2 Styles
  step2Container: {
    flex: 1,
  },
  stepTitle: {
    fontSize: moderateScale(22),
    fontWeight: "800",
    marginBottom: verticalScale(5),
  },
  stepSubtitle: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(20),
  },
  vegItem: {
    flex: 1 / 3,
    margin: scale(6),
    borderRadius: scale(16),
    overflow: "hidden",
    borderWidth: scale(1),
    alignItems: "center",
    height: verticalScale(120),
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  vegImage: {
    width: "100%",
    height: verticalScale(85),
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBadge: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: scale(2),
    borderColor: "#FFF",
    elevation: 2,
  },
  vegName: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginTop: verticalScale(6),
    paddingHorizontal: scale(4),
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: verticalScale(15),
    gap: scale(15),
    paddingBottom: verticalScale(20),
  },
  backButton: {
    width: scale(58),
    height: verticalScale(56),
    borderRadius: scale(16),
    borderWidth: scale(1),
    justifyContent: "center",
    alignItems: "center",
  },
  completeButton: {
    flex: 1,
    height: verticalScale(56),
    borderRadius: scale(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});
