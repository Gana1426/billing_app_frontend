import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Platform,
    Image,
    Dimensions,
    SafeAreaView,
    ScrollView,
    TouchableWithoutFeedback,
    StatusBar
} from 'react-native';
import { inventoryApi } from '../../services/api';
import { Storage, KEYS } from '../../services/storage';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { SyncManager } from '../../utils/syncManager';
import { generateBillPDF } from '../../utils/pdfGenerator';
import { Ionicons, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Data Types
type Vegetable = {
    id: string;
    name: string;
    tamilName: string;
    image: string;
    price: number;
    category?: string;
    wholesalePrice?: number;
};

type BillItem = Vegetable & {
    quantity: number; // in kg
    total: number;
    isCustom?: boolean;
};

const CATEGORIES = ['Favourites', 'All Items', 'Root Veggies', 'Leafy Greens', 'Fruits', 'Others'];

export default function ShopScreen() {
    const { user, logout } = useAuth();
    const navigation = useNavigation();
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode: string }>();
    const isWholesale = mode === 'wholesale';

    const { t, theme, isDark, toggleTheme, language } = useAppTheme();

    // States
    const [allVegetables, setAllVegetables] = useState<Vegetable[]>([]);
    const [cart, setCart] = useState<BillItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Items');

    // Modal States
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedVeg, setSelectedVeg] = useState<Vegetable | null>(null);
    const [qtyInput, setQtyInput] = useState('');
    const [priceInput, setPriceInput] = useState('');

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

    const loadVegetables = async () => {
        try {
            // Try fetching from API first
            const res = await inventoryApi.getAll();
            if (res.data && res.data.length > 0) {
                const validated = res.data.map((v: any) => ({
                    ...v,
                    category: v.category || 'Root Veggies', // Mock category if missing
                    image: v.image?.startsWith('http') ? v.image : 'https://cdn-icons-png.flaticon.com/512/135/135687.png'
                }));
                setAllVegetables(validated);
                Storage.setItem(KEYS.VEGETABLES, validated);
            } else {
                throw new Error("No data");
            }
        } catch (e) {
            // Fallback to cache
            const cached = await Storage.getItem(KEYS.VEGETABLES);
            if (cached) setAllVegetables(cached);
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
                return data.filter(v => user.top_selling_vegetables?.includes(v.id));
            }
            return []; // Show empty if no favourites
        } else if (selectedCategory !== 'All Items') {
            // Basic category filter (mock or real)
            if (selectedCategory === 'Root Veggies') return data; // Mock keep existing behavior
            // In real app: return data.filter(v => v.category === selectedCategory);
        }
        return data;
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

    const handleCheckout = async () => {
        // Proceed to print/save
        const billData = {
            shopName: user?.shopName || 'Vegetable Shop',
            logo: '',
            phone: '',
            userName: user?.username || 'User',
            billNumber: `BILL-${Date.now()}`,
            date: new Date().toLocaleString('en-IN'),
            mode: isWholesale ? 'Wholesale' : 'Retail',
            items: cart.map(item => ({
                name: item.name,
                tamilName: item.tamilName,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            grandTotal: parseFloat(cartTotal.toFixed(2))
        };

        try {
            await SyncManager.queueBill(billData);
            await generateBillPDF(billData);
            Alert.alert("Success", "Bill Generated Successfully");
            setCart([]);
        } catch (error) {
            Alert.alert("Error", "Could not generate bill");
        }
    };

    const getItemQty = (id: string) => {
        const item = cart.find(i => i.id === id);
        return item ? item.quantity : 0;
    };

    // UI Components
    const renderCartBadge = () => (
        <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
        </View>
    );

    const renderCard = ({ item }: { item: Vegetable }) => {
        const qty = getItemQty(item.id);
        const isSelected = qty > 0;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.card}
                onPress={() => {
                    // If needed to open detail or manual entry on card click
                    // handleManualEntry(item);
                }}
            >
                {isSelected && (
                    <View style={styles.checkBadge}>
                        <Feather name="check" size={12} color="#FFF" />
                    </View>
                )}

                <Image source={{ uri: item.image }} style={styles.cardInfoImage} />

                <View style={styles.cardDetails}>
                    <Text style={styles.cardTamilName}>{item.tamilName}</Text>
                    <Text style={styles.cardEngName}>{item.name.toUpperCase()}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceText}>₹{item.price}<Text style={styles.unitText}>/kg</Text></Text>

                        {!isSelected ? (
                            <TouchableOpacity
                                style={styles.addBtn}
                                onPress={() => handleUpdateCart(item, 1)}
                            >
                                <MaterialCommunityIcons name="cart-outline" size={20} color="#00A86B" />
                                {/* <Feather name="plus" size={12} color="#009950" style={{ marginLeft: 2 }} /> */}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.stepper}>
                                <TouchableOpacity
                                    style={styles.stepBtn}
                                    onPress={() => handleUpdateCart(item, -0.5)}
                                >
                                    <Feather name="minus" size={18} color="#555" />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => handleManualEntry(item)}>
                                    <Text style={styles.stepVal}>{qty}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.stepBtn, styles.stepBtnActive]}
                                    onPress={() => handleUpdateCart(item, 0.5)}
                                >
                                    <Feather name="plus" size={18} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F4F6F8' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.shopTitle}>காய்கறி கடை</Text>
                    <Text style={[styles.shopSubtitle, { color: isDark ? '#888' : '#7D8FAB' }]}>
                        {isWholesale ? 'Wholesale' : 'Retail'} Billing
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push('/shop/history')}>
                        <Feather name="clock" size={20} color={isDark ? "#FFF" : "#323F4B"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerIconBtn}>
                        <Feather name="settings" size={20} color={isDark ? "#FFF" : "#323F4B"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.headerIconBtn, { marginLeft: 5 }]} onPress={toggleTheme}>
                        <Feather name={isDark ? "sun" : "moon"} size={20} color={isDark ? "#FFF" : "#323F4B"} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                    <Feather name="search" size={20} color="#9DA3B4" />
                    <TextInput
                        style={[styles.searchInput, { color: isDark ? '#FFF' : '#333' }]}
                        placeholder="Search vegetables (e.g. Tomato)..."
                        placeholderTextColor="#9DA3B4"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Categories */}
            <View style={{ maxHeight: 50 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.catPill,
                                selectedCategory === cat && styles.catPillActive,
                                { backgroundColor: selectedCategory === cat ? '#00A86B' : (isDark ? '#1E1E1E' : '#FFF') }
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.catText,
                                selectedCategory === cat ? { color: '#FFF' } : { color: isDark ? '#AAA' : '#323F4B' }
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
                columnWrapperStyle={{ gap: 15 }}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 100 }} />}
            />

            {/* Bottom Floating Bar */}
            {cart.length > 0 && (
                <Animated.View entering={SlideInUp} style={styles.floatBarContainer}>
                    <View style={styles.floatBar}>
                        <View style={styles.cartInfo}>
                            <View style={styles.basketIconBox}>
                                <Feather name="shopping-bag" size={20} color="#FFF" />
                                {renderCartBadge()}
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.barLabel}>TOTAL BILL</Text>
                                <Text style={styles.barTotal}>₹{cartTotal.toFixed(2)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.nextBtn} onPress={handleCheckout}>
                            <Text style={styles.nextBtnText}>Next</Text>
                            <Feather name="arrow-right" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* Manual Entry Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
                                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#111' }]}>
                                    Edit {selectedVeg?.name}
                                </Text>

                                <View style={styles.inputRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Quantity (kg)</Text>
                                        <TextInput
                                            style={[styles.modalInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#E0E0E0' }]}
                                            keyboardType="numeric"
                                            value={qtyInput}
                                            onChangeText={setQtyInput}
                                            autoFocus
                                            placeholder="2.5"
                                        />
                                    </View>
                                    <View style={{ width: 10 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Price/kg</Text>
                                        <TextInput
                                            style={[styles.modalInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#E0E0E0' }]}
                                            keyboardType="numeric"
                                            value={priceInput}
                                            onChangeText={setPriceInput}
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.confirmBtn, { backgroundColor: '#00A86B' }]}
                                    onPress={confirmManualEntry}
                                >
                                    <Text style={styles.confirmBtnText}>Update Cart</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingHorizontal: 20,
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shopTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#00A86B', // The specific green from image
    },
    shopSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12
    },
    headerIconBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    searchBar: {
        height: 50,
        backgroundColor: '#FFF',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 0, // Flat look like image or very subtle
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '400',
        color: '#333'
    },
    // ...
    card: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20, // More rounded
        padding: 12,
        // Soft shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    // ...
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8F5E9', // Light green bg
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20, // Pill shape
        padding: 3,
        height: 36,
    },
    stepBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#FFF', // White bg for minus
    },
    stepBtnActive: {
        backgroundColor: '#00A86B', // Green bg for plus
    },
    // Categories
    catScroll: {
        paddingHorizontal: 20,
        gap: 10,
        paddingBottom: 10,
    },
    catPill: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#EEE',
        justifyContent: 'center'
    },
    catPillActive: {
        borderWidth: 0,
        backgroundColor: '#00A86B'
    },
    catText: {
        fontSize: 13,
        fontWeight: '600',
    },
    gridContent: {
        padding: 20,
    },
    // Card Internal Elements
    cardInfoImage: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#00A86B',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardDetails: {
        flex: 1
    },
    cardTamilName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 2,
    },
    cardEngName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#00A86B', // Green price
    },
    unitText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9CA3AF',
        marginLeft: 2
    },
    // ... existing bottom bar styles...
    // Bottom Bar
    floatBarContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    floatBar: {
        backgroundColor: '#111827', // Dark floating bar
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 20,
    },
    cartInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    basketIconBox: {
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#F59E0B',
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeText: {
        color: '#000',
        fontSize: 9,
        fontWeight: 'bold',
    },
    barLabel: {
        color: '#9CA3AF',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
    },
    barTotal: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    nextBtn: {
        backgroundColor: '#00A86B',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        gap: 5
    },
    nextBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 20,
        textAlign: 'center'
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 20
    },
    inputLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 5,
        fontWeight: '600'
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: '600'
    },
    confirmBtn: {
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    }
});
