import { SOUTHERN_VEGETABLES, Vegetable } from "@/constants/Vegetables";
import { useAppTheme } from "@/context/ThemeContext";
import { getVegetableImage } from "@/utils/imageHelper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  Layout,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Top selling ids (kept small and synced with constants/Vegetables)
const TOP_SELLING_IDS = ["2", "3", "4", "5", "11"];

export default function BillingScreen() {
  const { isDark, language } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Top" | "Favourites"
  >("All");
  const [sortOption, setSortOption] = useState<
    "default" | "price-asc" | "price-desc" | "name"
  >("default");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [favourites, setFavourites] = useState<{ [id: string]: boolean }>({});

  // Sorted & filtered vegetables based on filter, search and sort option
  const sortedVegetables = useMemo(() => {
    let list = [...SOUTHERN_VEGETABLES];

    // Filter
    if (activeFilter === "Top") {
      list = list.filter((v) => TOP_SELLING_IDS.includes(v.id));
    } else if (activeFilter === "Favourites") {
      list = list.filter((v) => favourites[v.id]);
    } else {
      // For 'All' put top selling first
      const top = list.filter((v) => TOP_SELLING_IDS.includes(v.id));
      const others = list.filter((v) => !TOP_SELLING_IDS.includes(v.id));
      list = [...top, ...others];
    }

    // Search
    if (searchQuery) {
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.tamilName.includes(searchQuery),
      );
    }

    // Sort
    if (sortOption === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortOption === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [searchQuery, activeFilter, sortOption, favourites]);

  // simple persistence for favourites (optional)
  useEffect(() => {
    // If you want to persist, read/write using storage.ts here.
  }, []);

  const addToCart = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeFromCart = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const veg = SOUTHERN_VEGETABLES.find((v) => v.id === id);
      return total + (veg ? veg.price * qty : 0);
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((a, b) => a + b, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (cartCount === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", `Bill generated for ₹${cartTotal}`);
    setCart({});
  };

  const renderVegetableItem = ({
    item,
    index,
  }: {
    item: Vegetable;
    index: number;
  }) => {
    const qty = cart[item.id] || 0;
    const isTopSelling = TOP_SELLING_IDS.includes(item.id);
    const isFav = !!favourites[item.id];

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            borderColor: isTopSelling ? "#FFD700" : "transparent",
            borderWidth: isTopSelling ? 1 : 0,
          },
        ]}
      >
        {/* Favourite toggle */}
        <TouchableOpacity
          style={[styles.favBtn, isFav ? styles.favBtnActive : null]}
          onPress={() => {
            setFavourites((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
          }}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={16}
            color={isFav ? "#E91E63" : "#FFF"}
          />
        </TouchableOpacity>

        {isTopSelling && (
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color="#FFF" />
          </View>
        )}

        <TouchableOpacity
          onLongPress={() =>
            Alert.alert(
              item.name,
              `${item.tamilName} • ₹${item.price}/kg\nOrigin: ${item.origin}`,
            )
          }
        >
          <Image source={getVegetableImage(item.image, item.name)} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text
            style={[styles.vegName, { color: isDark ? "#EEE" : "#222" }]}
            numberOfLines={1}
          >
            {language === "Tamil" ? item.tamilName : item.name}
          </Text>
          <Text style={[styles.vegPrice, { color: isDark ? "#AAA" : "#666" }]}>
            ₹{item.price} <Text style={{ fontSize: 10 }}>/kg</Text>
          </Text>

          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addToCart(item.id)}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => removeFromCart(item.id)}
              >
                <Ionicons name="remove" size={16} color="#FFF" />
              </TouchableOpacity>
              <Animated.Text
                key={qty}
                entering={ZoomIn}
                style={[styles.qtyText, { color: isDark ? "#FFF" : "#333" }]}
              >
                {qty}
              </Animated.Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: "#2E7D32" }]}
                onPress={() => addToCart(item.id)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#F5FDF7" },
      ]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.shopName, { color: isDark ? "#FFF" : "#111" }]}>
            My Vegetable Shop
          </Text>
          <Text style={[styles.subText, { color: isDark ? "#AAA" : "#666" }]}>
            Create New Bill
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={{ width: 35, height: 35 }}
          />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? "#2C2C2C" : "#FFF" },
          ]}
        >
          <Ionicons name="search" size={20} color={isDark ? "#AAA" : "#999"} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? "#FFF" : "#333" }]}
            placeholder="Search vegetables..."
            placeholderTextColor={isDark ? "#666" : "#999"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? "#AAA" : "#999"}
              />
            </TouchableOpacity>
          )}
        </View>
        {/* Filters & Sort */}
        <View style={styles.controlsRow}>
          <View style={styles.filtersRow}>
            {(["All", "Top", "Favourites"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterButton,
                  activeFilter === f ? styles.filterActive : null,
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === f ? styles.filterTextActive : null,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() =>
                setSortOption((prev) =>
                  prev === "price-asc" ? "price-desc" : "price-asc",
                )
              }
            >
              <MaterialCommunityIcons
                name="sort"
                size={16}
                color={isDark ? "#FFF" : "#333"}
              />
              <Text
                style={[styles.sortText, { color: isDark ? "#FFF" : "#333" }]}
              >
                {" "}
                {sortOption === "price-asc"
                  ? "Price ↑"
                  : sortOption === "price-desc"
                    ? "Price ↓"
                    : "Sort"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={sortedVegetables}
        keyExtractor={(item) => item.id}
        renderItem={renderVegetableItem}
        numColumns={3}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ gap: 10 }}
      />

      {/* Bottom Cart Bar */}
      {cartCount > 0 && (
        <Animated.View
          entering={FadeInDown.springify()}
          exiting={ZoomOut}
          style={styles.bottomBarContainer}
        >
          <View
            style={[
              styles.bottomBar,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFF" },
            ]}
          >
            <View style={styles.totalInfo}>
              <View style={styles.cartIconBadge}>
                <Text style={styles.cartCountText}>{cartCount}</Text>
              </View>
              <View>
                <Text
                  style={[
                    styles.totalLabel,
                    { color: isDark ? "#AAA" : "#666" },
                  ]}
                >
                  Total
                </Text>
                <Text
                  style={[
                    styles.totalValue,
                    { color: isDark ? "#FFF" : "#333" },
                  ]}
                >
                  ₹{cartTotal}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutText}>Bill / Print</Text>
              <Ionicons name="print-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shopName: {
    fontSize: 22,
    fontWeight: "800",
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
  },
  profileBtn: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 8,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    overflow: "hidden",
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FFD700",
    padding: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  cardContent: {
    alignItems: "center",
    width: "100%",
  },
  vegName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  favBtnActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vegPrice: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2E7D32",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    backgroundColor: "#DDD",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 5,
  },
  bottomBarContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  totalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cartIconBadge: {
    backgroundColor: "#333",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCountText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  checkoutBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkoutText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  controlsRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  filterActive: {
    backgroundColor: "#E8F5E9",
  },
  filterText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#2E7D32",
  },
  sortContainer: {
    marginLeft: 8,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
