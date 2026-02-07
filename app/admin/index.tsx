import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SOUTHERN_VEGETABLES, Vegetable } from '../../constants/Vegetables';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { adminApi, inventoryApi, vegApi } from '../../services/api';
import { KEYS, Storage } from '../../services/storage';
import { getVegetableImage } from '../../utils/imageHelper';
import { NotificationManager } from '../../utils/notificationManager';
import { moderateScale, scale, verticalScale, wp } from '../../utils/responsive';

// Dynamic import or check for expo-image-picker to prevent bundle crash
let ImagePicker: any = null;
try {
    ImagePicker = require('expo-image-picker');
} catch (e) {
    console.log('expo-image-picker not found');
}

// Removed native DateTimePicker to resolve bundle issues

export default function AdminScreen() {
    const { logout } = useAuth();
    const navigation = useNavigation();
    const { t, isDark, language } = useAppTheme();

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
                    <Ionicons name="log-out-outline" size={24} color={isDark ? '#FF6B6B' : '#f44336'} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, logout, isDark]);

    const [allVegetables, setAllVegetables] = useState<Vegetable[]>([]);
    const [loading, setLoading] = useState(false);

    // Merchant Profile States
    const [merchantName, setMerchantName] = useState('');
    const [merchantLogo, setMerchantLogo] = useState('');
    const [merchantNumber, setMerchantNumber] = useState('');

    // Reminder States
    const [reminderTime, setReminderTime] = useState({ hour: 4, minute: 0 });
    const [showClockModal, setShowClockModal] = useState(false);
    const [tempTime, setTempTime] = useState({ hour: 4, minute: 0 });

    // User Creation States
    const [showUserModal, setShowUserModal] = useState(false);
    const [newShopUser, setNewShopUser] = useState({ username: '', password: '', shopName: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load local merchant info
            const [savedTime, mName, mLogo, mNumber] = await Promise.all([
                Storage.getItem(KEYS.REMINDER_TIME),
                Storage.getItem(KEYS.MERCHANT_NAME),
                Storage.getItem(KEYS.MERCHANT_LOGO),
                Storage.getItem(KEYS.MERCHANT_NUMBER)
            ]);

            if (savedTime) setReminderTime(savedTime);
            if (mName) setMerchantName(mName);
            if (mLogo) setMerchantLogo(mLogo);
            if (mNumber) setMerchantNumber(mNumber);
            setTempTime(savedTime || { hour: 4, minute: 0 });

            // Fetch Vegetables from API
            try {
                const response = await vegApi.getAll();
                if (response.data && response.data.length > 0) {
                    setAllVegetables(response.data);
                } else {
                    setAllVegetables(SOUTHERN_VEGETABLES);
                }
            } catch (apiError) {
                console.log('API Error loading vegetables, using fallback');
                const savedVeggies = await Storage.getItem(KEYS.VEGETABLES);
                setAllVegetables(savedVeggies && savedVeggies.length > 0 ? savedVeggies : SOUTHERN_VEGETABLES);
            }
        } catch (error) {
            setAllVegetables(SOUTHERN_VEGETABLES);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (id: string) => {
        setAllVegetables(prev => prev.map(v =>
            v.id === id ? { ...v, selected: !v.selected } : v
        ));
    };

    const updatePrice = (id: string, price: string) => {
        const numPrice = parseFloat(price) || 0;
        setAllVegetables(prev => prev.map(v =>
            v.id === id ? { ...v, price: numPrice } : v
        ));
    };

    const saveChanges = async () => {
        setLoading(true);
        try {
            // 1. Sync Inventory with Backend
            const inventoryData = allVegetables.filter(v => v.selected).map(v => ({
                veg_id: v.id,
                price: v.price,
                stock: 100 // Default stock if not specified
            }));

            try {
                await inventoryApi.setup(inventoryData);
            } catch (apiError) {
                console.warn('Inventory setup API failed, saving locally only');
            }

            // 2. Save Locally
            await Promise.all([
                Storage.setItem(KEYS.VEGETABLES, allVegetables),
                Storage.setItem(KEYS.TOP_VEGETABLES, allVegetables.filter(v => v.selected)),
                Storage.setItem(KEYS.REMINDER_TIME, reminderTime),
                Storage.setItem(KEYS.MERCHANT_NAME, merchantName),
                Storage.setItem(KEYS.MERCHANT_LOGO, merchantLogo),
                Storage.setItem(KEYS.MERCHANT_NUMBER, merchantNumber)
            ]);

            const permitted = await NotificationManager.requestPermissions();
            if (permitted) {
                await NotificationManager.scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
            }

            Alert.alert(t.APP_NAME, language === 'Tamil' ? 'மாற்றங்கள் சேமிக்கப்பட்டன!' : "All changes saved successfully!");
        } catch (error) {
            Alert.alert(t.APP_NAME, "Error saving changes. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newShopUser.username || !newShopUser.password || !newShopUser.shopName) {
            Alert.alert("Error", "Please fill all fields for new user");
            return;
        }

        setLoading(true);
        try {
            await adminApi.createUser({ ...newShopUser, role: 'user' });
            Alert.alert("Success", "New shop user created successfully!");
            setShowUserModal(false);
            setNewShopUser({ username: '', password: '', shopName: '' });
        } catch (error) {
            Alert.alert("Error", "Failed to create user. It might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        if (!ImagePicker) {
            Alert.alert('Library Missing', 'Please install expo-image-picker to use this feature.');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setMerchantLogo(result.assets[0].uri);
        }
    };

    const ModernClockModal = () => (
        <Modal visible={showClockModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.clockCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                    <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#333' }]}>Set Reminder Time</Text>

                    <View style={styles.clockControls}>
                        <View style={styles.clockColumn}>
                            <TouchableOpacity onPress={() => setTempTime(p => ({ ...p, hour: (p.hour + 1) % 24 }))}>
                                <Ionicons name="chevron-up" size={30} color="#2E7D32" />
                            </TouchableOpacity>
                            <Text style={[styles.clockText, { color: isDark ? '#FFF' : '#333' }]}>
                                {tempTime.hour.toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity onPress={() => setTempTime(p => ({ ...p, hour: (p.hour + 23) % 24 }))}>
                                <Ionicons name="chevron-down" size={30} color="#2E7D32" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.clockText, { color: isDark ? '#FFF' : '#333' }]}>:</Text>
                        <View style={styles.clockColumn}>
                            <TouchableOpacity onPress={() => setTempTime(p => ({ ...p, minute: (p.minute + 5) % 60 }))}>
                                <Ionicons name="chevron-up" size={30} color="#2E7D32" />
                            </TouchableOpacity>
                            <Text style={[styles.clockText, { color: isDark ? '#FFF' : '#333' }]}>
                                {tempTime.minute.toString().padStart(2, '0')}
                            </Text>
                            <TouchableOpacity onPress={() => setTempTime(p => ({ ...p, minute: (p.minute + 55) % 60 }))}>
                                <Ionicons name="chevron-down" size={30} color="#2E7D32" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowClockModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            setReminderTime(tempTime);
                            setShowClockModal(false);
                        }}>
                            <Text style={styles.confirmBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const dynamicStyles = {
        container: [styles.container, { backgroundColor: isDark ? '#121212' : '#F8F9FA' }],
        header: [styles.header, { color: isDark ? '#E0E0E0' : '#333' }],
        subHeader: [styles.subHeader, { color: isDark ? '#EEE' : '#444' }],
        card: [styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', shadowColor: isDark ? '#000' : '#999' }],
        input: [styles.input, {
            backgroundColor: isDark ? '#2C2C2C' : '#FFF',
            borderColor: isDark ? '#444' : '#DDD',
            color: isDark ? '#FFF' : '#333'
        }],
        vegItem: (selected: boolean) => [
            styles.vegItem,
            { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
            selected && { borderColor: '#2E7D32', backgroundColor: isDark ? '#1B3F21' : '#E8F5E9' }
        ],
        vegName: [styles.vegName, { color: isDark ? '#CCC' : '#444' }],
        priceInput: [styles.priceInput, {
            backgroundColor: isDark ? '#3D3D3D' : '#F5F5F5',
            color: isDark ? '#FFF' : '#333',
            borderColor: '#2E7D32'
        }]
    };

    const UserModal = () => (
        <Modal visible={showUserModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.clockCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#333' }]}>Create Shop User</Text>
                        <TouchableOpacity onPress={() => setShowUserModal(false)}>
                            <Ionicons name="close" size={24} color={isDark ? '#AAA' : '#666'} />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={dynamicStyles.input}
                        placeholder="Username"
                        placeholderTextColor="#888"
                        value={newShopUser.username}
                        onChangeText={(v) => setNewShopUser(prev => ({ ...prev, username: v }))}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={dynamicStyles.input}
                        placeholder="Shop Name"
                        placeholderTextColor="#888"
                        value={newShopUser.shopName}
                        onChangeText={(v) => setNewShopUser(prev => ({ ...prev, shopName: v }))}
                    />
                    <View style={[styles.passwordContainer, { width: '100%', marginBottom: 15 }]}>
                        <TextInput
                            style={[dynamicStyles.input, { flex: 1, marginBottom: 0 }]}
                            placeholder="Password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={newShopUser.password}
                            onChangeText={(v) => setNewShopUser(prev => ({ ...prev, password: v }))}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.confirmBtn, { width: '100%', height: 50, marginTop: 10 }]}
                        onPress={handleCreateUser}
                    >
                        <Text style={styles.confirmBtnText}>Create User</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={dynamicStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.sectionHeader}>
                    <Text style={dynamicStyles.header}>{language === 'Tamil' ? 'நிர்வாகக் கட்டுப்பாடு' : 'Admin Controls'}</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={saveChanges}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>{loading ? '...' : (language === 'Tamil' ? 'சேமி' : "Save All")}</Text>
                    </TouchableOpacity>
                </View>

                {/* Merchant Profile */}
                <View style={[dynamicStyles.card, { marginBottom: 20 }]}>
                    <Text style={dynamicStyles.subHeader}>{language === 'Tamil' ? 'வணிகர் விவரம்' : 'Merchant Profile'}</Text>
                    <TextInput
                        style={dynamicStyles.input}
                        placeholder="Merchant Name"
                        placeholderTextColor="#888"
                        value={merchantName}
                        onChangeText={setMerchantName}
                    />

                    <View style={styles.logoPickerContainer}>
                        <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
                            <Ionicons name="image-outline" size={24} color="#2E7D32" />
                            <Text style={styles.pickImageText}>
                                {merchantLogo ? 'Change Logo' : 'Select Logo from Gallery'}
                            </Text>
                        </TouchableOpacity>
                        {merchantLogo ? (
                            <Image source={{ uri: merchantLogo }} style={styles.profileLogoPreview} />
                        ) : null}
                    </View>

                    <TextInput
                        style={dynamicStyles.input}
                        placeholder="Phone Number"
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        value={merchantNumber}
                        onChangeText={setMerchantNumber}
                    />
                </View>

                {/* Reminder Settings */}
                <View style={[dynamicStyles.card, { marginBottom: 20 }]}>
                    <Text style={dynamicStyles.subHeader}>{language === 'Tamil' ? 'தினசரி நினைவூட்டல்' : 'Daily Price Reminder'}</Text>
                    <TouchableOpacity
                        style={styles.clockPickerBtn}
                        onPress={() => {
                            setTempTime(reminderTime);
                            setShowClockModal(true);
                        }}
                    >
                        <Ionicons name="alarm-outline" size={28} color="#2E7D32" />
                        <Text style={[styles.clockDisplay, { color: isDark ? '#FFF' : '#333' }]}>
                            {reminderTime.hour.toString().padStart(2, '0')}:{reminderTime.minute.toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.editBtnText}>Change</Text>
                    </TouchableOpacity>
                </View>

                {/* Create Shop User */}
                <View style={[dynamicStyles.card, { marginBottom: 20 }]}>
                    <Text style={dynamicStyles.subHeader}>{language === 'Tamil' ? 'புதிய பயனர் உருவாக்கம்' : 'User Management'}</Text>
                    <TouchableOpacity
                        style={styles.addUserBtn}
                        onPress={() => setShowUserModal(true)}
                    >
                        <Ionicons name="person-add-outline" size={24} color="#2E7D32" />
                        <Text style={styles.addUserText}>Add New Shop User</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={dynamicStyles.header}>{language === 'Tamil' ? 'காய்கறிகளை நிர்வகிக்கவும்' : 'Manage Vegetables'}</Text>
                        <Text style={[styles.countText, { color: isDark ? '#888' : '#666' }]}>
                            {allVegetables.filter(v => v.selected).length} Favorites
                        </Text>
                    </View>
                </View>

                <View style={styles.vegGrid}>
                    {allVegetables.map(item => (
                        <View key={item.id} style={dynamicStyles.vegItem(!!item.selected)}>
                            <TouchableOpacity
                                style={styles.favoriteBadge}
                                onPress={() => toggleFavorite(item.id)}
                            >
                                <Ionicons
                                    name={item.selected ? "star" : "star-outline"}
                                    size={20}
                                    color={item.selected ? "#FFD600" : (isDark ? "#555" : "#CCC")}
                                />
                            </TouchableOpacity>

                            <Image source={getVegetableImage(item.image, item.name)} style={styles.vegImage} />
                            <Text style={dynamicStyles.vegName} numberOfLines={1}>
                                {language === 'Tamil' ? item.tamilName : item.name}
                            </Text>

                            <View style={styles.priceContainer}>
                                <Text style={[styles.currency, { color: isDark ? '#FFF' : '#333' }]}>₹</Text>
                                <TextInput
                                    style={dynamicStyles.priceInput}
                                    keyboardType="numeric"
                                    value={item.price.toString()}
                                    onChangeText={(val) => updatePrice(item.id, val)}
                                />
                                <Text style={[styles.unit, { color: isDark ? '#888' : '#666' }]}>/kg</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
            <ModernClockModal />
            <UserModal />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: scale(15) },
    header: { fontSize: moderateScale(20), fontWeight: '800', marginBottom: verticalScale(5) },
    subHeader: { fontSize: moderateScale(16), fontWeight: '700', marginBottom: verticalScale(12) },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: verticalScale(10) },
    countText: { fontSize: moderateScale(12), fontWeight: '600' },
    card: { borderRadius: scale(20), padding: scale(18), elevation: 5, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: scale(6) },
    input: { height: verticalScale(50), borderWidth: scale(1), borderRadius: scale(12), marginBottom: verticalScale(12), paddingHorizontal: scale(15), fontSize: moderateScale(15) },
    logoPickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(15),
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: scale(10),
        borderRadius: scale(12),
        borderWidth: scale(1),
        borderColor: '#EEE',
    },
    pickImageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pickImageText: {
        marginLeft: scale(10),
        color: '#2E7D32',
        fontWeight: '600',
        fontSize: moderateScale(14),
    },
    profileLogoPreview: { width: scale(60), height: scale(60), borderRadius: scale(30), marginLeft: scale(10) },
    clockPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(15),
        borderRadius: scale(15),
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderWidth: scale(1),
        borderColor: '#2E7D32',
    },
    clockDisplay: { fontSize: moderateScale(28), fontWeight: '900', marginLeft: scale(15), flex: 1 },
    editBtnText: { color: '#2E7D32', fontWeight: 'bold' },
    saveButton: { backgroundColor: '#2E7D32', paddingVertical: verticalScale(10), paddingHorizontal: scale(22), borderRadius: scale(25) },
    saveButtonText: { color: '#fff', fontSize: moderateScale(15), fontWeight: 'bold' },
    vegGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    vegItem: { width: '48%', borderRadius: scale(20), padding: scale(12), marginBottom: verticalScale(15), alignItems: 'center', borderWidth: scale(1), borderColor: '#EEE' },
    vegImage: { width: scale(90), height: scale(90), borderRadius: scale(45), marginBottom: verticalScale(10) },
    vegName: { fontSize: moderateScale(14), fontWeight: 'bold', marginBottom: verticalScale(12), textAlign: 'center' },
    favoriteBadge: { position: 'absolute', top: verticalScale(12), right: scale(12), zIndex: 1 },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(46, 125, 50, 0.08)',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(12),
        borderRadius: scale(15),
        borderWidth: scale(1),
        borderColor: 'rgba(46, 125, 50, 0.2)',
        marginTop: verticalScale(5)
    },
    priceInput: {
        width: scale(80),
        height: verticalScale(45),
        borderRadius: scale(12),
        borderWidth: scale(1.5),
        textAlign: 'center',
        fontSize: moderateScale(20),
        fontWeight: '900',
        marginHorizontal: scale(8),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: scale(2),
    },
    currency: { fontSize: moderateScale(20), fontWeight: '900' },
    unit: { fontSize: moderateScale(13), fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    clockCard: { width: wp(85), borderRadius: scale(30), padding: scale(25), alignItems: 'center' },
    modalTitle: { fontSize: moderateScale(20), fontWeight: '800', marginBottom: verticalScale(25) },
    clockControls: { flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(30) },
    clockColumn: { alignItems: 'center', marginHorizontal: scale(15) },
    clockText: { fontSize: moderateScale(45), fontWeight: '900', marginVertical: verticalScale(10) },
    modalButtons: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
    cancelBtn: { flex: 1, padding: scale(15), alignItems: 'center' },
    cancelBtnText: { color: '#888', fontWeight: 'bold', fontSize: moderateScale(16) },
    confirmBtn: { flex: 1, backgroundColor: '#2E7D32', padding: scale(15), borderRadius: scale(15), alignItems: 'center' },
    confirmBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: moderateScale(16) },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginBottom: verticalScale(20)
    },
    addUserBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(15),
        borderRadius: scale(15),
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderWidth: scale(1),
        borderColor: '#2E7D32',
    },
    addUserText: {
        marginLeft: scale(15),
        fontSize: moderateScale(16),
        fontWeight: '700',
        color: '#2E7D32'
    }
});
