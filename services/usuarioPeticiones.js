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

export const fetchProgresoRutina = async (uid, rutinaId) => {
  try {
    const response = await axios.get(
      `${API_URL}/usuarios/${uid}/progreso-rutina/${rutinaId}`
    );
    return {
      success: true,
      diaActual: response.data.diaActual,
      ultimaEjecucion: response.data.ultimaEjecucion,
    };
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    return {
      success: false,
      diaActual: 0,
    };
  }
};

// Obtener rutina activa del usuario
export const fetchRutinaActiva = async (uid) => {
  try {
    const response = await axios.get(
      `${API_URL}/usuarios/${uid}/rutina-activa`
    );
    return {
      success: true,
      rutinaActiva: response.data.rutinaActiva,
      progreso: response.data.progreso,
    };
  } catch (error) {
    console.error("Error al obtener rutina activa:", error);
    return {
      success: false,
      rutinaActiva: null,
      error: error.response?.data?.error || "Error al obtener rutina activa",
    };
  }
};

// Actualizar rutina activa
export const updateRutinaActiva = async (uid, rutinaId) => {
  try {
    const response = await axios.put(
      `${API_URL}/usuarios/${uid}/rutina-activa`,
      { rutinaId }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error al actualizar rutina activa:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Error al actualizar rutina activa",
    };
  }
};

export const actualizarUsuario = async (uid, datosActualizados) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosActualizados),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar usuario");
    }

    return await response.json();
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    throw error;
  }
};

// Obtener historial de peso
export const fetchHistorialPeso = async (uid, limite = 30) => {
  try {
    const response = await fetch(
      `${API_URL}/usuarios/${uid}/historial-peso?limite=${limite}`
    );

    if (!response.ok) {
      throw new Error("Error al obtener historial");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return [];
  }
};

// Registrar nuevo peso
export const registrarPeso = async (uid, peso) => {
  try {
    const response = await fetch(`${API_URL}/usuarios/${uid}/historial-peso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ peso }),
    });

    if (!response.ok) {
      throw new Error("Error al registrar peso");
    }

    return await response.json();
  } catch (error) {
    console.error("Error registrando peso:", error);
    throw error;
  }
};
