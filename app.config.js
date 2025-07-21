import 'dotenv/config';

export default {
  expo: {
    name: "TrainingTop",
    slug: "TrainingTop",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.anonymous.TrainingTop"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      API_URL_ANDROID: process.env.API_URL_ANDROID,
      API_URL_WEB: process.env.API_URL_WEB
    }
  }
};
