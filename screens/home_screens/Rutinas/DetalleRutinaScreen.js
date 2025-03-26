import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Platform } from "react-native";

const API_URL_ANDROID = "http://10.0.2.2:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export default function DetalleRutinaScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [rutina, setRutina] = useState(route.params?.rutina || null);
  const [loading, setLoading] = useState(true);
  const [ejerciciosData, setEjerciciosData] = useState({});
  const [expandedDia, setExpandedDia] = useState(null);

  useEffect(() => {
    if (rutina) {
      fetchEjerciciosDetails();
    } else {
      setLoading(false);
    }
  }, [rutina]);

  const fetchEjerciciosDetails = async () => {
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

      console.log("📌 Solicitando ejercicios con IDs:", uniqueIds);

      // Construir la URL con los IDs como query params
      const queryParams = uniqueIds.join(",");
      const response = await axios.get(
        `${API_URL}/ejercicios/porIds?ids=${queryParams}`
      );

      console.log("✅ Respuesta de API ejercicios:", response.data);

      // Crear un mapeo de ID a objeto ejercicio
      const ejerciciosMap = {};
      response.data.forEach((ejercicio) => {
        ejerciciosMap[ejercicio.id] = ejercicio;
      });

      setEjerciciosData(ejerciciosMap);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error al obtener detalles de ejercicios:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los detalles de los ejercicios"
      );
      setLoading(false);
    }
  };

  const toggleDia = (index) => {
    setExpandedDia(expandedDia === index ? null : index);
  };

  const getEjercicioNombre = (ejercicioId) => {
    if (ejerciciosData[ejercicioId]) {
      return ejerciciosData[ejercicioId].nombre;
    }
    return "Cargando...";
  };

  const renderNivelEstrellas = (nivel) => {
    const nivelNumerico =
      typeof nivel === "string"
        ? parseInt(nivel.replace(/\D/g, "")) || 3 // Extraer número o default a 3
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

  const deleteRutina = async () => {
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
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#6200EE" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
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
                  onPress={deleteRutina}
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
            <View key={index} style={styles.diaCard}>
              <TouchableOpacity
                style={styles.diaHeader}
                onPress={() => toggleDia(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.diaTitle}>{dia.nombre}</Text>
                <Ionicons
                  name={expandedDia === index ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="#6200EE"
                />
              </TouchableOpacity>

              {expandedDia === index && (
                <View style={styles.ejerciciosList}>
                  {dia.ejercicios.map((ejercicio, ejIndex) => (
                    <View key={ejIndex} style={styles.ejercicioItem}>
                      <View style={styles.ejercicioRow}>
                        {ejerciciosData[ejercicio.ejercicio]?.imagenes?.[0] ? (
                          <Image
                            source={{
                              uri: ejerciciosData[ejercicio.ejercicio]
                                .imagenes[0],
                            }}
                            style={styles.exerciseImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.noImagePlaceholder}>
                            <Ionicons
                              name="barbell-outline"
                              size={24}
                              color="#BDBDBD"
                            />
                          </View>
                        )}
                        <View style={styles.ejercicioContent}>
                          <Text style={styles.ejercicioNombre}>
                            {getEjercicioNombre(ejercicio.ejercicio)}
                          </Text>
                          <View style={styles.ejercicioDetalles}>
                            <View style={styles.detalleItem}>
                              <Ionicons
                                name="repeat-outline"
                                size={16}
                                color="#6200EE"
                              />
                              <Text style={styles.detalleText}>
                                {ejercicio.series} x {ejercicio.repeticiones}
                              </Text>
                            </View>

                            {ejercicio.descanso && (
                              <View style={styles.detalleItem}>
                                <Ionicons
                                  name="time-outline"
                                  size={16}
                                  color="#6200EE"
                                />
                                <Text style={styles.detalleText}>
                                  {ejercicio.descanso}s descanso
                                </Text>
                              </View>
                            )}

                            {ejercicio.peso && (
                              <View style={styles.detalleItem}>
                                <Ionicons
                                  name="barbell-outline"
                                  size={16}
                                  color="#6200EE"
                                />
                                <Text style={styles.detalleText}>
                                  {ejercicio.peso} kg
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={startRutina}>
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.startButtonText}>Comenzar Rutina</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 15,
  },
  diaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  diaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F9F5FF",
  },
  diaTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  ejerciciosList: {
    padding: 15,
  },
  ejercicioItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ejercicioNombre: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  ejercicioDetalles: {
    marginLeft: 10,
  },
  detalleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detalleText: {
    fontSize: 14,
    color: "#616161",
    marginLeft: 8,
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
  emptyDia: {
    padding: 20,
    alignItems: "center",
  },
  emptyDiaText: {
    fontSize: 14,
    color: "#757575",
    fontStyle: "italic",
  },
  lastEjercicio: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  noImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  ejercicioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ejercicioContent: {
    flex: 1,
  },
  shareButton: {
    backgroundColor: "#03A9F4",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  shareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfButton: {
    flex: 0.48,
  },
});
