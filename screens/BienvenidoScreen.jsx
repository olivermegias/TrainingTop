import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView
} from "react-native";

export default function Bienvenido(props) {
  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../assets/andrew-valdivia-lJpkdx-bNc0-unsplash.jpg")}
        style={[styles.image, StyleSheet.absoluteFill]}
      />
      <Text style={styles.welcomeText}>¡Bienvenido a Training Top!</Text>
      <Text style={styles.subtitle}>Tu app para mejorar tu entrenamiento</Text>
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: "#73737380" }]}
        onPress={() => props.navigation.navigate("CrearUsuario")}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Crear Cuenta</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.boton, { backgroundColor: "#cccccc80", marginBottom: "10%" }]}
        onPress={() => props.navigation.navigate("IniciarSesion")}
      >
        <Text style={{ color: "white", fontWeight: "bold"}}>
          Ya tengo cuenta
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  welcomeText: {
    color: "#ffffff",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: "5%",
  },
  subtitle: {
    color: "#ffffff",
    textShadowColor: "#000000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    fontSize: 20,
    marginBottom: "20%",
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
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
