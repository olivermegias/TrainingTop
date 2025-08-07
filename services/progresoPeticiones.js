import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const { API_URL_ANDROID, API_URL_WEB } = Constants.expoConfig.extra;
const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchProgresoEjercicios = async (usuarioId, limite = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/progreso/ejercicios/${usuarioId}`,
      { params: { limite } }
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener progreso de ejercicios:", error);
    return { success: false, ejercicios: [] };
  }
};

export const fetchProgresoRutina = async (usuarioId, rutinaId) => {
  try {
    const response = await axios.get(
      `${API_URL}/progreso/rutinas/${usuarioId}/${rutinaId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener progreso de rutina:", error);
    return { success: false, progreso: null };
  }
};

export const fetchEstadisticasMusculos = async (usuarioId) => {
  try {
    const response = await axios.get(
      `${API_URL}/progreso/musculos/${usuarioId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas de músculos:", error);
    return { success: false, musculos: [] };
  }
};