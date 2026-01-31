import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    Platform,
    Image,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function ModeSelectionScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme, theme } = useAppTheme();

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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9F9F9' }]}>

            {/* Top Bar: User Info & Controls */}
            <View style={styles.topBar}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={18} color="#6B7280" />
                    </View>
                    <View>
                        <Text style={[styles.loggedInText, { color: isDark ? '#AAA' : '#6B7280' }]}>Hello,</Text>
                        <Text style={[styles.userName, { color: isDark ? '#FFF' : '#1F2937' }]}>{user?.username || 'Admin'}</Text>
                    </View>
                </View>

                <View style={styles.topControls}>
                    <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                        <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={isDark ? "#FFD600" : "#6B7280"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={[styles.iconButton, { marginLeft: 8 }]}>
                        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header / Logo Area */}
                <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <MaterialCommunityIcons name="leaf" size={28} color="#D4A017" />
                        </View>
                        <View style={styles.brandTextContainer}>
                            <Text style={[styles.brandName, { color: isDark ? '#EEE' : '#1A1C1E' }]}>
                                VEG BILLING
                            </Text>
                            <Text style={[styles.brandSub, { color: isDark ? '#888' : '#888' }]}>
                                DASHBOARD
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.pageSubtitle, { color: isDark ? '#FFF' : '#1A1C1E' }]}>
                        Select billing mode
                    </Text>
                </Animated.View>

                {/* Cards Container */}
                <View style={styles.cardsContainer}>
                    {/* Wholesale Card */}
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
                            onPress={() => handleModeSelect('wholesale')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: '#FFF3E0' }]}>
                                    <MaterialCommunityIcons name="package-variant-closed" size={26} color="#FF9800" />
                                </View>
                                <View style={styles.cardTexts}>
                                    <Text style={[styles.cardTitle, { color: isDark ? '#EEE' : '#1A1C1E' }]}>Wholesale</Text>
                                    <Text style={styles.cardSubTitleTamil}>மொத்த விற்பனை</Text>
                                </View>
                                <MaterialCommunityIcons name="storefront-outline" size={50} color={isDark ? '#333' : '#F5F5F5'} style={styles.bgIcon} />
                            </View>

                            <Text style={[styles.cardDesc, { color: isDark ? '#BBB' : '#6B7280' }]}>
                                Bulk orders, crate counting, & merchant rates.
                            </Text>

                            <View style={styles.actionRow}>
                                <Text style={styles.actionLinkOrange}>Enter Portal</Text>
                                <Ionicons name="arrow-forward-circle" size={24} color="#F57C00" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Retail Card */}
                    <Animated.View entering={FadeInUp.delay(500).springify()} style={{ width: '100%' }}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
                            onPress={() => handleModeSelect('retail')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
                                    <MaterialCommunityIcons name="shopping" size={26} color="#2E7D32" />
                                </View>
                                <View style={styles.cardTexts}>
                                    <Text style={[styles.cardTitle, { color: isDark ? '#EEE' : '#1A1C1E' }]}>Retail</Text>
                                    <Text style={styles.cardSubTitleTamilGreen}>சில்லரை விற்பனை</Text>
                                </View>
                                <MaterialCommunityIcons name="basket-outline" size={50} color={isDark ? '#333' : '#F5F5F5'} style={styles.bgIcon} />
                            </View>

                            <Text style={[styles.cardDesc, { color: isDark ? '#BBB' : '#6B7280' }]}>
                                Individual weights, market rates, quick bill.
                            </Text>

                            <View style={styles.actionRow}>
                                <Text style={styles.actionLinkGreen}>Enter Portal</Text>
                                <Ionicons name="arrow-forward-circle" size={24} color="#2E7D32" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loggedInText: {
        fontSize: 10,
        fontWeight: '500',
    },
    userName: {
        fontSize: 14,
        fontWeight: '800',
    },
    topControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 20
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'transparent',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 160, 23, 0.3)',
        borderStyle: 'dashed'
    },
    logoBox: {
        marginRight: 10,
    },
    brandTextContainer: {
        flexDirection: 'column',
    },
    brandName: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    brandSub: {
        fontSize: 9,
        letterSpacing: 3,
        fontWeight: '600',
        marginTop: 2
    },
    pageSubtitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
    },
    cardsContainer: {
        paddingHorizontal: 20,
        gap: 15,
    },
    card: {
        borderRadius: 24,
        padding: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        overflow: 'hidden'
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        position: 'relative',
    },
    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    cardTexts: {
        flex: 1
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    cardSubTitleTamil: {
        fontSize: 11,
        fontWeight: '700',
        color: '#F57C00',
        marginTop: 2
    },
    cardSubTitleTamilGreen: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2E7D32',
        marginTop: 2
    },
    bgIcon: {
        position: 'absolute',
        right: -10,
        top: -10,
        opacity: 0.1,
        transform: [{ rotate: '-10deg' }]
    },
    cardDesc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 15,
        opacity: 0.8
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)'
    },
    actionLinkOrange: {
        color: '#F57C00',
        fontWeight: '700',
        fontSize: 14,
    },
    actionLinkGreen: {
        color: '#2E7D32',
        fontWeight: '700',
        fontSize: 14,
    },
});
