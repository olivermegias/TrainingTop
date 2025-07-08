import React, { createContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getAuth } from "firebase/auth";
import { appFirebase } from "../firebase.js";
import { fetchUsuarioByUid } from "../services/usuarioPeticiones.js";

export const AuthContext = createContext();
const auth = getAuth(appFirebase);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado para el usuario
  const [loading, setLoading] = useState(false); // Estado de carga

  // Añadimos la función de iniciar sesión directamente en el contexto
  const iniciarSesion = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const usuario = userCredential.user;
      const token = usuario.uid;
      
      // Guardar token
      await AsyncStorage.setItem('auth_token', token);
      
      // Obtener datos completos del usuario desde tu servicio
      const usuarioData = await fetchUsuarioByUid(token);
      
      // Actualizar el estado del usuario
      setUser(usuarioData || usuario);
      
      setLoading(false);
      return { success: true, user: usuarioData || usuario };
    } catch (error) {
      setLoading(false);
      return { success: false, error };
    }
  };

  const cerrarSesion = async () => {
    setLoading(true);
    try {
      await signOut(auth); // Cierra la sesión en Firebase
      setUser(null); // Limpia el estado del usuario
      await AsyncStorage.removeItem("auth_token"); // Elimina el token del almacenamiento
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      setLoading,
      iniciarSesion, 
      cerrarSesion 
    }}>
      {children}
    </AuthContext.Provider>
  );
};