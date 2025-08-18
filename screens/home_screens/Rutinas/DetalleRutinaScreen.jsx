import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  fetchEjerciciosDetails,
  deleteRutina,
  asignarRutina,
} from "../../../services/rutinasPeticiones";
import {
  fetchRutinaActiva,
  updateRutinaActiva,
} from "../../../services/usuarioPeticiones";
import { DiaEntrenamiento } from "./components/DiaEnternamiento";
import { AuthContext } from "../../../context/AuthContext";
import { Toast } from "../../../components/ToastComponent";
import {
  fetchEntrenamientosUsuario,
  calcularPromedios,
  getColorDificultad,
  getEmojiEsfuerzo,
  getEmojiSatisfaccion,
  getTextoDificultad,
} from "../../../services/entrenamientoPeticiones";
import { DetalleEntrenamientoModal } from '../../../components/DetalleEntrenamientoModal';

export default function DetalleRutinaScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [rutina, setRutina] = useState(route.params?.rutina || null);
  const [loading, setLoading] = useState(true);
  const [ejerciciosData, setEjerciciosData] = useState({});
  const { user } = useContext(AuthContext);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [historialEntrenamientos, setHistorialEntrenamientos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(true);
  const [esRutinaActiva, setEsRutinaActiva] = useState(false);
  const [entrenamientoSeleccionado, setEntrenamientoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const obtenerDatos = async () => {
      const { ejerciciosData, loading } = await fetchEjerciciosDetails(rutina);
      setEjerciciosData(ejerciciosData);
      setLoading(loading);
    };
    if (rutina) {
      obtenerDatos();
    } else {
      setLoading(false);
    }
  }, [rutina]);

  useEffect(() => {
    const cargarHistorial = async () => {
      if (rutina && user) {
        setLoadingHistorial(true);
        try {
          const resultado = await fetchEntrenamientosUsuario(user.uid);
          if (resultado.success) {
            // Filtrar solo los entrenamientos de esta rutina
            const entrenamientosRutina = resultado.entrenamientos.filter(
              (e) => e.rutinaId === rutina._id || e.rutinaId._id === rutina._id
            );
            setHistorialEntrenamientos(entrenamientosRutina);
          }
        } catch (error) {
          console.error("Error al cargar historial:", error);
        }
        setLoadingHistorial(false);
      }
    };

    cargarHistorial();
  }, [rutina, user]);

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (date.toDateString() === hoy.toDateString()) {
      return `Hoy, ${date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === ayer.toDateString()) {
      return `Ayer, ${date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatearDuracion = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}m ${secs}s`;
  };

  useEffect(() => {
    const verificarRutinaActiva = async () => {
      const resultado = await fetchRutinaActiva(user.uid);
      if (resultado.success && resultado.rutinaActiva) {
        setEsRutinaActiva(resultado.rutinaActiva._id === rutina._id);
      }
    };

    verificarRutinaActiva();
  }, [user.uid, rutina._id]);

  const handleSetComoActiva = async () => {
    try {
      const resultado = await updateRutinaActiva(user.uid, rutina._id);
      if (resultado.success) {
        setEsRutinaActiva(true);
        setToast({
          visible: true,
          message: "Rutina establecida como activa",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setToast({
        visible: true,
        message: "Error al establecer rutina activa",
        type: "error",
      });
    }
  };

  const renderNivelEstrellas = (nivel) => {
    const nivelNumerico =
      typeof nivel === "string"
        ? parseInt(nivel.replace(/\D/g, "")) || 3
        : typeof nivel === "number"
          ? nivel
          : 3;

    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i < nivelNumerico ? "star" : "star-outline"}
          size={16}
          color={i < nivelNumerico ? "#FFC107" : "#BDBDBD"}
          style={styles.star}
        />
      );
    }
    return stars;
  };

  const startRutina = () => {
    navigation.navigate("EjecutarRutina", { rutina });
  };

  const editRutina = () => {
    navigation.navigate("EditarRutina", { rutina });
  };

  const handleDeleteRutina = async () => {
    // En Android, mostrar el alert de confirmación
    if (Platform.OS === "android") {
      Alert.alert(
        "Eliminar Rutina",
        "¿Estás seguro de que deseas eliminar esta rutina? Esta acción no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: async () => {
              await deleteRutinaAction();
            },
          },
        ]
      );
    } else {
      // En web, eliminar directamente sin confirmación
      await deleteRutinaAction();
    }
  };

  // Función para manejar la eliminación de la rutina
  const deleteRutinaAction = async () => {
    try {
      await deleteRutina(rutina._id);

      if (Platform.OS === "android") {
        Alert.alert("Éxito", "Rutina eliminada correctamente", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Rutina"),
          },
        ]);
      } else {
        // En web, mostrar un toast y luego navegar hacia atrás
        setToast({
          visible: true,
          message: "Rutina eliminada correctamente",
          type: "success",
        });

        // Dar tiempo al toast para mostrarse antes de navegar
        setTimeout(() => {
          navigation.navigate("Rutina");
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "No se pudo eliminar la rutina";

      if (Platform.OS === "android") {
        Alert.alert("Error", errorMessage);
      } else {
        // En web, mostrar un toast con el error
        setToast({
          visible: true,
          message: errorMessage,
          type: "error",
        });
        console.error(errorMessage);
      }
    }
  };

  const handleAsignarRutina = async () => {
    try {
      await asignarRutina(user.uid, rutina._id);

      if (Platform.OS === "android") {
        Alert.alert("Rutina asignada");
      } else {
        // En web, mostrar un toast en lugar del Alert
        setToast({
          visible: true,
          message: "Rutina asignada correctamente",
          type: "success",
        });
      }
      navigation.goBack();
    } catch (error) {
      if (Platform.OS === "android") {
        Alert.alert("Error", "No se pudo asignar la rutina.");
      } else {
        // En web, mostrar un toast con el error
        setToast({
          visible: true,
          message: "No se pudo asignar la rutina",
          type: "error",
        });
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rutina) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar la rutina</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Rutina")}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.navigate("Rutina")}
          >
            <Ionicons name="arrow-back" size={24} color="#6200EE" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {esRutinaActiva && (
              <View style={styles.setActiveMainButton}>
                <Ionicons name="star" size={20} color="#FFC107" />
                <Text style={styles.setActiveMainButtonText}>
                  Rutina activa
                </Text>
              </View>
            )}
            {!rutina.publica && (
              <>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={editRutina}
                >
                  <Ionicons name="create-outline" size={24} color="#6200EE" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={handleDeleteRutina}
                >
                  <Ionicons name="trash-outline" size={24} color="#F44336" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.rutinaHeader}>
          <Text style={styles.rutinaTitle}>{rutina.nombre}</Text>

          <View style={styles.nivelContainer}>
            <Text style={styles.nivelLabel}>Nivel: </Text>
            {renderNivelEstrellas(rutina.nivel)}
          </View>

          {rutina.publica && (
            <View style={styles.publicBadge}>
              <Ionicons name="globe-outline" size={16} color="white" />
              <Text style={styles.publicText}>Rutina Pública</Text>
            </View>
          )}

          <Text style={styles.descripcion}>
            {rutina.descripcion || "Sin descripción"}
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={18} color="#6200EE" />
              <Text style={styles.infoText}>{rutina.dias.length} días</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.diasContainer}>
          <Text style={styles.sectionTitle}>Días de Entrenamiento</Text>

          {rutina.dias.map((dia, index) => (
            <DiaEntrenamiento
              key={index}
              dia={dia}
              index={index}
              ejerciciosData={ejerciciosData}
            />
          ))}
        </View>

        {/* Si la rutina es pública, mostramos el botón para asignarla */}
        {rutina.publica ? (
          <View style={styles.assignContainer}>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={handleAsignarRutina}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="white"
              />
              <Text style={styles.assignButtonText}>Añadir a mis rutinas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Historial de entrenamientos */}
            <View style={styles.historialContainer}>
              <View style={styles.historialHeader}>
                <View style={styles.historialTitleRow}>
                  <Text style={styles.sectionTitle}>
                    Historial de Entrenamientos
                  </Text>
                  {historialEntrenamientos.length > 0 && (
                    <View style={styles.historialBadge}>
                      <Text style={styles.historialBadgeText}>
                        {historialEntrenamientos.length}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.historialContent}>
                {loadingHistorial ? (
                  <ActivityIndicator size="small" color="#6200EE" />
                ) : historialEntrenamientos.length === 0 ? (
                  <Text style={styles.noHistorialText}>
                    Aún no has completado ningún entrenamiento de esta rutina
                  </Text>
                ) : (
                  historialEntrenamientos
                    .slice(0, 5)
                    .map((entrenamiento, index) => {
                      const promedios = calcularPromedios(entrenamiento);

                      return (
                        <TouchableOpacity key={index} style={styles.entrenamientoItem} onPress={() => {
                          setEntrenamientoSeleccionado(entrenamiento);
                          setModalVisible(true);
                        }}>
                          <View style={styles.entrenamientoInfo}>
                            <Text style={styles.entrenamientoDia}>
                              {rutina.dias[entrenamiento.diaEntrenamiento]
                                ?.nombre ||
                                `Día ${entrenamiento.diaEntrenamiento + 1}`}
                            </Text>
                            <Text style={styles.entrenamientoFecha}>
                              {formatearFecha(entrenamiento.fechaInicio)}
                            </Text>
                          </View>

                          <View style={styles.entrenamientoStats}>
                            <View style={styles.statItem}>
                              <Ionicons
                                name="time-outline"
                                size={16}
                                color="#666"
                              />
                              <Text style={styles.statText}>
                                {formatearDuracion(entrenamiento.duracion)}
                              </Text>
                            </View>
                            <View style={styles.statItem}>
                              <Ionicons
                                name="fitness-outline"
                                size={16}
                                color="#666"
                              />
                              <Text style={styles.statText}>
                                {entrenamiento.ejercicios.length} ejercicios
                              </Text>
                            </View>
                          </View>

                          {/* Mostrar valoraciones promedio */}
                          {promedios.satisfaccion > 0 && (
                            <View style={styles.valoracionesContainer}>
                              <View style={styles.valoracionItem}>
                                <Text style={styles.valoracionMiniLabel}>
                                  Satisfacción
                                </Text>
                                <Text style={styles.valoracionEmoji}>
                                  {getEmojiSatisfaccion(promedios.satisfaccion)}
                                </Text>
                              </View>

                              <View style={styles.valoracionItem}>
                                <Text style={styles.valoracionMiniLabel}>
                                  Esfuerzo
                                </Text>
                                <Text style={styles.valoracionEmoji}>
                                  {getEmojiEsfuerzo(promedios.esfuerzo)}
                                </Text>
                              </View>

                              <View style={styles.valoracionItem}>
                                <Text style={styles.valoracionMiniLabel}>
                                  Dificultad
                                </Text>
                                <View
                                  style={[
                                    styles.dificultadChip,
                                    {
                                      backgroundColor: getColorDificultad(
                                        promedios.dificultad
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={styles.dificultadChipText}>
                                    {getTextoDificultad(promedios.dificultad)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                )}

                {historialEntrenamientos.length > 5 && (
                  <TouchableOpacity
                    style={styles.verMasButton}
                    onPress={() =>
                      navigation.navigate("HistorialCompleto", {
                        entrenamientos: historialEntrenamientos,
                        rutina: rutina,
                      })
                    }
                  >
                    <Text style={styles.verMasText}>
                      Ver historial completo
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="#6200EE" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {!rutina.publica && (
        <View style={styles.footer}>
          {!esRutinaActiva ? (
            <TouchableOpacity
              style={styles.setActiveMainButton}
              onPress={handleSetComoActiva}
            >
              <Ionicons name="star" size={20} color="#FFC107" />
              <Text style={styles.setActiveMainButtonText}>
                Establecer como rutina activa
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.startButton} onPress={startRutina}>
              <Ionicons name="play" size={20} color="white" />
              <Text style={styles.startButtonText}>Comenzar Rutina</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <DetalleEntrenamientoModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEntrenamientoSeleccionado(null);
        }}
        entrenamiento={entrenamientoSeleccionado}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  backIcon: {
    padding: 5,
  },
  headerActions: {
    flexDirection: "row",
  },
  actionIcon: {
    padding: 5,
    marginLeft: 15,
  },
  rutinaHeader: {
    padding: 15,
  },
  rutinaTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 10,
  },
  nivelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  nivelLabel: {
    fontSize: 16,
    color: "#616161",
    marginRight: 5,
  },
  star: {
    marginRight: 2,
  },
  publicBadge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  publicText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  descripcion: {
    fontSize: 16,
    color: "#424242",
    marginBottom: 15,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#616161",
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 15,
    marginVertical: 10,
  },
  diasContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
  },
  footer: {
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  startButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    color: "#6200EE",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  assignContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  assignButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignButtonText: {
    color: "white",
    marginLeft: 10,
    fontWeight: "bold",
  },
  historialContainer: {
    margin: 15,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F8F9FF",
  },
  historialTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historialBadge: {
    backgroundColor: "#6200EE",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  historialBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  historialContent: {
    padding: 15,
  },
  noHistorialText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginVertical: 20,
  },
  entrenamientoItem: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  entrenamientoInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entrenamientoDia: {
    fontSize: 16,
    color: "#212121",
  },
  entrenamientoFecha: {
    fontSize: 14,
    color: "#666",
  },
  entrenamientoStats: {
    flexDirection: "row",
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#666",
  },
  valoracionPromedio: {
    flexDirection: "row",
    marginTop: 8,
    gap: 2,
  },
  verMasButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 8,
    gap: 5,
  },
  verMasText: {
    color: "#6200EE",
    fontWeight: "600",
    fontSize: 14,
  },
  valoracionesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  valoracionItem: {
    alignItems: "center",
    flex: 1,
  },
  valoracionMiniLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  valoracionEmoji: {
    fontSize: 20,
  },
  dificultadChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  dificultadChipText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  setActiveMainButton: {
    backgroundColor: "#FFF8E1",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  setActiveMainButtonText: {
    color: "#F57C00",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
