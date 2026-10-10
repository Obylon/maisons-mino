// Pour Expo Go sur téléphone : mets l'IP locale de ta machine (pas localhost).
// Exemple : http://192.168.1.42:8081/api
// Lance `ipconfig` (Windows) pour trouver ton IP.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.49:8081/api";

module.exports = {
  expo: {
    name: "Maisons MINO",
    slug: "mino-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: ["expo-secure-store", "expo-font", "expo-splash-screen"],
    extra: { apiUrl: API_URL },
  },
};
