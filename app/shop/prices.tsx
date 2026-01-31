import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { vegApi, inventoryApi } from '../../services/api';
import { Storage, KEYS } from '../../services/storage';
import { useRouter } from 'expo-router';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function SetPricesScreen() {
    const [vegetables, setVegetables] = useState<any[]>([]);
    const router = useRouter();
    const { t, isDark, language } = useAppTheme();

    useEffect(() => {
        loadVegetables();
    }, []);

    const loadVegetables = async () => {
        const cached = await Storage.getItem(KEYS.VEGETABLES) || [];
        setVegetables(cached);
    };

    const updatePrice = (id: string, price: string) => {
        setVegetables(prev => prev.map(v =>
            v.id === id ? { ...v, price: parseFloat(price) || 0 } : v
        ));
    };

    const handleSave = async () => {
        try {
            // Update individual items in backend
            const updatePromises = vegetables.map(v =>
                inventoryApi.update(v.id, { price: v.price })
                    .catch(err => console.log(`Failed to update ${v.name}:`, err))
            );

            await Promise.all(updatePromises);

            // Save locally
            await Storage.setItem(KEYS.VEGETABLES, vegetables);
            Alert.alert(t.APP_NAME, language === 'Tamil' ? 'விலைகள் சேமிக்கப்பட்டன!' : "Prices saved successfully!");
            router.back();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert(t.APP_NAME, "Failed to sync some prices with cloud, saved locally.");
            await Storage.setItem(KEYS.VEGETABLES, vegetables);
            router.back();
        }
    };

    const dynamicStyles = {
        container: [styles.container, { backgroundColor: isDark ? '#121212' : '#F8F9FA' }],
        title: [styles.title, { color: isDark ? '#EEE' : '#333' }],
        row: [styles.row, {
            backgroundColor: isDark ? '#1E1E1E' : '#FFF',
            borderColor: isDark ? '#333' : '#EEE'
        }],
        name: [styles.name, { color: isDark ? '#DDD' : '#444' }],
        input: [styles.input, {
            backgroundColor: isDark ? '#2C2C2C' : '#F9F9F9',
            borderColor: isDark ? '#444' : '#DDD',
            color: isDark ? '#FFF' : '#333'
        }],
    };

    return (
        <View style={dynamicStyles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={dynamicStyles.title}>{t.PRICE_PER_KG}</Text>
                {vegetables.map(v => (
                    <View key={v.id} style={dynamicStyles.row}>
                        <View style={styles.nameContainer}>
                            <Ionicons name="leaf-outline" size={18} color="#2E7D32" style={{ marginRight: 10 }} />
                            <Text style={dynamicStyles.name}>{v.name}</Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={[styles.currency, { color: isDark ? '#888' : '#999' }]}>₹</Text>
                            <TextInput
                                style={dynamicStyles.input}
                                keyboardType="numeric"
                                defaultValue={v.price?.toString()}
                                onChangeText={(val) => updatePrice(v.id, val)}
                                placeholder="0"
                            />
                        </View>
                    </View>
                ))}
            </ScrollView>
            <View style={[styles.bottomBar, { backgroundColor: isDark ? '#121212' : '#F8F9FA' }]}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveText}>{t.SAVE}</Text>
                    <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 100 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 1,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    name: { fontSize: 16, fontWeight: '600' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currency: {
        fontSize: 18,
        fontWeight: '700',
        marginRight: 4,
    },
    input: {
        width: 100,
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        textAlign: 'right',
        fontSize: 18,
        fontWeight: '700',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    },
    saveButton: {
        backgroundColor: '#2E7D32',
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        elevation: 4,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    saveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
