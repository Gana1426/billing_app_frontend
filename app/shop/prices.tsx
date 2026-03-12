import { useAppTheme } from "@/context/ThemeContext";
import { inventoryDbService } from "@/services/dbService";
import { KEYS, Storage } from "@/services/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SetPricesScreen() {
  const [vegetables, setVegetables] = useState<any[]>([]);
  const router = useRouter();
  const { t, isDark, language } = useAppTheme();

  useEffect(() => {
    loadVegetables();
  }, []);

  const loadVegetables = async () => {
    // Fetch fresh data from local database
    try {
      const res = await inventoryDbService.getAll();
      if (res.data && res.data.length > 0) {
        // Map database fields correctly
        const data = res.data.map((v: any) => ({
          ...v,
          id: v.vegetable_id,
          price: v.price || 0,
        }));
        setVegetables(data);
        Storage.setItem(KEYS.VEGETABLES, data);
      } else {
        const cached = (await Storage.getItem(KEYS.VEGETABLES)) || [];
        setVegetables(cached);
      }
    } catch (e) {
      const cached = (await Storage.getItem(KEYS.VEGETABLES)) || [];
      setVegetables(cached);
    }
  };

  const updatePrice = (
    id: string,
    type: "wholesale" | "retail",
    value: string,
  ) => {
    setVegetables((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              [type === "wholesale" ? "wholesalePrice" : "retailPrice"]:
                parseFloat(value) || 0,
            }
          : v,
      ),
    );
  };

  const handleSave = async () => {
    try {
      // Save each vegetable's price to database
      for (const v of vegetables) {
        await inventoryDbService.dailyPricing({
          vegetable_id: v.id || v.vegetable_id,
          price: v.price || 0,
          stock_quantity: 100, // Default
          unit: "kg",
          date: new Date().toISOString().split("T")[0],
        });
      }

      // Update local storage with new values
      await Storage.setItem(KEYS.VEGETABLES, vegetables);

      Alert.alert(
        t.APP_NAME,
        language === "Tamil"
          ? "விலைகள் சேமிக்கப்பட்டன!"
          : "Prices published successfully!",
      );
      router.back();
    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert(t.APP_NAME, "Failed to publish prices. Try again.");
    }
  };

  const dynamicStyles = {
    container: [
      styles.container,
      { backgroundColor: isDark ? "#121212" : "#F8F9FA" },
    ],
    title: [styles.title, { color: isDark ? "#EEE" : "#333" }],
    row: [
      styles.row,
      {
        backgroundColor: isDark ? "#1E1E1E" : "#FFF",
        borderColor: isDark ? "#333" : "#EEE",
      },
    ],
    name: [styles.name, { color: isDark ? "#DDD" : "#444" }],
    input: [
      styles.input,
      {
        backgroundColor: isDark ? "#2C2C2C" : "#F9F9F9",
        borderColor: isDark ? "#444" : "#DDD",
        color: isDark ? "#FFF" : "#333",
      },
    ],
    label: [styles.label, { color: isDark ? "#AAA" : "#666" }],
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#333"}
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.title}>
          {t.PRICE_PER_KG || "Daily Pricing"}
        </Text>
      </View>

      <View style={styles.headerRow}>
        <Text
          style={[
            styles.headerCol,
            { color: isDark ? "#CCC" : "#555", flex: 2 },
          ]}
        >
          Item
        </Text>
        <Text style={[styles.headerCol, { color: isDark ? "#CCC" : "#555" }]}>
          Wholesale
        </Text>
        <Text style={[styles.headerCol, { color: isDark ? "#CCC" : "#555" }]}>
          Retail
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {vegetables.map((v) => (
          <View key={v.id} style={dynamicStyles.row}>
            <View style={styles.nameContainer}>
              <Text style={dynamicStyles.name}>{v.name}</Text>
              <Text
                style={[dynamicStyles.name, { fontSize: 12, color: "#888" }]}
              >
                {v.tamilName}
              </Text>
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={dynamicStyles.input}
                  keyboardType="numeric"
                  defaultValue={v.wholesalePrice?.toString()}
                  onChangeText={(val) => updatePrice(v.id, "wholesale", val)}
                  placeholder="0"
                  selectTextOnFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={[dynamicStyles.input, { borderColor: "#00A86B" }]} // Highlight retail
                  keyboardType="numeric"
                  defaultValue={v.retailPrice?.toString()}
                  onChangeText={(val) => updatePrice(v.id, "retail", val)}
                  placeholder="0"
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: isDark ? "#121212" : "#F8F9FA" },
        ]}
      >
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Publish Prices</Text>
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 10,
  },
  backBtn: { marginRight: 15 },
  scroll: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: "800" },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 36,
    paddingBottom: 10,
    marginBottom: 5,
  },
  headerCol: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  nameContainer: {
    flex: 2,
    justifyContent: "center",
  },
  name: { fontSize: 16, fontWeight: "600" },
  inputsRow: {
    flexDirection: "row",
    flex: 3,
    gap: 10,
    justifyContent: "flex-end",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  label: { fontSize: 10, marginBottom: 2 },
  currency: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginRight: 2,
  },
  input: {
    width: "80%",
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 35 : 20,
  },
  saveButton: {
    backgroundColor: "#00A86B",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 4,
    shadowColor: "#00A86B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  saveText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
