import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Platform,
    ScrollView,
    StatusBar as RNStatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { moderateScale, scale, verticalScale } from '../../utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function ModeSelectionScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme, theme } = useAppTheme();
    const insets = useSafeAreaInsets();

    const handleModeSelect = (mode: 'wholesale' | 'retail') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Navigate to shop with the selected mode
        router.push({ pathname: '/shop', params: { mode } });
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        logout();
        router.replace('/login');
    };

    const primaryColor = '#00A86B';
    const accentColor = '#FFA000';
    const textColor = isDark ? '#FFFFFF' : '#1A1C1E';
    const labelColor = isDark ? '#BBB' : '#6B7280';
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F4F6F9' }]}>
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#121212" : "#F4F6F9"} />

            {/* Decorative Background */}
            <View style={[styles.bgDecorCircle, { backgroundColor: isDark ? '#1A3320' : '#E8F5E9', top: -verticalScale(50), right: -scale(100) }]} />
            <View style={[styles.bgDecorCircle, { backgroundColor: isDark ? '#1A3320' : '#E8F5E9', top: verticalScale(100), left: -scale(150), width: scale(300), height: scale(300), borderRadius: scale(150) }]} />

            <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0) }]}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#E0F2F1' }]}>
                        <Text style={[styles.avatarText, { color: primaryColor }]}>
                            {user?.username?.charAt(0).toUpperCase() || 'A'}
                        </Text>
                    </View>
                    <View>
                        <Text style={[styles.greeting, { color: labelColor }]}>Welcome Back,</Text>
                        <Text style={[styles.userName, { color: textColor }]}>{user?.username || 'Admin'}</Text>
                    </View>
                </View>

                <View style={styles.topControls}>
                    <TouchableOpacity
                        onPress={() => {
                            Haptics.selectionAsync();
                            toggleTheme();
                        }}
                        style={[styles.iconButton, { backgroundColor: isDark ? '#333' : '#FFF' }]}
                    >
                        <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={isDark ? "#FFD600" : "#1A1C1E"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={[styles.iconButton, { backgroundColor: '#FEE2E2', marginLeft: scale(10) }]}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Shop Banner */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
                    <View style={[styles.logoContainer, { borderColor: isDark ? '#333' : '#E0E0E0', backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                        <View style={[styles.logoBox, { backgroundColor: primaryColor }]}>
                            <MaterialCommunityIcons name="storefront" size={24} color="#FFF" />
                        </View>
                        <View style={styles.brandTextContainer}>
                            <Text style={[styles.brandName, { color: textColor }]}>
                                {user?.shopName || 'MY VEGETABLE SHOP'}
                            </Text>
                            <Text style={[styles.brandSub, { color: labelColor }]}>
                                BILLING DASHBOARD
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.sectionTitle, { color: labelColor }]}>SELECT MODE</Text>
                </Animated.View>

                {/* Cards Container */}
                <View style={styles.cardsContainer}>
                    {/* Wholesale Card */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: cardBg }]}
                            onPress={() => handleModeSelect('wholesale')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardRibbonOrange} />
                            <View style={styles.cardContent}>
                                <View style={[styles.iconBox, { backgroundColor: '#FFF8E1' }]}>
                                    <MaterialCommunityIcons name="package-variant-closed" size={32} color="#FFA000" />
                                </View>
                                <View style={styles.cardTextContent}>
                                    <Text style={[styles.cardTitle, { color: textColor }]}>Wholesale</Text>
                                    <Text style={[styles.cardSubtitle, { color: '#FFA000' }]}>மொத்த விற்பனை</Text>
                                    <Text style={[styles.cardDesc, { color: labelColor }]}>
                                        Bulk billing with crate management
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={labelColor} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Retail Card */}
                    <Animated.View entering={FadeInUp.delay(400).springify()} style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: cardBg }]}
                            onPress={() => handleModeSelect('retail')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardRibbonGreen} />
                            <View style={styles.cardContent}>
                                <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                                    <MaterialCommunityIcons name="shopping" size={32} color={primaryColor} />
                                </View>
                                <View style={styles.cardTextContent}>
                                    <Text style={[styles.cardTitle, { color: textColor }]}>Retail</Text>
                                    <Text style={[styles.cardSubtitle, { color: primaryColor }]}>சில்லரை விற்பனை</Text>
                                    <Text style={[styles.cardDesc, { color: labelColor }]}>
                                        Quick billing for individual customers
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color={labelColor} />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    bgDecorCircle: {
        position: 'absolute',
        width: scale(300),
        height: scale(300),
        borderRadius: scale(150),
        opacity: 0.5,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(15),
        marginBottom: verticalScale(10)
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(12),
    },
    avatar: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(14),
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: moderateScale(18),
        fontWeight: 'bold',
    },
    greeting: {
        fontSize: moderateScale(11),
        fontWeight: '600',
        marginBottom: verticalScale(2)
    },
    userName: {
        fontSize: moderateScale(16),
        fontWeight: '800',
    },
    topControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    scrollContent: {
        paddingBottom: verticalScale(40),
        paddingHorizontal: scale(20),
    },
    header: {
        marginBottom: verticalScale(25),
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(25),
        paddingVertical: verticalScale(15),
        paddingHorizontal: scale(20),
        borderRadius: scale(20),
        borderWidth: scale(1),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    logoBox: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale(15),
    },
    brandTextContainer: {
        flex: 1,
    },
    brandName: {
        fontSize: moderateScale(16),
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    brandSub: {
        fontSize: moderateScale(10),
        fontWeight: '600',
        marginTop: verticalScale(2),
        letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: moderateScale(13),
        fontWeight: '700',
        letterSpacing: 1,
        marginLeft: scale(5)
    },
    cardsContainer: {
        gap: scale(16),
    },
    card: {
        borderRadius: scale(20),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        overflow: 'hidden',
        minHeight: verticalScale(100),
    },
    cardRibbonOrange: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: scale(6),
        backgroundColor: '#FFA000',
    },
    cardRibbonGreen: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: scale(6),
        backgroundColor: '#00A86B',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(20),
        paddingLeft: scale(24) // account for ribbon
    },
    iconBox: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(14),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: scale(16),
    },
    cardTextContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: moderateScale(18),
        fontWeight: '800',
        marginBottom: verticalScale(2)
    },
    cardSubtitle: {
        fontSize: moderateScale(12),
        fontWeight: '700',
        marginBottom: verticalScale(6)
    },
    cardDesc: {
        fontSize: moderateScale(11),
        fontWeight: '500',
    },
});
