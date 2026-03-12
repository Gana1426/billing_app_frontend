import { useAppTheme } from '@/context/ThemeContext';
import { moderateScale, scale, verticalScale } from '@/utils/responsive';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();

    const handleResetPassword = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!username) {
            Alert.alert(t.APP_NAME, "Please enter your username or registered phone number");
            return;
        }

        setIsLoading(true);
        try {
            // Wait for 1.5 seconds to simulate an API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            Alert.alert(
                "Reset Requested", 
                "If an account exists for this username, you will receive a password reset link on your registered contact details.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert("Error", "Could not process request. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const primaryColor = '#FF8C00';
    const secondaryColor = '#FFA500';
    const background = isDark ? '#0F0F0F' : '#F8FAFC';
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDark ? '#FFF' : '#1E293B';
    const subTextColor = isDark ? '#94A3B8' : '#64748B';

    return (
        <View style={[styles.container, { backgroundColor: background }]}>
            <StatusBar style={isDark ? "light" : "dark"} />
            
            <View style={[styles.bgCircle, { bottom: -scale(100), right: -scale(80), backgroundColor: primaryColor + '10' }]} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView 
                    contentContainerStyle={[styles.scrollInner, { paddingTop: insets.top + verticalScale(20), paddingBottom: Math.max(insets.bottom, verticalScale(20)) + verticalScale(20) }]} 
                    showsVerticalScrollIndicator={false} 
                    keyboardShouldPersistTaps="handled"
                >
                    
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: cardBg }]}>
                        <Ionicons name="arrow-back" size={20} color={textColor} />
                    </TouchableOpacity>

                    <Animated.View entering={FadeInDown.duration(600)} style={styles.heroSection}>
                        <View style={[styles.iconBox, { backgroundColor: primaryColor + '15' }]}>
                            <Feather name="key" size={40} color={primaryColor} />
                        </View>
                        <Text style={[styles.heroText, { color: textColor }]}>Reset Password</Text>
                        <Text style={[styles.heroSub, { color: subTextColor }]}>Don't worry! It happens. Enter the username associated with your account.</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>
                        <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.inputLabel, { color: subTextColor }]}>Username / Phone Number</Text>
                                <View style={[styles.inputField, { backgroundColor: isDark ? '#2C2C2C' : '#F1F5F9', borderColor: isDark ? '#333' : '#E2E8F0' }]}>
                                    <Feather name="mail" size={18} color={primaryColor} />
                                    <TextInput 
                                        style={[styles.textInput, { color: textColor }]} 
                                        placeholder="Enter your username" 
                                        placeholderTextColor="#94A3B8"
                                        autoCapitalize="none"
                                        value={username}
                                        onChangeText={setUsername}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={handleResetPassword} 
                                style={styles.submitBtnContainer} 
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                <LinearGradient colors={[primaryColor, secondaryColor]} style={styles.submitBtn}>
                                    {isLoading ? (
                                        <View style={{ flexDirection: 'row', gap: 10 }}>
                                            <Text style={styles.submitBtnText}>Processing...</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.submitBtnText}>Send Reset Link</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => router.back()} style={styles.loginBackBox}>
                            <Text style={[styles.loginBackText, { color: subTextColor }]}>Remember password? </Text>
                            <Text style={[styles.loginBackLink, { color: primaryColor }]}>Back to Login</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgCircle: { position: 'absolute', width: scale(300), height: scale(300), borderRadius: scale(150), zIndex: -1 },
    scrollInner: { paddingHorizontal: scale(25), paddingBottom: verticalScale(40), flexGrow: 1 },
    backBtn: { width: scale(46), height: scale(46), borderRadius: scale(16), alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, marginBottom: verticalScale(30) },
    heroSection: { alignItems: 'center', marginBottom: verticalScale(40) },
    iconBox: { width: scale(100), height: scale(100), borderRadius: scale(50), alignItems: 'center', justifyContent: 'center', marginBottom: verticalScale(20) },
    heroText: { fontSize: moderateScale(28), fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    heroSub: { fontSize: moderateScale(14), fontWeight: '600', textAlign: 'center', lineHeight: 22, maxWidth: '90%' },
    formCard: { width: '100%' },
    cardInner: { borderRadius: scale(32), padding: scale(25), elevation: 5, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    inputGroup: {},
    inputLabel: { fontSize: moderateScale(12), fontWeight: '800', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputField: { height: verticalScale(56), borderRadius: scale(16), borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), gap: scale(12) },
    textInput: { flex: 1, height: '100%', fontSize: moderateScale(16), fontWeight: '600' },
    submitBtnContainer: { marginTop: verticalScale(25) },
    submitBtn: { height: verticalScale(60), borderRadius: scale(20), alignItems: 'center', justifyContent: 'center' },
    submitBtnText: { color: '#FFF', fontSize: moderateScale(17), fontWeight: '900', letterSpacing: 0.5 },
    loginBackBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: verticalScale(30) },
    loginBackText: { fontSize: moderateScale(14), fontWeight: '600' },
    loginBackLink: { fontSize: moderateScale(14), fontWeight: '800' },
});
