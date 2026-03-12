import { useAppTheme } from "@/context/ThemeContext";
import { billDbService } from "@/services/dbService";
import { moderateScale, scale, verticalScale } from "@/utils/responsive";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BillingHistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { t, isDark, language } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await billDbService.getHistory();
      const bills = response.data.map((bill: any) => ({
        id: bill.id,
        billNumber: bill.id.substring(0, 8),
        date: bill.created_at,
        grandTotal: bill.total_amount,
        items: [], // Items will be fetched when viewing bill
      }));
      setHistory(bills);
    } catch (error) {
      console.error("Fetch history error:", error);
      Alert.alert(t.APP_NAME, "Failed to fetch billing history.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (billId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const billIdToUse = billId || selectedBill?.id;
      if (!billIdToUse) {
        Alert.alert("Error", "Bill ID not found.");
        return;
      }

      // Fetch bill details from local database
      const response = await billDbService.getPdf(billIdToUse);
      const billData = response.data;

      if (!billData || !billData.bill) {
        Alert.alert("Error", "Bill not found.");
        return;
      }

      Alert.alert(
        "Success",
        "Bill details retrieved successfully. PDF generation handled on the UI side.",
      );
    } catch (error) {
      console.error("PDF retrieval error", error);
      Alert.alert("Error", "Failed to retrieve bill details.");
    }
  };

  const handleViewBill = (bill: any) => {
    Haptics.selectionAsync();
    setSelectedBill(bill);
    setPreviewVisible(true);
  };

  const primaryColor = "#00A86B";
  const accentColor = "#FFA000";
  const textColor = isDark ? "#FFFFFF" : "#1A1C1E";
  const labelColor = isDark ? "#BBB" : "#6B7280";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.historyCard, { backgroundColor: cardBg }]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: index % 2 === 0 ? "#E8F5E9" : "#FFF3E0" },
          ]}
        >
          <MaterialCommunityIcons
            name={index % 2 === 0 ? "leaf" : "carrot"}
            size={20}
            color={index % 2 === 0 ? primaryColor : accentColor}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.billNumber, { color: textColor }]}>
            #{item.billNumber}
          </Text>
          <Text style={[styles.billDate, { color: labelColor }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={[styles.currencySymbol, { color: primaryColor }]}>
            ₹
          </Text>
          <Text style={[styles.billAmount, { color: primaryColor }]}>
            {item.grandTotal.toFixed(0)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? "#333" : "#F0F0F0" },
        ]}
      />

      <View style={styles.cardFooter}>
        <View style={styles.itemInfo}>
          <Ionicons name="basket-outline" size={16} color={labelColor} />
          <Text style={[styles.itemCount, { color: labelColor }]}>
            {item.items.length} {language === "Tamil" ? "பொருட்கள்" : "items"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.pdfButton,
            { backgroundColor: isDark ? "#333" : "#F5F5F5" },
          ]}
          onPress={() => handleViewBill(item)}
        >
          <Text style={[styles.pdfButtonText, { color: textColor }]}>
            View Bill
          </Text>
          <View
            style={[styles.pdfIconCircle, { backgroundColor: primaryColor }]}
          >
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#F4F6F9" },
      ]}
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={isDark ? "#121212" : "#F4F6F9"}
      />

      {/* Header Background */}
      <View
        style={[
          styles.bgDecorCircle,
          {
            backgroundColor: isDark ? "#1A3320" : "#E8F5E9",
            top: -verticalScale(100),
            right: -scale(50),
          },
        ]}
      />

      {/* NavBar */}
      <View
        style={[
          styles.navBar,
          { paddingTop: insets.top + (Platform.OS === "android" ? 10 : 0) },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: isDark ? "#333" : "#FFF" },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: textColor }]}>History</Text>
        <View style={{ width: scale(40) }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: labelColor }]}>
            {language === "Tamil" ? "ஏற்றுகிறது..." : "Loading..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconBg,
                  { backgroundColor: isDark ? "#1E1E1E" : "#FFF" },
                ]}
              >
                <MaterialCommunityIcons
                  name="history"
                  size={60}
                  color={isDark ? "#333" : "#E0E0E0"}
                />
              </View>
              <Text style={[styles.emptyText, { color: labelColor }]}>
                No billing history yet.
              </Text>
            </View>
          }
          onRefresh={fetchHistory}
          refreshing={loading}
        />
      )}

      {/* Bill Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFF" },
            ]}
          >
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  Bill Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: labelColor }]}>
                  #{selectedBill?.billNumber} •{" "}
                  {selectedBill && new Date(selectedBill.date).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.closeIcon,
                  { backgroundColor: isDark ? "#333" : "#F5F5F5" },
                ]}
                onPress={() => setPreviewVisible(false)}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 2, color: labelColor },
                  ]}
                >
                  Item
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: "center", color: labelColor },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: "right", color: labelColor },
                  ]}
                >
                  Price
                </Text>
                <Text
                  style={[
                    styles.tableHeaderText,
                    { flex: 1, textAlign: "right", color: labelColor },
                  ]}
                >
                  Total
                </Text>
              </View>

              {selectedBill?.items.map((item: any, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: isDark ? "#333" : "#F0F0F0" },
                  ]}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.itemName, { color: textColor }]}>
                      {language === "Tamil" ? item.tamilName : item.name}
                    </Text>
                    <Text style={[styles.itemSubName, { color: labelColor }]}>
                      {item.name.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1, textAlign: "center", color: textColor },
                    ]}
                  >
                    {item.quantity} kg
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { flex: 1, textAlign: "right", color: textColor },
                    ]}
                  >
                    ₹{item.price}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        flex: 1,
                        textAlign: "right",
                        fontWeight: "bold",
                        color: primaryColor,
                      },
                    ]}
                  >
                    ₹{item.total}
                  </Text>
                </View>
              ))}

              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: labelColor }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.totalValue, { color: textColor }]}>
                    ₹{selectedBill?.grandTotal.toFixed(2)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.grandTotalRow,
                    { backgroundColor: isDark ? "#252525" : "#F9F9F9" },
                  ]}
                >
                  <Text style={[styles.grandTotalLabel, { color: textColor }]}>
                    GRAND TOTAL
                  </Text>
                  <Text
                    style={[styles.grandTotalValue, { color: primaryColor }]}
                  >
                    ₹{selectedBill?.grandTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.downloadBtn, { backgroundColor: primaryColor }]}
                onPress={() => handleDownloadPdf("")}
              >
                <MaterialCommunityIcons
                  name="file-pdf-box"
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgDecorCircle: {
    position: "absolute",
    width: scale(350),
    height: scale(350),
    borderRadius: scale(175),
    opacity: 0.6,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(15),
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navTitle: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: verticalScale(15),
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  listContent: {
    padding: scale(20),
    paddingBottom: verticalScale(40),
  },
  historyCard: {
    borderRadius: scale(24),
    padding: scale(16),
    marginBottom: verticalScale(16),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  iconBox: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(12),
  },
  headerText: {
    flex: 1,
  },
  billNumber: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    marginBottom: verticalScale(2),
  },
  billDate: {
    fontSize: moderateScale(12),
    fontWeight: "500",
  },
  amountBadge: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  currencySymbol: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginTop: verticalScale(2),
    marginRight: scale(1),
  },
  billAmount: {
    fontSize: moderateScale(20),
    fontWeight: "900",
  },
  divider: {
    height: scale(1),
    width: "100%",
    marginBottom: verticalScale(12),
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
  },
  itemCount: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    paddingRight: scale(6),
    borderRadius: scale(20),
  },
  pdfButtonText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    marginRight: scale(8),
  },
  pdfIconCircle: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(100),
  },
  emptyIconBg: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    opacity: 0.8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(30),
    borderTopRightRadius: scale(30),
    height: "80%",
    padding: scale(20),
  },
  modalDragHandle: {
    width: scale(40),
    height: scale(5),
    backgroundColor: "#DDD",
    borderRadius: scale(3),
    alignSelf: "center",
    marginBottom: verticalScale(15),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: verticalScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: moderateScale(13),
    fontWeight: "500",
    marginTop: verticalScale(4),
  },
  closeIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tableHeaderText: {
    fontSize: moderateScale(11),
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  itemSubName: {
    fontSize: moderateScale(10),
    fontWeight: "600",
    marginTop: 2,
  },
  tableCell: {
    fontSize: moderateScale(13),
    fontWeight: "600",
  },
  totalSection: {
    marginTop: verticalScale(20),
    paddingTop: verticalScale(10),
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(10),
  },
  totalLabel: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  totalValue: {
    fontSize: moderateScale(14),
    fontWeight: "700",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(15),
    borderRadius: scale(16),
    marginTop: verticalScale(10),
  },
  grandTotalLabel: {
    fontSize: moderateScale(15),
    fontWeight: "900",
  },
  grandTotalValue: {
    fontSize: moderateScale(20),
    fontWeight: "900",
  },
  modalFooter: {
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(56),
    borderRadius: scale(18),
    gap: scale(10),
  },
  downloadBtnText: {
    color: "#FFF",
    fontSize: moderateScale(16),
    fontWeight: "700",
  },
});
