import { SOUTHERN_VEGETABLES } from "@/constants/Vegetables";
import { ImageSourcePropType } from "react-native";

const imageMap: { [key: string]: any } = {
  "Beans.png": require("../assets/images/Beans.png"),
  "BottleGourd.png": require("../assets/images/BottleGourd.png"),
  "Brinjal.png": require("../assets/images/Brinjal.png"),
  "Cabbage.png": require("../assets/images/Cabbage.png"),
  "Carrot.png": require("../assets/images/Carrot.png"),
  "Cauliflower.png": require("../assets/images/Cauliflower.png"),
  "Chilli.png": require("../assets/images/Chilli.png"),
  "Drumstick.png": require("../assets/images/Drumstick.png"),
  "Elephant.png": require("../assets/images/Elephant.png"),
  "Ginger.png": require("../assets/images/Ginger.png"),
  "Lady's Finger.png": require("../assets/images/LadyFinger.png"),
  "Onion.png": require("../assets/images/Onion.png"),
  "Potato.png": require("../assets/images/Potato.png"),
  "Raddish.png": require("../assets/images/Raddish.png"),
  "RawMango.png": require("../assets/images/RawMango.png"),
  "Snake Gourd.png": require("../assets/images/SnakeGourd.png"),
  "Taro Root.png": require("../assets/images/TaroRoot.png"),
  "Tomato.png": require("../assets/images/Tomato.png"),
};

export const getVegetableImage = (
  image: string,
  name?: string,
): ImageSourcePropType => {
  if (!image) {
    // Try searching by name if image is missing
    if (name) {
      const match = SOUTHERN_VEGETABLES.find(
        (v) =>
          v.name.toLowerCase() === name.toLowerCase() ||
          name.toLowerCase().includes(v.name.toLowerCase()),
      );
      if (match) return getVegetableImage(match.image);
    }
    return { uri: "https://cdn-icons-png.flaticon.com/512/135/135687.png" };
  }

  if (image.startsWith("local://")) {
    const imageName = image.replace("local://", "");
    return (
      imageMap[imageName] || {
        uri: "https://cdn-icons-png.flaticon.com/512/135/135687.png",
      }
    );
  }

  if (image.startsWith("http")) {
    return { uri: image };
  }

  return { uri: image }; // Fallback
};
