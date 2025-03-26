import React, { useEffect } from "react";
import "react-native-gesture-handler";
import RootNavigation from "./navigation/RootNavigation";
import { AuthProvider } from "./context/AuthContext";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Platform, SafeAreaView, StyleSheet } from "react-native";

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("immersive");
    }
  }, []);

  return (
    <AuthProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar hidden={true} />
        <RootNavigation />
      </SafeAreaView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  }
});
