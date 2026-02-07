import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOUTHERN_VEGETABLES } from '../../constants/Vegetables';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { inventoryApi } from '../../services/api';
import { KEYS, Storage } from '../../services/storage';
import { getVegetableImage } from '../../utils/imageHelper';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { moderateScale, scale, verticalScale } from '../../utils/responsive';
import { SyncManager } from '../../utils/syncManager';

// Data Types
type Vegetable = {
    id: string;
    name: string;
    tamilName: string;
    image: string;
    price: number;
    category?: string;
    wholesalePrice?: number;
    retailPrice?: number;
    vegetableId?: number;
};

type BillItem = Vegetable & {
    quantity: number; // in kg
    total: number;
    isCustom?: boolean;
};

const CATEGORIES = ['All Items', 'Favourites', 'Essentials', 'Root Veggies', 'Greens', 'Gourds', 'Others'];

export default function ShopScreen() {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const isWholesale = mode === 'wholesale';
    const insets = useSafeAreaInsets();

    const { t, theme, isDark, toggleTheme, language } = useAppTheme();

    // States
    const [allVegetables, setAllVegetables] = useState<Vegetable[]>([]);
    const [cart, setCart] = useState<BillItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Items');
    const [settingsMenuVisible, setSettingsMenuVisible] = useState(false);

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [billPreviewVisible, setBillPreviewVisible] = useState(false);
    const [selectedVeg, setSelectedVeg] = useState<Vegetable | null>(null);
    const [qtyInput, setQtyInput] = useState('');
    const [priceInput, setPriceInput] = useState('');
    const [customerName, setCustomerName] = useState('');

    useEffect(() => {
        // Hide default header
        navigation.setOptions({ headerShown: false });
        loadVegetables();
    }, []);

    useEffect(() => {
        if (user?.top_selling_vegetables && user.top_selling_vegetables.length > 0) {
            setSelectedCategory('Favourites');
        }
    }, [user]);

    // Helper to assign mock categories based on name for sorting demo
    const assignCategory = (veg: any) => {
        const name = veg.name.toLowerCase();
        if (['onion', 'tomato', 'potato', 'green chilli', 'ginger'].some(k => name.includes(k))) return 'Essentials';
        if (['carrot', 'beetroot', 'radish', 'yam', 'taro', 'colocasia'].some(k => name.includes(k))) return 'Root Veggies';
        if (['spinach', 'coriander', 'curry leaves', 'mint', 'greens'].some(k => name.includes(k))) return 'Greens';
        if (['gourd', 'pumpkin', 'cucumber'].some(k => name.includes(k))) return 'Gourds';
        return 'Others';
    };

    const getRealImage = (name: string, defaultImage: string) => {
        const match = SOUTHERN_VEGETABLES.find(v =>
            v.name.toLowerCase() === name.toLowerCase() ||
            name.toLowerCase().includes(v.name.toLowerCase())
        );
        return match ? match.image : defaultImage;
    };

    const loadVegetables = async () => {
        try {
            // Try fetching from API first
            const res = await inventoryApi.getAll();
            if (res.data && res.data.length > 0) {
                const validated = res.data.map((v: any) => ({
                    ...v,
                    category: v.category || assignCategory(v),
                    image: getRealImage(v.name, v.image?.startsWith('http') ? v.image : 'https://cdn-icons-png.flaticon.com/512/135/135687.png')
                }));
                setAllVegetables(validated);
                Storage.setItem(KEYS.VEGETABLES, validated);
            } else {
                throw new Error("No data");
            }
        } catch (e) {
            // Fallback to cache
            const cached = await Storage.getItem(KEYS.VEGETABLES);
            if (cached) {
                // Ensure cached items also have categories assigned
                const withCategories = cached.map((v: any) => ({
                    ...v,
                    category: v.category || assignCategory(v)
                }));
                setAllVegetables(withCategories);
            }
        }
    };

    // Derived Logic
    const displayVegetables = useMemo(() => {
        return allVegetables.map(v => ({
            ...v,
            price: isWholesale ? (v.wholesalePrice || Math.floor(v.price * 0.75)) : v.price
        }));
    }, [allVegetables, isWholesale]);

    const filteredData = useMemo(() => {
        let data = displayVegetables;

        // Search Filter
        if (searchQuery) {
            data = data.filter(v =>
                v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.tamilName.includes(searchQuery)
            );
        }

        // Category Filter
        if (selectedCategory === 'Favourites') {
            if (user?.top_selling_vegetables && user.top_selling_vegetables.length > 0) {
                data = data.filter(v => user.top_selling_vegetables?.includes(v.id));
            } else {
                data = [];
            }
        } else if (selectedCategory !== 'All Items') {
            data = data.filter(v => v.category === selectedCategory);
        }

        // Apply Priority Sorting
        const priorityItems = ['Green Chilli', 'Tomato', 'Onion', 'Potato', 'Green Beans', 'Carrot'];
        return [...data].sort((a, b) => {
            const aIdx = priorityItems.indexOf(a.name);
            const bIdx = priorityItems.indexOf(b.name);

            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
            if (aIdx !== -1) return -1;
            if (bIdx !== -1) return 1;
            return 0;
        });
    }, [displayVegetables, searchQuery, selectedCategory, user]);

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    // Cart Logic
    const handleUpdateCart = (veg: Vegetable, change: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const existingIdx = cart.findIndex(i => i.id === veg.id);
        let newCart = [...cart];

        if (existingIdx >= 0) {
            const currentItem = newCart[existingIdx];
            const newQty = Math.max(0, parseFloat((currentItem.quantity + change).toFixed(2)));

            if (newQty === 0) {
                newCart.splice(existingIdx, 1);
            } else {
                newCart[existingIdx] = {
                    ...currentItem,
                    quantity: newQty,
                    total: newQty * currentItem.price
                };
            }
        } else if (change > 0) {
            // Add new item
            newCart.push({
                ...veg,
                quantity: change,
                total: change * veg.price
            });
        }
        setCart(newCart);
    };

    const handleManualEntry = (veg: Vegetable) => {
        setSelectedVeg(veg);
        setQtyInput('');
        const existing = cart.find(i => i.id === veg.id);
        setPriceInput(existing ? existing.price.toString() : veg.price.toString());
        setModalVisible(true);
    };

    const confirmManualEntry = () => {
        if (!selectedVeg || !qtyInput) return;
        const qty = parseFloat(qtyInput);
        const price = parseFloat(priceInput);

        if (isNaN(qty) || isNaN(price)) return;

        const newItem: BillItem = {
            ...selectedVeg,
            quantity: qty,
            price: price, // Allow price override
            total: qty * price
        };

        // remove existing if any to replace
        const filtered = cart.filter(i => i.id !== selectedVeg.id);
        setCart([...filtered, newItem]);
        setModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setBillPreviewVisible(true);
    };

    const finalizeBill = async () => {
        // Proceed to print/save
        const billData = {
            shopName: user?.shopName || 'Vegetable Shop',
            logo: 'Logo_bill.png', // User specified logo
            phone: user?.username || '',
            address: 'Southern Market, Tamil Nadu', // Placeholder address
            userName: customerName || 'Guest Customer',
            billNumber: `BILL-${Date.now()}`,
            date: new Date().toLocaleString('en-IN'),
            mode: isWholesale ? 'Wholesale' : 'Retail',
            items: cart.map(item => ({
                name: item.name,
                tamilName: item.tamilName,
                quantity: item.quantity,
                price: item.price,
                total: parseFloat(item.total.toFixed(2))
            })),
            grandTotal: parseFloat(cartTotal.toFixed(2))
        };

        try {
            await SyncManager.queueBill(billData);
            await generateBillPDF(billData);
            Alert.alert("Success", "Bill Generated Successfully");
            setCart([]);
            setBillPreviewVisible(false);
            setCustomerName('');
        } catch (error) {
            Alert.alert("Error", "Could not generate bill");
        }
    };

    const updateCartItemInPreview = (id: string, newQty: string, newPrice: string) => {
        const qty = parseFloat(newQty);
        const price = parseFloat(newPrice);

        if (isNaN(qty) || isNaN(price)) return;

        setCart(prev => prev.map(item =>
            item.id === id
                ? { ...item, quantity: qty, price: price, total: qty * price }
                : item
        ));
    };

    const getItemQty = (id: string) => {
        const item = cart.find(i => i.id === id);
        return item ? item.quantity : 0;
    };

    const navigateToSettings = (type: 'profile' | 'pricing') => {
        setSettingsMenuVisible(false);
        if (type === 'pricing') {
            router.push('/shop/prices');
        } else {
            // Navigate to profile or show alert if not implemented
            Alert.alert(t.APP_NAME, "Profile editing coming soon!");
        }
    };

    // UI Components
    const renderCartBadge = () => (
        <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
        </View>
    );

    const primaryColor = '#00A86B';
    const accentColor = '#FFA000';
    const textColor = isDark ? '#FFFFFF' : '#1A1C1E';
    const labelColor = isDark ? '#BBB' : '#6B7280';
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

    const renderCard = ({ item }: { item: Vegetable }) => {
        const qty = getItemQty(item.id);
        const isSelected = qty > 0;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={[
                    styles.card,
                    { backgroundColor: cardBg, borderColor: isSelected ? primaryColor : (isDark ? '#333' : 'transparent'), borderWidth: isSelected ? scale(1.5) : 0 }
                ]}
                onPress={() => handleManualEntry(item)}
            >
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Feather name="check" size={12} color="#FFF" />
                    </View>
                )}

                <Image
                    source={getVegetableImage(item.image, item.name)}
                    style={styles.cardInfoImage}
                />

                <View style={styles.cardDetails}>
                    <Text numberOfLines={1} style={[styles.cardTamilName, { color: textColor }]}>
                        {item.tamilName} <Text style={{ fontSize: moderateScale(11), fontWeight: '600', opacity: 0.7 }}>({item.name})</Text>
                    </Text>

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceText, { color: primaryColor }]}>₹{item.price}<Text style={[styles.unitText, { color: labelColor }]}>/kg</Text></Text>

                        {!isSelected ? (
                            <TouchableOpacity
                                style={[styles.addBtn, { backgroundColor: isDark ? '#333' : '#E8F5E9' }]}
                                onPress={(e) => {
                                    e.stopPropagation(); // prevent card click
                                    handleUpdateCart(item, isWholesale ? 1 : 0.25);
                                }}
                            >
                                <MaterialCommunityIcons name="plus" size={24} color={primaryColor} />
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.stepper, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
                                <TouchableOpacity
                                    style={styles.stepBtn}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleUpdateCart(item, isWholesale ? -0.5 : -0.25);
                                    }}
                                >
                                    <Feather name="minus" size={16} color={textColor} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleManualEntry(item); }}>
                                    <Text style={[styles.stepVal, { color: textColor }]}>{qty}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.stepBtn, { backgroundColor: primaryColor }]}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleUpdateCart(item, isWholesale ? 0.5 : 0.25);
                                    }}
                                >
                                    <Feather name="plus" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F4F6F9' }]}>
            <StatusBar style={isDark ? "light" : "dark"} backgroundColor={isDark ? "#121212" : "#F4F6F9"} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0) }]}>
                <View>
                    <Text style={[styles.shopTitle, { color: primaryColor }]}>{user?.shopName || 'Vegetable Shop'}</Text>
                    <Text style={[styles.shopSubtitle, { color: labelColor }]}>
                        {isWholesale ? 'Wholesale' : 'Retail'} Billing
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.headerIconBtn, { backgroundColor: isDark ? '#333' : '#FFF' }]}
                        onPress={() => router.push('/shop/history')}>
                        <MaterialCommunityIcons name="history" size={22} color={textColor} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.headerIconBtn, { backgroundColor: isDark ? '#333' : '#FFF' }]}
                        onPress={() => setSettingsMenuVisible(!settingsMenuVisible)}
                    >
                        <Ionicons name="settings-outline" size={22} color={textColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Settings Menu Overlay */}
            {settingsMenuVisible && (
                <TouchableWithoutFeedback onPress={() => setSettingsMenuVisible(false)}>
                    <View style={styles.menuOverlay}>
                        <TouchableWithoutFeedback>
                            <Animated.View entering={FadeInDown.duration(200)} style={[styles.menuContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => navigateToSettings('profile')}>
                                    <Ionicons name="person-outline" size={20} color={textColor} />
                                    <Text style={[styles.menuText, { color: textColor }]}>Edit Profile</Text>
                                </TouchableOpacity>
                                <View style={[styles.menuDivider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />
                                <TouchableOpacity style={styles.menuItem} onPress={() => navigateToSettings('pricing')}>
                                    <Ionicons name="pricetag-outline" size={20} color={textColor} />
                                    <Text style={[styles.menuText, { color: textColor }]}>Edit Pricing</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            )}

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                    <Feather name="search" size={20} color="#9DA3B4" />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Search vegetables..."
                        placeholderTextColor="#9DA3B4"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Categories */}
            <View style={{ height: 50, marginBottom: verticalScale(10) }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.catPill,
                                selectedCategory === cat && styles.catPillActive,
                                { backgroundColor: selectedCategory === cat ? primaryColor : (isDark ? '#1E1E1E' : '#FFF'), borderColor: isDark ? '#333' : '#EEE' }
                            ]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedCategory(cat);
                            }}
                        >
                            <Text style={[
                                styles.catText,
                                selectedCategory === cat ? { color: '#FFF' } : { color: labelColor }
                            ]}>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Grid */}
            <FlatList
                data={filteredData}
                keyExtractor={item => item.id}
                renderItem={renderCard}
                numColumns={2}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={{ gap: scale(15) }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 120 }} />}
            />

            {/* Bottom Floating Bar */}
            {cart.length > 0 && (
                <Animated.View entering={SlideInUp} style={styles.floatBarContainer}>
                    <View style={[styles.floatBar, { backgroundColor: isDark ? '#1E1E1E' : '#111827' }]}>
                        <View style={styles.cartInfo}>
                            <View style={styles.basketIconBox}>
                                <View style={[styles.cartIconBg, { backgroundColor: accentColor }]}>
                                    <Feather name="shopping-bag" size={20} color="#FFF" />
                                </View>
                                {renderCartBadge()}
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.barLabel}>TOTAL BILL ({cart.length} Items)</Text>
                                <Text style={styles.barTotal}>₹{cartTotal.toFixed(2)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: primaryColor }]} onPress={handleCheckout}>
                            <Text style={styles.nextBtnText}>Next</Text>
                            <Feather name="arrow-right" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* Manual Entry Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                                <Text style={[styles.modalTitle, { color: textColor }]}>
                                    Edit {selectedVeg?.name}
                                </Text>

                                <View style={styles.inputRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.inputLabel, { color: labelColor }]}>Quantity (kg)</Text>
                                        <TextInput
                                            style={[styles.modalInput, { color: textColor, borderColor: isDark ? '#444' : '#E0E0E0', backgroundColor: isDark ? '#333' : '#FAFAFA' }]}
                                            keyboardType="numeric"
                                            value={qtyInput}
                                            onChangeText={setQtyInput}
                                            autoFocus
                                            placeholder="2.5"
                                            placeholderTextColor={labelColor}
                                        />
                                    </View>
                                    <View style={{ width: 15 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.inputLabel, { color: labelColor }]}>Price/kg</Text>
                                        <TextInput
                                            style={[styles.modalInput, { color: textColor, borderColor: isDark ? '#444' : '#E0E0E0', backgroundColor: isDark ? '#333' : '#FAFAFA' }]}
                                            keyboardType="numeric"
                                            value={priceInput}
                                            onChangeText={setPriceInput}
                                            placeholderTextColor={labelColor}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: primaryColor }]}
                                    onPress={confirmManualEntry}
                                >
                                    <Text style={styles.confirmBtnText}>Update Cart</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Bill Invoice Preview Modal */}
            <Modal visible={billPreviewVisible} animationType="slide" transparent={false}>
                <SafeAreaView style={[styles.invoiceContainer, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
                    <View style={styles.invoiceHeader}>
                        <TouchableOpacity onPress={() => setBillPreviewVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.invoiceTitle, { color: textColor }]}>Invoice Preview</Text>
                        <TouchableOpacity onPress={finalizeBill} style={[styles.printBtn, { backgroundColor: primaryColor }]}>
                            <Feather name="printer" size={20} color="#FFF" />
                            <Text style={styles.printBtnText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.invoiceScroll}>
                        {/* Shop Header */}
                        <View style={[styles.shopHeader, { backgroundColor: cardBg }]}>
                            <Image source={require('../../assets/images/Logo_bill.png')} style={styles.shopLogo} />
                            <View style={styles.shopInfo}>
                                <Text style={[styles.shopNameText, { color: textColor }]}>{user?.shopName || 'Vegetable Shop'}</Text>
                                <Text style={[styles.shopDetails, { color: labelColor }]}>Southern Market, Tamil Nadu</Text>
                                <Text style={[styles.shopDetails, { color: labelColor }]}>PH: {user?.username}</Text>
                            </View>
                        </View>

                        {/* Customer Info */}
                        <View style={[styles.customerSection, { backgroundColor: cardBg }]}>
                            <View style={styles.customerInputRow}>
                                <Ionicons name="person-outline" size={20} color={primaryColor} />
                                <TextInput
                                    style={[styles.customerInput, { color: textColor }]}
                                    placeholder="Enter Customer Name"
                                    placeholderTextColor={labelColor}
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                />
                            </View>
                            <View style={styles.dateTimeRow}>
                                <Text style={[styles.dateText, { color: labelColor }]}>
                                    <Feather name="calendar" size={12} /> {new Date().toLocaleDateString()}
                                </Text>
                                <Text style={[styles.dateText, { color: labelColor }]}>
                                    <Feather name="clock" size={12} /> {new Date().toLocaleTimeString()}
                                </Text>
                            </View>
                        </View>

                        {/* Editable Items Table */}
                        <View style={[styles.tableContainer, { backgroundColor: cardBg }]}>
                            <View style={[styles.tableHead, { borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
                                <Text style={[styles.headLabel, { flex: 3 }]}>ITEM</Text>
                                <Text style={[styles.headLabel, { flex: 1.5, textAlign: 'center' }]}>QTY/KG</Text>
                                <Text style={[styles.headLabel, { flex: 1.5, textAlign: 'right' }]}>PRICE</Text>
                                <Text style={[styles.headLabel, { flex: 2, textAlign: 'right' }]}>TOTAL</Text>
                            </View>

                            {cart.map((item) => (
                                <View key={item.id} style={[styles.invoiceRow, { borderBottomColor: isDark ? '#333' : '#F3F4F6' }]}>
                                    <View style={{ flex: 3 }}>
                                        <Text style={[styles.itemTamil, { color: textColor }]}>{item.tamilName}</Text>
                                        <Text style={[styles.itemEng, { color: labelColor }]}>{item.name}</Text>
                                    </View>

                                    <View style={{ flex: 1.5, alignItems: 'center' }}>
                                        <TextInput
                                            keyboardType="numeric"
                                            style={[styles.editInput, { color: textColor, backgroundColor: isDark ? '#333' : '#F3F4F6' }]}
                                            value={item.quantity.toString()}
                                            onChangeText={(v) => updateCartItemInPreview(item.id, v, item.price.toString())}
                                        />
                                    </View>

                                    <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                                        <TextInput
                                            keyboardType="numeric"
                                            style={[styles.editInput, { textAlign: 'right', color: textColor, backgroundColor: isDark ? '#333' : '#F3F4F6' }]}
                                            value={item.price.toString()}
                                            onChangeText={(v) => updateCartItemInPreview(item.id, item.quantity.toString(), v)}
                                        />
                                    </View>

                                    <View style={{ flex: 2, alignItems: 'flex-end' }}>
                                        <Text style={[styles.rowTotal, { color: primaryColor }]}>₹{item.total.toFixed(0)}</Text>
                                    </View>
                                </View>
                            ))}

                            <View style={styles.invoiceSummary}>
                                <View style={styles.summaryItem}>
                                    <Text style={[styles.summaryLabel, { color: labelColor }]}>Item Count</Text>
                                    <Text style={[styles.summaryVal, { color: textColor }]}>{cart.length}</Text>
                                </View>
                                <View style={[styles.summaryItem, styles.grandTotalActive]}>
                                    <Text style={styles.totalLabelFinal}>GRAND TOTAL</Text>
                                    <Text style={styles.totalValFinal}>₹{cartTotal.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(15),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    shopTitle: {
        fontSize: moderateScale(22),
        fontWeight: '900',
        letterSpacing: 0.5
    },
    shopSubtitle: {
        fontSize: moderateScale(13),
        marginTop: verticalScale(2),
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    headerActions: {
        flexDirection: 'row',
        gap: scale(10)
    },
    headerIconBtn: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(14),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    // Settings Menu
    menuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
    },
    menuContainer: {
        position: 'absolute',
        top: verticalScale(90),
        right: scale(20),
        width: scale(180),
        borderRadius: scale(16),
        padding: scale(8),
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 30,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(12),
        gap: scale(10),
    },
    menuText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    menuDivider: {
        height: 1,
        width: '100%',
        marginVertical: verticalScale(4),
    },
    searchSection: {
        paddingHorizontal: scale(20),
        marginBottom: verticalScale(15),
    },
    searchBar: {
        height: verticalScale(50),
        borderRadius: scale(16),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(15),
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    searchInput: {
        flex: 1,
        marginLeft: scale(10),
        fontSize: moderateScale(15),
        fontWeight: '500',
    },
    // Card
    card: {
        flex: 1,
        borderRadius: scale(20),
        padding: scale(10),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        marginBottom: 5, // space for shadow
    },
    cardInfoImage: {
        width: '100%',
        height: verticalScale(90),
        resizeMode: 'contain',
        marginBottom: verticalScale(10)
    },
    checkBadge: {
        position: 'absolute',
        top: verticalScale(10),
        right: scale(10),
        width: scale(22),
        height: scale(22),
        borderRadius: scale(11),
        backgroundColor: '#00A86B',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF'
    },
    cardDetails: {
        flex: 1
    },
    cardTamilName: {
        fontSize: moderateScale(15),
        fontWeight: '800',
        marginBottom: verticalScale(2),
    },
    cardEngName: {
        fontSize: moderateScale(11),
        fontWeight: '600',
        marginBottom: verticalScale(8),
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: verticalScale(5)
    },
    priceText: {
        fontSize: moderateScale(16),
        fontWeight: '800',
    },
    unitText: {
        fontSize: moderateScale(11),
        fontWeight: '500',
        marginLeft: scale(2)
    },
    addBtn: {
        width: scale(34),
        height: scale(34),
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: scale(12),
        padding: scale(2),
        height: scale(34),
    },
    stepBtn: {
        width: scale(28),
        height: scale(28),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: scale(10),
        backgroundColor: 'transparent',
    },
    stepVal: {
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        marginHorizontal: scale(8),
        minWidth: scale(15),
        textAlign: 'center'
    },
    // Categories
    catScroll: {
        paddingHorizontal: scale(20),
        gap: scale(10),
        alignItems: 'center'
    },
    catPill: {
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(8),
        borderRadius: scale(20),
        borderWidth: scale(1),
        justifyContent: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    catPillActive: {
        borderWidth: 0,
        elevation: 3,
    },
    catText: {
        fontSize: moderateScale(13),
        fontWeight: '600',
    },
    gridContent: {
        padding: scale(20),
        paddingTop: 10
    },
    // Bottom Bar
    floatBarContainer: {
        position: 'absolute',
        bottom: verticalScale(30),
        left: scale(20),
        right: scale(20),
        zIndex: 100,
    },
    floatBar: {
        borderRadius: scale(24),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: scale(14),
        paddingHorizontal: scale(20),
        elevation: 8,
        shadowColor: 'rgba(0, 168, 107, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    basketIconBox: {
        position: 'relative',
    },
    cartIconBg: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(14),
        alignItems: 'center',
        justifyContent: 'center'
    },
    cartBadge: {
        position: 'absolute',
        top: -verticalScale(4),
        right: -scale(4),
        backgroundColor: '#EF4444',
        width: scale(18),
        height: scale(18),
        borderRadius: scale(9),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#111827'
    },
    cartBadgeText: {
        color: '#FFF',
        fontSize: moderateScale(10),
        fontWeight: 'bold',
    },
    barLabel: {
        color: '#9CA3AF',
        fontSize: moderateScale(10),
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 2
    },
    barTotal: {
        color: '#FFF',
        fontSize: moderateScale(18),
        fontWeight: '800',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(24),
        borderRadius: scale(16),
        gap: scale(8)
    },
    nextBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: moderateScale(16),
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(20),
        backdropFilter: 'blur(10px)'
    },
    modalContent: {
        width: '100%',
        borderRadius: scale(24),
        padding: scale(24),
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalTitle: {
        fontSize: moderateScale(20),
        fontWeight: '800',
        marginBottom: verticalScale(20),
        textAlign: 'center'
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: verticalScale(24)
    },
    inputLabel: {
        fontSize: moderateScale(12),
        marginBottom: verticalScale(8),
        fontWeight: '700',
        letterSpacing: 0.5
    },
    modalInput: {
        borderWidth: scale(1),
        borderRadius: scale(16),
        height: verticalScale(56),
        paddingHorizontal: scale(16),
        fontSize: moderateScale(18),
        fontWeight: '600'
    },
    confirmBtn: {
        height: verticalScale(56),
        borderRadius: scale(16),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: moderateScale(16),
        letterSpacing: 0.5
    },
    // Invoice Modal Styles
    invoiceContainer: {
        flex: 1,
    },
    invoiceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(15),
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    invoiceTitle: {
        fontSize: moderateScale(18),
        fontWeight: '800',
    },
    closeBtn: {
        padding: 5,
    },
    printBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(16),
        borderRadius: scale(10),
        gap: 6
    },
    printBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: moderateScale(14),
    },
    invoiceScroll: {
        padding: scale(20),
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: scale(20),
        borderRadius: scale(24),
        marginBottom: verticalScale(15),
        elevation: 1,
    },
    shopLogo: {
        width: scale(60),
        height: scale(60),
        resizeMode: 'contain',
        borderRadius: scale(12),
        marginRight: scale(15),
    },
    shopInfo: {
        flex: 1,
    },
    shopNameText: {
        fontSize: moderateScale(20),
        fontWeight: '900',
        marginBottom: 2
    },
    shopDetails: {
        fontSize: moderateScale(12),
        fontWeight: '500',
        opacity: 0.8
    },
    customerSection: {
        padding: scale(15),
        borderRadius: scale(20),
        marginBottom: verticalScale(15),
        elevation: 1,
    },
    customerInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
    },
    customerInput: {
        flex: 1,
        fontSize: moderateScale(16),
        fontWeight: '700',
        paddingVertical: 5
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10
    },
    dateText: {
        fontSize: moderateScale(11),
        fontWeight: '600',
    },
    tableContainer: {
        borderRadius: scale(24),
        padding: scale(20),
        elevation: 1,
    },
    tableHead: {
        flexDirection: 'row',
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    headLabel: {
        fontSize: moderateScale(11),
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1
    },
    invoiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(15),
        borderBottomWidth: 1,
    },
    itemTamil: {
        fontSize: moderateScale(18),
        fontWeight: '900',
        marginBottom: 2
    },
    itemEng: {
        fontSize: moderateScale(11),
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    editInput: {
        width: scale(55),
        height: verticalScale(35),
        borderRadius: scale(8),
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 0
    },
    rowTotal: {
        fontSize: moderateScale(16),
        fontWeight: '900',
    },
    invoiceSummary: {
        marginTop: verticalScale(20),
        gap: 12
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    summaryLabel: {
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    summaryVal: {
        fontSize: moderateScale(16),
        fontWeight: '700',
    },
    grandTotalActive: {
        backgroundColor: '#00A86B15',
        padding: scale(15),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: '#00A86B50'
    },
    totalLabelFinal: {
        fontSize: moderateScale(16),
        fontWeight: '900',
        color: '#00A86B'
    },
    totalValFinal: {
        fontSize: moderateScale(22),
        fontWeight: '900',
        color: '#00A86B'
    }
});

