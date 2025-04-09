import axios from "axios";
import { Platform } from "react-native";
import { Alert } from "react-native";

const API_URL_ANDROID = "http://10.0.2.2:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export const fetchRutinasPublicas = async (rutinasUsuario) => {
  try {
    const response = await axios.get(`${API_URL}/rutinas/publicas`);
    // Filtramos para evitar mostrar rutinas que ya pertenecen al usuario
    const rutinasPublicasUnicas = response.data.filter(
      (rutinaPublica) =>
        !rutinasUsuario.some(
          (rutinaUser) => rutinaUser._id === rutinaPublica._id
        )
    );
    const loadingPublicas = false;
    return { rutinasPublicasUnicas, loadingPublicas }; // Retornamos las rutinas públicas únicas
  } catch (error) {
    console.error("Error al obtener rutinas públicas:", error);
    return { rutinasPublicasUnicas: [], loadingPublicas: false };
  }
};

export const fetchRutinasUsuario = async () => {
  try {
    const response = await axios.get(`${API_URL}/rutinas/usuario`);
    const rutinasUsuario = response.data;
    const loadingUsuario = false;
    return { rutinasUsuario, loadingUsuario };
  } catch (error) {
    console.error("Error al obtener rutinas del usuario:", error);
    const loadingUsuario = false;
    return { rutinasUsuario: [], loadingUsuario };
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

export const deleteRutina = async () => {
  Alert.alert(
    "Eliminar Rutina",
    "¿Estás seguro que deseas eliminar esta rutina?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/rutinas/${rutina._id}`);
            navigation.goBack();
          } catch (error) {
            console.error("Error al eliminar rutina:", error);
            Alert.alert("Error", "No se pudo eliminar la rutina");
          }
        },
      },
    ]
  );
};
