import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";

const { API_URL_ANDROID, API_URL_WEB } = Constants.expoConfig.extra;
const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

// Guardar un nuevo entrenamiento
export const guardarEntrenamiento = async (datosEntrenamiento) => {
  try {
    const response = await axios.post(
      `${API_URL}/entrenamientos`,
      datosEntrenamiento,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 segundos de timeout
      }
    );

    console.log("✅ Respuesta del servidor:", response.data);
    return {
      success: true,
      data: response.data,
      message: response.data.message || "Entrenamiento guardado correctamente",
    };
  } catch (error) {
    console.error("❌ Error al guardar entrenamiento:", error);

    let errorMessage = "Error al guardar el entrenamiento";

    if (error.response) {
      // Error del servidor
      errorMessage = error.response.data.error || errorMessage;
      console.error("Error del servidor:", error.response.data);
    } else if (error.request) {
      // Error de red
      errorMessage = "No se pudo conectar con el servidor";
      console.error("Error de red:", error.request);
    } else {
      // Otro tipo de error
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Obtener entrenamientos del usuario
export const fetchEntrenamientosUsuario = async (
  usuarioId,
  limite = 10,
  pagina = 1
) => {
  try {
    const response = await axios.get(
      `${API_URL}/entrenamientos/usuario/${usuarioId}`,
      {
        params: { limite, pagina },
      }
    );

    return {
      success: true,
      entrenamientos: response.data.entrenamientos,
      paginacion: response.data.paginacion,
    };
  } catch (error) {
    console.error("Error al obtener entrenamientos:", error);
    return {
      success: false,
      entrenamientos: [],
      error: error.response?.data?.error || "Error al obtener entrenamientos",
    };
  }
};

// Obtener estadísticas del usuario
export const fetchEstadisticasUsuario = async (usuarioId, periodo = "mes") => {
  try {
    const response = await axios.get(
      `${API_URL}/entrenamientos/estadisticas/${usuarioId}`,
      {
        params: { periodo },
      }
    );

    return {
      success: true,
      estadisticas: response.data.estadisticas,
      periodo: response.data.periodo,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return {
      success: false,
      estadisticas: null,
      error: error.response?.data?.error || "Error al obtener estadísticas",
    };
  }
};

// Obtener detalles de un entrenamiento específico
export const fetchDetalleEntrenamiento = async (entrenamientoId) => {
  try {
    const response = await axios.get(
      `${API_URL}/entrenamientos/${entrenamientoId}`
    );

    return {
      success: true,
      entrenamiento: response.data,
    };
  } catch (error) {
    console.error("Error al obtener detalle del entrenamiento:", error);
    return {
      success: false,
      entrenamiento: null,
      error: error.response?.data?.error || "Error al obtener el entrenamiento",
    };
  }
};

export const fetchRutinasEntrenadas = async (usuarioId) => {
  try {
    const response = await axios.get(
      `${API_URL}/entrenamientos/rutinas-entrenadas/${usuarioId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error al obtener rutinas entrenadas:", error);
    return {
      success: false,
      rutinas: [],
      error:
        error.response?.data?.error || "Error al obtener rutinas entrenadas",
    };
  }
};

export const calcularPromedios = (entrenamiento) => {
  if (!entrenamiento.ejercicios || entrenamiento.ejercicios.length === 0) {
    return { satisfaccion: 0, esfuerzo: 0, dificultad: 0 };
  }

  let totalSatisfaccion = 0;
  let totalEsfuerzo = 0;
  let totalDificultad = 0;
  let contadorValoraciones = 0;

  entrenamiento.ejercicios.forEach((ejercicio) => {
    if (ejercicio.valoracion) {
      totalSatisfaccion += ejercicio.valoracion.satisfaccion || 0;
      totalEsfuerzo += ejercicio.valoracion.esfuerzo || 0;
      totalDificultad += ejercicio.valoracion.dificultad || 0;
      contadorValoraciones++;
    }
  });

  if (contadorValoraciones === 0) {
    return { satisfaccion: 0, esfuerzo: 0, dificultad: 0 };
  }

  return {
    satisfaccion: Math.round(totalSatisfaccion / contadorValoraciones),
    esfuerzo: Math.round(totalEsfuerzo / contadorValoraciones),
    dificultad: Math.round(totalDificultad / contadorValoraciones),
  };
};

export const getEmojiSatisfaccion = (valor) => {
  const valorRedondeado = Math.round(valor);
  switch (valorRedondeado) {
    case 1:
      return "😞";
    case 2:
      return "😕";
    case 3:
      return "😐";
    case 4:
      return "😊";
    case 5:
      return "😄";
    default:
      return "😐";
  }
};

export const getEmojiEsfuerzo = (valor) => {
  const valorRedondeado = Math.round(valor);
  switch (valorRedondeado) {
    case 1:
      return "😴";
    case 2:
      return "🙂";
    case 3:
      return "😤";
    case 4:
      return "💪";
    case 5:
      return "🔥";
    default:
      return "😤";
  }
};

export const getColorDificultad = (valor) => {
  const valorRedondeado = Math.round(valor);
  switch (valorRedondeado) {
    case 1:
      return "#4CAF50";
    case 2:
      return "#8BC34A";
    case 3:
      return "#FFC107";
    case 4:
      return "#FF9800";
    case 5:
      return "#F44336";
    default:
      return "#FFC107";
  }
};

export const getTextoDificultad = (valor) => {
  const valorRedondeado = Math.round(valor);
  switch (valorRedondeado) {
    case 1:
      return "Muy fácil";
    case 2:
      return "Fácil";
    case 3:
      return "Moderada";
    case 4:
      return "Difícil";
    case 5:
      return "Muy difícil";
    default:
      return "Moderada";
  }
};

// Analizar entrenamiento completado con IA
export const analizarEntrenamientoConIA = async (datosAnalisis) => {
  console.log("🚀 Enviando datos para análisis IA:", datosAnalisis);

  try {
    const response = await axios.post(
      `${API_URL}/ia/analyze-workout`,
      datosAnalisis,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 180000, // 3 minutos de timeout para Ollama
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Aceptar cualquier respuesta que no sea error de servidor
        },
      }
    );

    console.log("✅ Respuesta IA recibida:", response.data);

    // Verificar si la respuesta tiene el formato esperado
    if (response.data && response.data.analisis) {
      return {
        success: true,
        data: response.data,
      };
    } else {
      console.warn("⚠️ Respuesta IA incompleta, usando fallback");
      return {
        success: true,
        data: {
          analisis:
            "Entrenamiento completado. El análisis detallado no está disponible en este momento.",
          ejerciciosRecomendados: [],
          metricas: response.data?.metricas || {},
          timestamp: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    console.error("❌ Error al analizar entrenamiento:", error.message);

    // NO lanzar error, devolver respuesta de fallback
    return {
      success: true,
      data: {
        analisis:
          "¡Buen trabajo! El análisis detallado está tomando más tiempo del esperado. Tu entrenamiento ha sido guardado correctamente.",
        ejerciciosRecomendados: [],
        metricas: {
          porcentajeCompletado: 100,
          promedioSatisfaccion: "3",
          totalSeriesCompletadas: datosAnalisis?.entrenamientoData?.length || 0,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
};
