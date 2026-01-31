import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Image, View } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

type VegetableProps = {
    name: string;
    image: string;
    price?: number;
    stock?: number;
    onPress: () => void;
};

export const VegetableCard: React.FC<VegetableProps> = ({ name, image, price, stock, onPress }) => {
    const { isDark } = useAppTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
            onPress={onPress}
        >
            <Image
                source={{ uri: image || 'https://via.placeholder.com/100' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={[styles.name, { color: isDark ? '#E0E0E0' : '#000' }]}>{name}</Text>
                {price !== undefined && (
                    <Text style={[styles.price, { color: isDark ? '#81C784' : '#2E7D32' }]}>
                        ₹{price}/kg
                    </Text>
                )}
                {stock !== undefined && (
                    <Text style={[styles.stock, { color: isDark ? '#888' : '#666' }, stock < 5 ? styles.lowStock : null]}>
                        {stock} kg
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 12,
        margin: 6,
        width: 125,
        alignItems: 'center',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: 8,
    },
    info: {
        alignItems: 'center',
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: '900',
        backgroundColor: 'rgba(46, 125, 50, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6,
        overflow: 'hidden',
    },
    stock: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
    lowStock: {
        color: '#FF5252',
    },
});
