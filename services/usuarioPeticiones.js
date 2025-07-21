import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const { API_URL_ANDROID, API_URL_WEB } = Constants.expoConfig.extra;

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchUsuarioByToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/usuarios/${token}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
    throw error; // Lanza el error para manejarlo en el componente
  }
};

export const fetchUsuarioByUid = async (uid) => {
  try {
    const response = await axios.get(`${API_URL}/usuarios/${uid}`);
    return response.data; // Devuelve los datos del usuario
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
    throw error; // Lanza el error para manejarlo en el componente
  }
};
