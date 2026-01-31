import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform
} from 'react-native';
import { billApi } from '../../services/api';
import { useAppTheme } from '../../context/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function BillingHistoryScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, isDark, language } = useAppTheme();
    const router = useRouter();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await billApi.getHistory();
            setHistory(response.data);
        } catch (error) {
            console.error('Fetch history error:', error);
            Alert.alert("Error", "Failed to fetch billing history from server.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async (billId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const response = await billApi.getPdf(billId);

            // In a real mobile app, you'd save the blob to a file
            // Since we're using expo-router and might be on web or mobile, let's handle mobile file save
            if (Platform.OS !== 'web') {
                const filename = `bill_${billId}.pdf`;
                const fileUri = `${FileSystem.documentDirectory}${filename}`;

                // Convert blob to base64 if needed, or if billApi returns data directly
                // Assuming axios response type 'blob'
                const fr = new FileReader();
                fr.onload = async () => {
                    const base64Data = (fr.result as string).split(',')[1];
                    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    await Sharing.shareAsync(fileUri);
                };
                fr.readAsDataURL(response.data);
            } else {
                // Web fallback
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `bill_${billId}.pdf`);
                document.body.appendChild(link);
                link.click();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to download PDF.");
        }
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={[styles.historyCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.billNumber, { color: isDark ? '#EEE' : '#333' }]}>#{item.billNumber}</Text>
                    <Text style={styles.billDate}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.billAmount, { color: isDark ? '#81C784' : '#2E7D32' }]}>₹{item.grandTotal.toFixed(2)}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#EEE' }]} />

            <View style={styles.cardFooter}>
                <Text style={styles.itemCount}>{item.items.length} {language === 'Tamil' ? 'பொருட்கள்' : 'items'}</Text>
                <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => handleDownloadPdf(item.id || item.billId || index.toString())}
                >
                    <Ionicons name="document-text-outline" size={18} color="#FFF" />
                    <Text style={styles.pdfButtonText}>PDF</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F8F9FA' }]}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                    <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>
                        {language === 'Tamil' ? 'வரலாற்றை ஏற்றுகிறது...' : 'Fetching History...'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="history" size={100} color={isDark ? '#333' : '#DDD'} />
                            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
                                No billing history found.
                            </Text>
                        </View>
                    }
                    onRefresh={fetchHistory}
                    refreshing={loading}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 15,
        paddingBottom: 40,
    },
    historyCard: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    billNumber: {
        fontSize: 18,
        fontWeight: '800',
    },
    billDate: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    billAmount: {
        fontSize: 20,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemCount: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },
    pdfButton: {
        backgroundColor: '#2E7D32',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    pdfButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 5,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 15,
    }
});
