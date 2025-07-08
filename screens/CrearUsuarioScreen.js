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
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { appFirebase } from "../firebase.js";
import { getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const auth = getAuth(appFirebase);

export default function CrearUsuario(props) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCrearUsuario = async () => {

    if (password !== confirmPassword) {
      toast.error("Error: Las contraseñas no coinciden.");
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (!nombre) {
      toast.error("Error: El nombre es obligatorio.");
      Alert.alert("Error", "Por favor ingresa tu nombre.");
      return;
    }


    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const token = user.uid

      await fetch("http://192.168.1.21:5005/usuarios/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nombre }),
      });
      await AsyncStorage.setItem('auth_token', token);
      toast.success("Cuenta creada: Bienvenido " + nombre);
      Alert.alert("Cuenta creada", "Bienvenido: " + nombre);
    } catch (error) {
      toast.error("Error: " + error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={{ position: "absolute", top: 40, left: 20, zIndex: 1 }}
        onPress={() => props.navigation.navigate("Bienvenido")}
      >
        <Image source={require("../assets/flecha-hacia-la-izquierda.png")} style={{ height: 35, width: 35 }} />
      </TouchableOpacity>

      <Image source={require("../assets/samuel-girven-VJ2s0c20qCo-unsplash.jpg")} style={[styles.image, StyleSheet.absoluteFill]} />

      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <BlurView intensity={80} style={{ borderRadius: 10, borderColor: "white", borderWidth: 3, width: 300 }}>
          <View style={styles.login}>
            <Text style={styles.titulo}>Crear Cuenta</Text>
            <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
            <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirmar Contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            
            <TouchableOpacity style={[styles.boton, { backgroundColor: "#19191980", marginTop: 30 }]} onPress={handleCrearUsuario}>
              <Text style={{ color: "white", fontWeight: "bold" }}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.boton, { backgroundColor: "#00000080" }]} onPress={() => props.navigation.navigate("IniciarSesion")}>
              <Text style={{ color: "white", fontWeight: "bold" }}>Ya tengo cuenta</Text>
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
    marginTop: 20,
  },
});
