import axios from "axios";
import { Platform } from "react-native";
import { Alert } from "react-native";

const API_URL_ANDROID = "http://192.168.1.21:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchRutinasPublicas = async () => {
  try {
    const response = await axios.get(`${API_URL}/rutinas/publicas`);
    return {
      rutinasPublicasUnicas: response.data, // ← ya no filtramos
      loadingPublicas: false,
    };
  } catch (error) {
    console.error("Error al obtener rutinas públicas:", error);
    return {
      rutinasPublicasUnicas: [],
      loadingPublicas: false,
    };
  }
};

export const fetchRutinasUsuario = async (usuarioId) => {
  try {
    const response = await axios.get(`${API_URL}/rutinas/usuario/${usuarioId}`);

    return {
      rutinasUsuario: response.data,
      loadingUsuario: false,
    };
  } catch (error) {
    return {
      rutinasUsuario: [],
      loadingUsuario: false,
    };
  }
};

export const fetchEjerciciosDetails = async (rutina) => {
  try {
    if (!rutina || !rutina.dias) {
      console.warn("⚠️ No hay rutina o días disponibles");
      return;
    }

    const ejerciciosIds = rutina.dias.flatMap((dia) =>
      dia.ejercicios.map((ejercicio) => ejercicio.ejercicio)
    );

    if (ejerciciosIds.length === 0) {
      console.warn("⚠️ No hay ejercicios en la rutina");
      return;
    }

    const uniqueIds = [...new Set(ejerciciosIds)];

    // Construir la URL con los IDs como query params
    const queryParams = uniqueIds.join(",");
    const response = await axios.get(
      `${API_URL}/ejercicios/porIds?ids=${queryParams}`
    );
    // Crear un mapeo de ID a objeto ejercicio
    const ejerciciosMap = {};
    response.data.forEach((ejercicio) => {
      ejerciciosMap[ejercicio.id] = ejercicio;
    });

    return { ejerciciosData: ejerciciosMap, loading: false };
  } catch (error) {
    console.error("❌ Error al obtener detalles de ejercicios:", error);
    Alert.alert(
      "Error",
      "No se pudieron cargar los detalles de los ejercicios"
    );
    return { ejerciciosMap: {}, loading: false };
  }
};

export const asignarRutina = async (usuarioId, rutinaId) => {
  try {
    const response = await axios.post(`${API_URL}/rutinas/asignar`, {
      usuarioId,
      rutinaId,
    });
    return response.data;
  } catch (error) {
    console.error("Error al asignar rutina:", error);
    throw error;
  }
};

export const crearRutina = async (rutina) => {
  try {
    const response = await axios.post(`${API_URL}/rutinas`, rutina);
    return response.data;
  } catch (error) {
    console.error("Error al crear rutina:", error);
    throw error;
  }
};

export const deleteRutina = async (rutinaId) => {
  try {
    const response = await axios.delete(`${API_URL}/rutinas/${rutinaId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar rutina:", error);
    throw error;
  }
};

export const actualizarRutina = async (rutinaId, datosRutina) => {
  try {
    console.log(datosRutina.dias.ejercicios);
    const response = await axios.put(
      `${API_URL}/rutinas/${rutinaId}`,
      datosRutina
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error al actualizar la rutina:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.error || "Error al actualizar la rutina"
    );
  }
};
