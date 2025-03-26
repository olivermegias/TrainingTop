import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
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
} from "react-native";
import { BlurView } from "expo-blur";
import { signInWithEmailAndPassword } from "firebase/auth";
import { appFirebase } from "../firebase.js";
import { getAuth } from "firebase/auth";

// Importar toast y ToastContainer
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const auth = getAuth(appFirebase);

export default function IniciarSesion(props) {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleIniciarSesion = async () => {
    if (!validateEmail(email)) {
      toast.error("Por favor, ingrese un correo electrónico válido.");
      Alert.alert("Por favor, ingrese un correo electrónico válido.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      toast.success(`Usuario logueado: ${user.email}`);
      Alert.alert("Usuario logueado:", user.email);
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      Alert.alert("Error ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ position: "absolute", top: 40, left: 20, zIndex: 1 }}
        onPress={() => props.navigation.navigate("Bienvenido")}
      >
        <Image
          source={require("../assets/flecha-hacia-la-izquierda.png")}
          style={{
            height: 35,
            width: 35,
          }}
        />
      </TouchableOpacity>

      <Image
        source={require("../assets/samuel-girven-VJ2s0c20qCo-unsplash.jpg")}
        style={[styles.image, StyleSheet.absoluteFill]}
      />
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignContent: "center",
        }}
      >
        <BlurView
          intensity={80}
          style={{
            borderRadius: 10,
            borderColor: "white",
            borderWidth: 3,
            width: 300,
          }}
        >
          <View style={styles.login}>
            {Platform.OS !== "web" && (
              <Image
                source={require("../assets/pexels-cottonbro-4761779.jpg")}
                style={{
                  width: 120,
                  height: 120,
                  marginHorizontal: "20%",
                  margin: "5%",
                  borderRadius: 800,
                }}
              />
            )}

            <Text style={styles.titulo}>Inicia sesión en Training Top</Text>
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address" // Agrega esto
              autoCapitalize="none" // Para evitar mayúsculas innecesarias
              onFocus={() => {}}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              onChangeText={(text) => setPassword(text)}
              secureTextEntry
            />
            <TouchableOpacity
              style={[
                styles.boton,
                { backgroundColor: "#22222280", marginTop: 30 },
              ]}
              onPress={handleIniciarSesion}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Inicar Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, { backgroundColor: "#00000080" }]}
              onPress={() => props.navigation.navigate("CrearUsuario")}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  login: {
    width: "auto",
    height: "auto",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 40,
    borderColor: "#fff",
    borderWidth: 2,
    marginBottom: 20,
    width: "80%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff90",
  },
  boton: {
    padding: 10,
    borderRadius: 10,
    borderColor: "#fff",
    borderWidth: 2,
    width: "50%",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
    textAlign: "center",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 1,
  },
});
