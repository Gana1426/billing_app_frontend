import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Text,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
    SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const router = useRouter();
    const { t, theme, toggleLanguage, toggleTheme, language, isDark } = useAppTheme();

    const logoScale = useSharedValue(1);

    useEffect(() => {
        logoScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 2000 }),
                withTiming(1, { duration: 2000 })
            ),
            -1,
            true
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
            const response = await authApi.login({ username, password });
            const { access_token } = response.data;

            // Construct user object since API only returns token
            const role = username.toLowerCase() === 'admin' ? 'admin' : 'user';
            const user = {
                username,
                role: role as 'admin' | 'user',
                shopName: role === 'user' ? 'Vegetable Store' : undefined
            };

            await login(user, access_token);

            if (user.role === 'admin') {
                router.replace('/admin');
            } else {
                router.replace('/shop/mode-selection');
            }
        } catch (error) {
            console.log('API Error, using mock login logic for fallback/testing');
            // Fallback for demo/testing if backend not reachable
            if (username === 'admin' && password === 'admin123') {
                await login({ username: 'admin', role: 'admin' }, 'mock-token');
                router.replace('/admin');
            } else if (username === 'user' && password === 'user123') {
                await login({ username: 'user', role: 'user', shopName: 'Vegetable Store' }, 'mock-token');
                router.replace('/shop/mode-selection');
            } else {
                Alert.alert(t.APP_NAME, t.INVALID_CREDENTIALS);
            }
        }
    };

    const containerStyle = [
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#F8F9FA' }
    ];

    const inputContainerStyle = [
        styles.inputContainer,
        {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E0E0E0'
        }
    ];

    const textColor = isDark ? '#FFFFFF' : '#1A1C1E';
    const placeholderColor = isDark ? '#888' : '#9CA3AF';
    const labelColor = isDark ? '#BBB' : '#6B7280';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={containerStyle}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header Actions (Language & Theme) */}
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            toggleLanguage();
                        }}
                        style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#E8F5E9', marginRight: 10 }]}
                    >
                        <Text style={[styles.langText, { color: isDark ? '#FFF' : '#2E7D32' }]}>
                            {language === 'English' ? 'தமிழ்' : 'Eng'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            toggleTheme();
                        }}
                        style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#FFF' }]}
                    >
                        <Ionicons
                            name={isDark ? "sunny" : "moon"}
                            size={18}
                            color={isDark ? "#FFD600" : "#1A1C1E"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Background Decoration */}
                <View style={[styles.bgDecorCircle, { backgroundColor: isDark ? '#1A3320' : '#E8F5E9' }]} />

                <View style={styles.content}>
                    <Animated.View entering={FadeInDown.delay(200).duration(1000)} style={styles.logoContainer}>
                        <Animated.View style={[animatedLogoStyle, styles.logoWrapper]}>
                            <View style={styles.logoCircle}>
                                <MaterialCommunityIcons name="leaf" size={40} color="#FFFFFF" />
                            </View>
                            <View style={styles.logoBadge}>
                                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                            </View>
                        </Animated.View>

                        <Text style={[styles.welcomeText, { color: textColor }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: labelColor }]}>
                            {language === 'English' ? 'Sign in to continue managing your shop' : 'உங்கள் கடையை நிர்வகிக்க உள்நுழையவும்'}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.formContainer}>

                        {/* Username */}
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.label, { color: labelColor }]}>{t.USERNAME.toUpperCase()}</Text>
                            <View style={inputContainerStyle}>
                                <Ionicons name="person-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
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
                            <Text style={[styles.label, { color: labelColor }]}>{t.PASSWORD.toUpperCase()}</Text>
                            <View style={inputContainerStyle}>
                                <Ionicons name="lock-closed-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
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
                            style={styles.loginButton}
                            onPress={handleLogin}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.loginButtonText}>{t.LOGIN}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <View style={styles.signupLinkContainer}>
                            <Text style={[styles.signupText, { color: labelColor }]}>
                                {language === 'English' ? "Don't have an account? " : "கணக்கு இல்லையா? "}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/signup')}>
                                <Text style={styles.signupLinkText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>

                <Animated.View
                    entering={FadeInUp.delay(800)}
                    style={styles.footer}
                >
                    <Text style={[styles.footerText, { color: labelColor }]}>
                        © 2026 {t.APP_NAME}
                    </Text>
                </Animated.View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
        zIndex: 10,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    langText: {
        fontSize: 12,
        fontWeight: '700',
    },
    bgDecorCircle: {
        position: 'absolute',
        top: -120,
        left: -80,
        width: 350,
        height: 350,
        borderRadius: 175,
        opacity: 0.6,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoWrapper: {
        width: 90,
        height: 90,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#268753',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#268753',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        borderWidth: 3,
        borderColor: '#E8F5E9'
    },
    logoBadge: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFA000',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 20,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 5,
    },
    loginButton: {
        height: 60,
        backgroundColor: '#FFA000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#FFA000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    signupLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    signupText: {
        fontSize: 14,
        fontWeight: '500',
    },
    signupLinkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#00C853',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 11,
        fontWeight: '600',
        opacity: 0.7,
    },
});
