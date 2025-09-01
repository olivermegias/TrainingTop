import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function Bienvenido(props) {
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#6200EE");

      return () => {
        StatusBar.setBarStyle("dark-content");
        StatusBar.setBackgroundColor("#F5F5F5");
      };
    }, [])
  );
  return (
    <SafeAreaView style={styles.container}>

      {/* Fondo con gradiente */}
      <LinearGradient
        colors={["#6200EE", "#5600D8", "#4A00C2"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Elementos decorativos */}
      <View style={styles.decorativeElements}>
        <View style={[styles.circle, { top: -50, right: -50 }]} />
        <View style={[styles.circle, { bottom: -80, left: -80, width: 200, height: 200, opacity: 0.1 }]} />
        <View style={[styles.circle, { top: 100, left: -30, width: 100, height: 100, opacity: 0.05 }]} />
      </View>

      <View style={styles.content}>
        {/* Logo principal */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/image.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Textos de bienvenida */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Transforma tu entrenamiento con Training Top
          </Text>
          <Text style={styles.description}>
            La app completa para gestionar tus rutinas,
            seguir tu progreso y alcanzar tus metas fitness
          </Text>
        </View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => props.navigation.navigate("CrearUsuario")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#7C3AED", "#6D28D9"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => props.navigation.navigate("IniciarSesion")}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in" size={20} color="white" />
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6200EE",
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 200,
    borderRadius: 30
  },
  textContainer: {
    alignItems: "center",
    marginVertical: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  buttonsContainer: {
    gap: 15,
  },
  primaryButton: {
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
});