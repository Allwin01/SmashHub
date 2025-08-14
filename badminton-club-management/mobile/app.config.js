export default {
  expo: {
    name: "SmashHub",
    slug: "smashhub",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      package: "com.smashhub.mobile",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    extra: {
      apiUrl: process.env.BASE_URL_MOBILE || "http://192.168.1.105:5050"
    }
  }
};
