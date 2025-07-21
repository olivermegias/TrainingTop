import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const { API_URL_ANDROID, API_URL_WEB } = Constants.expoConfig.extra;

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchEjercicios = async () => {
  try {
    const response = await axios.get(`${API_URL}/ejercicios`);

    return { ejercicios: response.data, loading: false };
  } catch (error) {
    console.error("Error al obtener ejercicios:", error);
    return { ejercicios: [], loading: true };
  }
};

export const fetchEjerciciosPorIds = async (ids) => {
  try {
    if (!ids || ids.length === 0) {
      return { ejercicios: [] };
    }

    // Filtrar IDs válidos y únicos
    const idsUnicos = [...new Set(ids.filter((id) => id))];

    const response = await fetch(
      `${API_URL}/ejercicios/porIds?ids=${idsUnicos.join(",")}`
    );
    if (!response.ok) {
      throw new Error("Error al obtener ejercicios por IDs");
    }

    const ejercicios = await response.json();
    return { ejercicios };
  } catch (error) {
    console.error("Error en fetchEjerciciosPorIds:", error);
    throw error;
  }
};

// NUEVA FUNCIÓN: Obtener un ejercicio por ID individual
export const fetchEjercicioPorId = async (id) => {
  try {
    if (!id) {
      throw new Error("ID de ejercicio requerido");
    }

    const response = await fetch(`${API_URL}/ejercicios/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Ejercicio no encontrado");
      }
      throw new Error("Error al obtener ejercicio");
    }

    const ejercicio = await response.json();
    return ejercicio;
  } catch (error) {
    console.error("Error en fetchEjercicioPorId:", error);
    throw error;
  }
};
