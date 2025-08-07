import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigation from "./AppNavigation";
import AuthNavigation from "./AuthNavigation";
import { AuthContext } from "../context/AuthContext";
import { View, Image, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchUsuarioByUid } from "../services/usuarioPeticiones";

export default function RootNavigator() {
  const { user, loading, setUser, setLoading } = useContext(AuthContext);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        setIsCheckingToken(true);
        
        // Verificar si hay un token guardado
        const storedToken = await AsyncStorage.getItem("auth_token");
        
        if (storedToken) {
          setLoading(true);
          try {
            // Obtener datos del usuario usando el token
            const usuario = await fetchUsuarioByUid(storedToken);
            
            if (usuario) {
              console.log("Usuario encontrado con token:", usuario);
              setUser(usuario); // Actualiza el contexto con el usuario
            } else {
              console.log("No se encontró usuario, eliminando token");
              await AsyncStorage.removeItem("auth_token");
            }
          } catch (fetchError) {
            console.error("Error al obtener usuario:", fetchError);
            // Si hay un error al obtener el usuario, eliminamos el token
            await AsyncStorage.removeItem("auth_token");
          } finally {
            setLoading(false);
          }
        } else {
          console.log("No hay token guardado");
        }
      } catch (error) {
        console.error("Error al verificar el token:", error);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, []);


  // Mostrar un loader mientras se verifica el token o se está cargando
  if (isCheckingToken || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image 
          source={require("../assets/icons8-banca-pesas.gif")} 
          style={{ width: 50, height: 50 }}
        />
        <Text style={{ marginTop: 10 }}>
          {isCheckingToken ? "Verificando sesión..." : "Cargando..."}
        </Text>
      </View>
    );
  }

  // Renderizar la navegación apropiada según si hay un usuario o no
  return (
    <NavigationContainer>
      {user ? <AppNavigation /> : <AuthNavigation />}
    </NavigationContainer>
  );
}