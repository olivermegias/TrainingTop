import React, { useState, useContext, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Importar contexto de autenticación
import { AuthContext } from "../context/AuthContext";//

// Importar toast y ToastContainer
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useFocusEffect } from "@react-navigation/native";

export default function IniciarSesion(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // Usamos el contexto de autenticación
  const { iniciarSesion, loading } = useContext(AuthContext);

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleIniciarSesion = async () => {
    if (!validateEmail(email)) {
      Platform.OS === 'web' ? toast.error("Por favor, ingrese un correo electrónico válido.") :
        Alert.alert("Error", "Por favor, ingrese un correo electrónico válido.");
      return;
    }

    try {
      const result = await iniciarSesion(email, password);

      if (result.success) {
        // Mostrar mensaje de éxito
        Platform.OS === 'web' ? toast.success(`Usuario logueado: ${result.user.email}`) :
          Alert.alert("Éxito", `Usuario logueado: ${result.user.email}`);
      } else {
        // Mostrar mensaje de error
        Platform.OS === 'web' ? toast.error(`Error: ${result.error.message}`) :
          Alert.alert("Error", result.error.message);
      }
    } catch (error) {
      Platform.OS === 'web' ? toast.error(`Error: ${error.message}`) :
        Alert.alert("Error", error.message);
    }
  };

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
        <View style={[styles.circle, { top: -30, right: -30 }]} />
        <View style={[styles.circle, { bottom: -50, left: -50, width: 150, height: 150, opacity: 0.1 }]} />
      </View>

      {/* Botón de retroceso */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => props.navigation.navigate("Bienvenido")}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assets/image.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para continuar tu progreso
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={20} color="#6200EE" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6200EE" />
              </View>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6200EE"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot password link */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botones */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleIniciarSesion}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ["#999", "#777"] : ["#7C3AED", "#6D28D9"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Ionicons name="hourglass-outline" size={20} color="white" />
                ) : (
                  <Ionicons name="log-in" size={20} color="white" />
                )}
                <Text style={styles.primaryButtonText}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => props.navigation.navigate("CrearUsuario")}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={20} color="white" />
              <Text style={styles.secondaryButtonText}>
                Crear una cuenta nueva
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    padding: 5,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -10,
  },
  forgotPasswordText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
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
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  secondaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  featuresContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 15,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
});