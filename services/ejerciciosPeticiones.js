import axios from "axios";
import { Platform } from "react-native";

const API_URL_ANDROID = "http://10.0.2.2:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchEjercicios = async () => {
    try {
      const response = await axios.get(`${API_URL}/ejercicios`);

      return {ejercicios: response.data, loading: false};
    } catch (error) {
      console.error("Error al obtener ejercicios:", error);
      return {ejercicios: [], loading: true};
    }
  };