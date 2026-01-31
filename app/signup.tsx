import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Text,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView
} from 'react-native';
import { authApi, API_BASE_URL } from '../services/api';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SOUTHERN_VEGETABLES } from '../constants/Vegetables';

const { width } = Dimensions.get('window');

export default function SignupScreen() {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [shopName, setShopName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedVegs, setSelectedVegs] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const router = useRouter();
    const { t, isDark, language, toggleTheme } = useAppTheme();

    const filteredVegetables = SOUTHERN_VEGETABLES.filter(veg =>
        veg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        veg.tamilName.includes(searchQuery)
    );

    const toggleVegetable = (id: string) => {
        Haptics.selectionAsync();
        setSelectedVegs(prev => {
            if (prev.includes(id)) {
                return prev.filter(v => v !== id);
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
            await authApi.signup({
                username,
                password,
                shop_name: shopName,
                role: 'shop_user',
                top_selling_vegetables: selectedVegs
            });
            Alert.alert("Success", "Account created successfully! Please login.", [
                { text: "OK", onPress: () => router.replace('/login') }
            ]);
        } catch (error: any) {
            console.error(error);
            let errorMessage = "Signup failed. Try again.";

            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map((e: any) => e.msg).join('\n');
                } else {
                    errorMessage = error.response.data.detail;
                }
            } else if (error.message) {
                errorMessage = `${error.message}`;
                if (error.code === 'ERR_NETWORK') {
                    errorMessage += `\n\nCould not connect to server.\nCheck if backend is running at:\n${API_BASE_URL}`;
                }
            }

            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
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

    const renderStep1 = () => (
        <Animated.View entering={FadeInUp.delay(200)} exiting={SlideOutLeft} style={styles.formContainer}>

            {/* Shop Name */}
            <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: labelColor }]}>SHOP NAME</Text>
                <View style={inputContainerStyle}>
                    <MaterialCommunityIcons name="store-outline" size={22} color={placeholderColor} style={styles.inputIcon} />
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
                <Text style={[styles.label, { color: labelColor }]}>{t.USERNAME.toUpperCase()}</Text>
                <View style={inputContainerStyle}>
                    <Ionicons name="phone-portrait-outline" size={22} color={placeholderColor} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter 10 digit number" // Assuming standard usage, though field is username
                        placeholderTextColor={placeholderColor}
                        autoCapitalize="none"
                        keyboardType="default"
                    />
                </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: labelColor }]}>{t.PASSWORD.toUpperCase()}</Text>
                <View style={inputContainerStyle}>
                    <Ionicons name="lock-closed-outline" size={22} color={placeholderColor} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, { color: textColor, flex: 1 }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Create a password"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
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
            >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked, { borderColor: isDark ? '#666' : '#D1D5DB' }]}>
                    {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.termsText, { color: labelColor }]}>
                    I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.signupButton}
                onPress={handleNext}
                activeOpacity={0.9}
            >
                <Text style={styles.signupButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
                <Text style={[styles.loginText, { color: labelColor }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text style={styles.loginLinkText}>Login</Text>
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

            <View style={[inputContainerStyle, { marginBottom: 15 }]}>
                <Ionicons name="search-outline" size={20} color={placeholderColor} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search vegetables..."
                    placeholderTextColor={placeholderColor}
                />
            </View>

            <FlatList
                data={filteredVegetables}
                keyExtractor={item => item.id}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => {
                    const isSelected = selectedVegs.includes(item.id);
                    return (
                        <TouchableOpacity
                            style={[
                                styles.vegItem,
                                isSelected && styles.vegItemSelected,
                                { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#333' : '#E5E7EB' }
                            ]}
                            onPress={() => toggleVegetable(item.id)}
                        >
                            <Image source={{ uri: item.image }} style={styles.vegImage} />
                            <View style={[
                                styles.overlay,
                                isSelected && { backgroundColor: 'rgba(255, 179, 0, 0.2)' }
                            ]}>
                                {isSelected && <View style={styles.checkBadge}><Ionicons name="checkmark" size={12} color="#FFF" /></View>}
                            </View>
                            <Text
                                numberOfLines={1}
                                style={[
                                    styles.vegName,
                                    { color: textColor }
                                ]}
                            >
                                {language === 'Tamil' ? item.tamilName : item.name}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.backButton, { borderColor: isDark ? '#444' : '#E5E7EB' }]}
                    onPress={handleBack}
                >
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.completeButton, loading && { opacity: 0.7 }]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.signupButtonText}>{loading ? 'Creating...' : 'Complete Signup'}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={containerStyle}
        >
            <SafeAreaView style={styles.safeArea}>

                {/* Header Actions */}
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            toggleTheme();
                        }}
                        style={styles.themeButton}
                    >
                        <View style={[styles.themeIconBg, { backgroundColor: isDark ? '#333' : '#FFF' }]}>
                            <Ionicons
                                name={isDark ? "sunny" : "moon"}
                                size={18}
                                color={isDark ? "#FFD600" : "#1A1C1E"}
                            />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {step === 1 && (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.headerContainer}>
                            <View style={styles.logoWrapper}>
                                <View style={styles.logoCircle}>
                                    <MaterialCommunityIcons name="storefront-outline" size={32} color="#FFF" />
                                </View>
                                <View style={styles.logoBadge}>
                                    <Ionicons name="leaf" size={12} color="#FFF" />
                                </View>
                            </View>

                            <Text style={[styles.title, { color: textColor }]}>
                                {language === 'Tamil' ? 'கணக்கை உருவாக்கவும்' : 'Create Account'}
                            </Text>
                            <Text style={[styles.subtitle, { color: labelColor }]}>
                                Join our wholesale community and simplify your daily vegetable billing.
                            </Text>
                        </Animated.View>
                    )}

                    {step === 1 ? renderStep1() : renderStep2()}
                </View>
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
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    themeButton: {
        padding: 5,
    },
    themeIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        justifyContent: 'center',
        paddingBottom: 20
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: -40
    },
    logoWrapper: {
        width: 80,
        height: 80,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#268753', // Deep Green
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#268753',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        borderWidth: 2,
        borderColor: '#E8F5E9'
    },
    logoBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#00C853',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '400',
        maxWidth: 280,
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
        height: 56,
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
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 5,
        paddingHorizontal: 5
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#FFA000',
        borderColor: '#FFA000',
    },
    termsText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    linkText: {
        color: '#00C853',
        fontWeight: '600',
    },
    signupButton: {
        height: 58,
        backgroundColor: '#FFA000', // Amber/Orange
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#FFA000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    signupButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    loginLinkContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    loginText: {
        fontSize: 14,
        fontWeight: '500',
    },
    loginLinkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#00C853', // Green
    },
    // Step 2 Styles
    step2Container: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 5,
    },
    stepSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    vegItem: {
        flex: 1 / 3,
        margin: 6,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        alignItems: 'center',
        height: 120,
        backgroundColor: '#FFF',
    },
    vegItemSelected: {
        borderColor: '#FFA000',
        borderWidth: 2,
    },
    vegImage: {
        width: '100%',
        height: 85,
        resizeMode: 'cover',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFA000',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        elevation: 2,
    },
    vegName: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 15,
        paddingBottom: 20,
    },
    backButton: {
        width: 58,
        height: 58,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeButton: {
        flex: 1,
        height: 58,
        backgroundColor: '#FFA000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
});
