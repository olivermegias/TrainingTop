import axios from "axios";
import { Platform } from "react-native";

const API_URL_ANDROID = "http://192.168.1.21:5005";
const API_URL_WEB = "http://localhost:5005";

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
