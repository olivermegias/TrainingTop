import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigation from "./AppNavigation.js";
import AuthNavigation from "./AuthNavigation.js";
import { AuthContext } from "../context/AuthContext.js";
import { View, Image, Platform } from "react-native";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image source={require("../assets/icons8-banca-pesas.gif")} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        {user ? <AppNavigation /> : <AuthNavigation />}
      </NavigationContainer>
      {Platform.OS === "web" && <ToastContainer position="top-center" />}
    </>
  );
}
