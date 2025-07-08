import React, { useEffect } from "react";
import "react-native-gesture-handler";
import RootNavigation from "./navigation/RootNavigation";
import { AuthProvider } from "./context/AuthContext";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("immersive");
    }
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar hidden={false} mode={"dark"}/>
          <RootNavigation />
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
