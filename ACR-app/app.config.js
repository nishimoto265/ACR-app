// /media/thithilab/ボリューム1/ACR/ACR-app/app.config.js

export default {
  expo: {
    name: "ACR-app", // Your app name
    slug: "acr-app", // Your app slug
    version: "1.0.0",
    orientation: "portrait",
    // icon: "./assets/icon.png", // Ensure this path exists or update
    userInterfaceStyle: "light",
    // splash: {
    //   image: "./assets/splash.png", // Ensure this path exists or update
    //   resizeMode: "contain",
    //   backgroundColor: "#ffffff"
    // },
    ios: {
      supportsTablet: true
      // Add bundleIdentifier if needed: bundleIdentifier: "com.thithilab.acr"
    },
    android: {
      // adaptiveIcon: {
      //   foregroundImage: "./assets/adaptive-icon.png", // Ensure this path exists or update
      //   backgroundColor: "#ffffff"
      // },
      package: "com.thithilab.acr", // <<< Your Android package name
      googleServicesFile: "./google-services.json" // Reference the downloaded file
    },
    web: {
      // favicon: "./assets/favicon.png", // Ensure this path exists or update
      bundler: "metro"
    },
    // --- Firebase config from console --- 
    extra: {
      // firebaseApiKey: "AIzaSyBkatT5A9CYEE8cBkgXwS9pUCGVvC3AMpM", // REMOVED - Leaked key
      firebaseAuthDomain: "acr-project-247b4.firebaseapp.com",
      firebaseProjectId: "acr-project-247b4",
      firebaseStorageBucket: "acr-project-247b4.firebasestorage.app",
      firebaseMessagingSenderId: "969226467169",
      firebaseAppId: "1:969226467169:web:3844dc59a5fad400677720",
      firebaseMeasurementId: "G-X6JH8W63C4", // Optional
      eas: {
        projectId: "a950e47f-37aa-4f92-b910-e060a64116a2"
      }
      // eas: { // Example for EAS Build projectId if you use it
      //   projectId: "YOUR_EAS_PROJECT_ID"
      // }
    },
    // --- End of Firebase config --- 
     plugins: [ // Ensure expo-router plugin is added if using Expo Router
       "expo-router"
     ],
     scheme: "acr-app" // Optional: for deep linking
  }
};
