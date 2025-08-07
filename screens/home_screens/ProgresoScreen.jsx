import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchProgresoEjercicios,
  fetchProgresoRutina,
  fetchEstadisticasMusculos,
} from "../../services/progresoPeticiones";
import {
  fetchEstadisticasUsuario,
  fetchRutinasEntrenadas,
  getColorDificultad,
  getTextoDificultad,
  getEmojiSatisfaccion,
  getEmojiEsfuerzo,
} from "../../services/entrenamientoPeticiones";
import { fetchRutinaActiva } from "../../services/usuarioPeticiones";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function ProgresoScreen() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [progresoEjercicios, setProgresoEjercicios] = useState([]);
  const [progresoRutina, setProgresoRutina] = useState(null);
  const [estadisticasMusculos, setEstadisticasMusculos] = useState([]);
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("mes");
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState(null);
  const [rutinasEntrenadas, setRutinasEntrenadas] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [todosLosEjercicios, setTodosLosEjercicios] = useState([]);
  const [modalEjerciciosVisible, setModalEjerciciosVisible] = useState(false);
  const [busquedaEjercicio, setBusquedaEjercicio] = useState("");
  const [ejerciciosFiltrados, setEjerciciosFiltrados] = useState([]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#6200EE");

      return () => {
        StatusBar.setBarStyle("dark-content");
        StatusBar.setBackgroundColor("#F5F5F5");
      };
    }, [])
  );

  const cargarDatos = async () => {
    if (!user?.uid) return;

    try {
      // Cargar estadísticas generales
      const statsResult = await fetchEstadisticasUsuario(
        user.uid,
        periodoSeleccionado
      );
      if (statsResult.success) {
        setEstadisticas(statsResult.estadisticas);
      }

      const rutinasResponse = await fetchRutinasEntrenadas(user.uid);
      if (rutinasResponse.success) {
        setRutinasEntrenadas(rutinasResponse.rutinas);
        // Seleccionar la primera rutina por defecto
        if (rutinasResponse.rutinas.length > 0 && !rutinaSeleccionada) {
          const primeraRutina = rutinasResponse.rutinas[0];
          setRutinaSeleccionada(primeraRutina);

          const progresoRutinaResult = await fetchProgresoRutina(
            user.uid,
            primeraRutina._id
          );
          if (progresoRutinaResult.success) {
            setProgresoRutina(progresoRutinaResult.progreso);
          }
        }
      }

      // Cargar progreso de ejercicios
      const progresoResult = await fetchProgresoEjercicios(user.uid, 50); // Cargar todos los ejercicios
      if (progresoResult.success) {
        console.log("Ejercicios cargados:", progresoResult.ejercicios.length);
        setTodosLosEjercicios(progresoResult.ejercicios); // Guardar todos
        setEjerciciosFiltrados(progresoResult.ejercicios); // Inicializar filtrados
        setProgresoEjercicios(progresoResult.ejercicios.slice(0, 5)); // Mostrar top 5
        if (progresoResult.ejercicios.length > 0) {
          setEjercicioSeleccionado(progresoResult.ejercicios[0]);
        }
      }

      // Cargar rutina activa y su progreso
      const rutinaResult = await fetchRutinaActiva(user.uid);
      if (rutinaResult.success && rutinaResult.rutinaActiva) {
        setRutinaActiva(rutinaResult.rutinaActiva);
      }

      // Cargar estadísticas por músculo
      const musculosResult = await fetchEstadisticasMusculos(user.uid);
      if (musculosResult.success) {
        setEstadisticasMusculos(musculosResult.musculos);
      }
    } catch (error) {
      console.error("Error al cargar datos de progreso:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [user, periodoSeleccionado]);

  useEffect(() => {
    if (busquedaEjercicio.trim() === "") {
      setEjerciciosFiltrados(todosLosEjercicios);
    } else {
      const filtrados = todosLosEjercicios.filter((ejercicio) =>
        ejercicio.nombre.toLowerCase().includes(busquedaEjercicio.toLowerCase())
      );
      setEjerciciosFiltrados(filtrados);
    }
  }, [busquedaEjercicio, todosLosEjercicios]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDatos();
  }, [periodoSeleccionado]);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#6200EE",
    },
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={["#6200EE", "#3700B3"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mi Progreso</Text>
            <Text style={styles.headerSubtitle}>
              Visualiza tu evolución y mejora continua
            </Text>
          </View>
        </LinearGradient>

        {/* Estadísticas Generales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.periodSelectorScroll}
            >
              <View style={styles.periodSelector}>
                {["semana", "mes", "año"].map((periodo) => (
                  <TouchableOpacity
                    key={periodo}
                    style={[
                      styles.periodButton,
                      periodoSeleccionado === periodo &&
                        styles.periodButtonActive,
                    ]}
                    onPress={() => setPeriodoSeleccionado(periodo)}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        periodoSeleccionado === periodo &&
                          styles.periodButtonTextActive,
                      ]}
                    >
                      {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#E3F2FD" },
                ]}
              >
                <Ionicons name="fitness" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>
                {estadisticas?.totalEntrenamientos || 0}
              </Text>
              <Text style={styles.statLabel}>Entrenamientos</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#FFF3E0" },
                ]}
              >
                <Ionicons name="time" size={24} color="#FF9800" />
              </View>
              <Text style={styles.statValue}>
                {Math.floor((estadisticas?.tiempoTotal || 0) / 60)}h
              </Text>
              <Text style={styles.statLabel}>Tiempo Total</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#E8F5E9" },
                ]}
              >
                <Ionicons name="trending-up" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>
                {estadisticas?.ejerciciosCompletados || 0}
              </Text>
              <Text style={styles.statLabel}>Ejercicios</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: "#F3E5F5" },
                ]}
              >
                <Ionicons name="star" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.statValue}>
                {getEmojiSatisfaccion(
                  estadisticas?.promedioSatisfaccion || "-1"
                ) || "-"}
              </Text>
              <Text style={styles.statLabel}>Satisfacción</Text>
            </View>
          </View>
        </View>

        {/* Progreso de Ejercicios */}
        {progresoEjercicios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolución en Ejercicios</Text>

            {/* Ejercicio seleccionado y botón de búsqueda */}
            <TouchableOpacity
              style={styles.ejercicioSeleccionadoContainer}
              onPress={() => setModalEjerciciosVisible(true)}
            >
              <View style={styles.ejercicioSeleccionadoInfo}>
                <Text style={styles.ejercicioSeleccionadoLabel}>
                  Ejercicio actual:
                </Text>
                <Text style={styles.ejercicioSeleccionadoNombre}>
                  {ejercicioSeleccionado?.nombre || "Seleccionar ejercicio"}
                </Text>
                {ejercicioSeleccionado && (
                  <View style={styles.ejercicioSeleccionadoStats}>
                    <View
                      style={[
                        styles.tendenciaIndicatorCompact,
                        ejercicioSeleccionado.tendencia === "mejora" &&
                          styles.tendenciaMejora,
                        ejercicioSeleccionado.tendencia === "baja" &&
                          styles.tendenciaBaja,
                      ]}
                    >
                      <Ionicons
                        name={
                          ejercicioSeleccionado.tendencia === "mejora"
                            ? "trending-up"
                            : ejercicioSeleccionado.tendencia === "baja"
                            ? "trending-down"
                            : "remove"
                        }
                        size={14}
                        color="white"
                      />
                      <Text style={styles.tendenciaTextCompact}>
                        {ejercicioSeleccionado.progresoPorcentaje}%
                      </Text>
                    </View>
                    <Text style={styles.ejercicioHistoricoText}>
                      • {ejercicioSeleccionado.historico.length} entrenamientos
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.cambiarEjercicioButton}>
                <Ionicons name="search" size={20} color="#6200EE" />
                <Text style={styles.cambiarEjercicioText}>Cambiar</Text>
              </View>
            </TouchableOpacity>

            {/* Gráfica del ejercicio seleccionado */}
            {ejercicioSeleccionado &&
              ejercicioSeleccionado.historico.length > 1 && (
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Evolución Peso (kg)</Text>
                  <LineChart
                    data={{
                      labels: ejercicioSeleccionado.historico
                        .slice(-6)
                        .map((h) => formatearFecha(h.fecha)),
                      datasets: [
                        {
                          data: ejercicioSeleccionado.historico
                            .slice(-6)
                            .map((h) => h.pesoMaximo),
                        },
                      ],
                    }}
                    width={width - 40}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                </View>
              )}

            {/* Resumen de top ejercicios */}
            <View style={styles.topEjerciciosContainer}>
              <Text style={styles.topEjerciciosTitle}>
                Top 5 ejercicios con más progreso
              </Text>
              <View style={styles.topEjerciciosList}>
                {progresoEjercicios.slice(0, 5).map((ejercicio, index) => (
                  <TouchableOpacity
                    key={ejercicio.ejercicioId}
                    style={styles.topEjercicioItem}
                    onPress={() => setEjercicioSeleccionado(ejercicio)}
                  >
                    <View style={styles.topEjercicioRank}>
                      <Text style={styles.topEjercicioRankText}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.topEjercicioNombre} numberOfLines={1}>
                      {ejercicio.nombre}
                    </Text>
                    <View
                      style={[
                        styles.topEjercicioProgress,
                        ejercicio.tendencia === "mejora" &&
                          styles.progressPositive,
                        ejercicio.tendencia === "baja" &&
                          styles.progressNegative,
                      ]}
                    >
                      <Ionicons
                        name={
                          ejercicio.tendencia === "mejora"
                            ? "arrow-up"
                            : ejercicio.tendencia === "baja"
                            ? "arrow-down"
                            : "remove"
                        }
                        size={12}
                        color="white"
                      />
                      <Text style={styles.topEjercicioProgressText}>
                        {ejercicio.progresoPorcentaje}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Progreso por Rutina - Unificado con selector */}
        {rutinasEntrenadas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progreso por Rutina</Text>

            {/* Selector de rutinas integrado */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rutinaSelectorIntegrado}
            >
              {rutinasEntrenadas.map((rutina) => (
                <TouchableOpacity
                  key={rutina._id}
                  style={[
                    styles.rutinaChip,
                    rutinaSeleccionada?._id === rutina._id &&
                      styles.rutinaChipActive,
                  ]}
                  onPress={async () => {
                    setRutinaSeleccionada(rutina);
                    const progresoResult = await fetchProgresoRutina(
                      user.uid,
                      rutina._id
                    );
                    if (progresoResult.success) {
                      setProgresoRutina(progresoResult.progreso);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.rutinaChipText,
                      rutinaSeleccionada?._id === rutina._id &&
                        styles.rutinaChipTextActive,
                    ]}
                  >
                    {rutina.nombreRutina}
                  </Text>
                  <View
                    style={[
                      styles.rutinaChipBadge,
                      rutinaSeleccionada?._id === rutina._id &&
                        styles.rutinaChipBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rutinaChipBadgeText,
                        rutinaSeleccionada?._id === rutina._id &&
                          styles.rutinaChipBadgeTextActive,
                      ]}
                    >
                      {rutina.totalEntrenamientos}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Mostrar progreso de la rutina seleccionada */}
            {progresoRutina && rutinaSeleccionada && (
              <View style={styles.rutinaProgresoContent}>
                <View style={styles.rutinaStatCard}>
                  <Text style={styles.rutinaStatValue}>
                    {progresoRutina.totalEntrenamientos}
                  </Text>
                  <Text style={styles.rutinaStatLabel}>
                    Sesiones completadas
                  </Text>
                </View>

                <View style={styles.diasContainer}>
                  {Object.entries(progresoRutina.progresoPorDia).map(
                    ([diaIndex, stats]) => (
                      <View key={diaIndex}>
                        {stats.entrenamientos > 0 && (
                          <View style={styles.diaHeader}>
                            <View style={styles.diaInfo}>
                              <Text style={styles.diaNombre}>
                                {stats.nombreDia ||
                                  `Día ${parseInt(diaIndex) + 1}`}
                              </Text>
                              <View style={styles.diaEstadisticas}>
                                <View style={styles.diaStatChip}>
                                  <Ionicons
                                    name="refresh"
                                    size={14}
                                    color="#6200EE"
                                  />
                                  <Text style={styles.diaStatText}>
                                    {stats.entrenamientos} veces
                                  </Text>
                                </View>
                                <View style={styles.diaStatChip}>
                                  <Ionicons
                                    name="time-outline"
                                    size={14}
                                    color="#FF9800"
                                  />
                                  <Text style={styles.diaStatText}>
                                    ~{Math.floor(stats.duracionPromedio / 60)}
                                    min
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Valoraciones promedio */}
                            <View style={styles.diaValoraciones}>
                              <View style={styles.valoracionItem}>
                                <Text style={styles.valoracionMiniLabel}>
                                  Satisfacción
                                </Text>
                                <Text style={styles.valoracionEmoji}>
                                  {getEmojiSatisfaccion(
                                    parseFloat(stats.satisfaccionPromedio || 0)
                                  )}
                                </Text>
                              </View>
                              <View style={styles.valoracionItem}>
                                <Text style={styles.valoracionMiniLabel}>
                                  Esfuerzo
                                </Text>
                                <Text style={styles.valoracionEmoji}>
                                  {getEmojiEsfuerzo(
                                    parseFloat(stats.esfuerzoPromedio || 0)
                                  )}
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
                                        parseFloat(
                                          stats.dificultadPromedio || 0
                                        )
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={styles.dificultadText}>
                                    {getTextoDificultad(
                                      parseFloat(stats.dificultadPromedio || 0)
                                    )}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Estadísticas por Grupo Muscular */}
        {estadisticasMusculos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Grupos Musculares Más Trabajados
            </Text>
            <Text style={styles.sectionSubtitle}>
              Ordenados por frecuencia de entrenamiento
            </Text>

            <View style={styles.musculosContainer}>
              {estadisticasMusculos.map((musculo, index) => {
                // Calcular el ranking real considerando empates
                let ranking = 1;
                for (let i = 0; i < index; i++) {
                  if (
                    estadisticasMusculos[i].totalEjercicios >
                    musculo.totalEjercicios
                  ) {
                    ranking++;
                  }
                }

                return (
                  <View key={musculo.nombre} style={styles.musculoCard}>
                    <View style={styles.musculoHeader}>
                      <Text style={styles.musculoNombre}>
                        {musculo.nombre.charAt(0).toUpperCase() +
                          musculo.nombre.slice(1)}
                      </Text>
                      <View style={styles.musculoRanking}>
                        <Text style={styles.musculoRankingText}>
                          TOP {ranking}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.musculoStats}>
                      <View style={styles.musculoStat}>
                        <Ionicons
                          name="fitness-outline"
                          size={20}
                          color="#6200EE"
                        />
                        <Text style={styles.musculoStatValue}>
                          {musculo.totalEjercicios}
                        </Text>
                        <Text style={styles.musculoStatLabel}>
                          Veces entrenado
                        </Text>
                      </View>
                      <View style={styles.musculoStat}>
                        <Ionicons
                          name="layers-outline"
                          size={20}
                          color="#FF9800"
                        />
                        <Text style={styles.musculoStatValue}>
                          {musculo.totalSeries}
                        </Text>
                        <Text style={styles.musculoStatLabel}>
                          Series totales
                        </Text>
                      </View>
                      <View style={styles.musculoStat}>
                        <Ionicons
                          name="barbell-outline"
                          size={20}
                          color="#4CAF50"
                        />
                        <Text style={styles.musculoStatValue}>
                          {musculo.pesoMaximo}kg
                        </Text>
                        <Text style={styles.musculoStatLabel}>Récord peso</Text>
                      </View>
                    </View>

                    <View style={styles.musculoProgressBar}>
                      <View
                        style={[
                          styles.musculoProgressFill,
                          {
                            width: `${
                              (musculo.totalEjercicios /
                                estadisticasMusculos[0].totalEjercicios) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de selección de ejercicios */}
      <Modal
        visible={modalEjerciciosVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalEjerciciosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalEjerciciosVisible(false);
                  setBusquedaEjercicio("");
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ejercicio..."
                value={busquedaEjercicio}
                onChangeText={setBusquedaEjercicio}
                placeholderTextColor="#999"
              />
              {busquedaEjercicio.length > 0 && (
                <TouchableOpacity onPress={() => setBusquedaEjercicio("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de ejercicios */}
            <ScrollView style={styles.modalList}>
              {ejerciciosFiltrados.length > 0 ? (
                ejerciciosFiltrados.map((ejercicio) => (
                  <TouchableOpacity
                    key={ejercicio.ejercicioId}
                    style={styles.modalEjercicioItem}
                    onPress={() => {
                      setEjercicioSeleccionado(ejercicio);
                      setModalEjerciciosVisible(false);
                      setBusquedaEjercicio("");
                    }}
                  >
                    <View style={styles.modalEjercicioInfo}>
                      <Text style={styles.modalEjercicioNombre}>
                        {ejercicio.nombre}
                      </Text>
                      <Text style={styles.modalEjercicioStats}>
                        {ejercicio.historico.length} entrenamientos
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.modalTendenciaIndicator,
                        ejercicio.tendencia === "mejora" &&
                          styles.tendenciaMejora,
                        ejercicio.tendencia === "baja" && styles.tendenciaBaja,
                      ]}
                    >
                      <Ionicons
                        name={
                          ejercicio.tendencia === "mejora"
                            ? "trending-up"
                            : ejercicio.tendencia === "baja"
                            ? "trending-down"
                            : "remove"
                        }
                        size={14}
                        color="white"
                      />
                      <Text style={styles.modalTendenciaText}>
                        {ejercicio.progresoPorcentaje}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>
                  No se encontraron ejercicios
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  periodButtonActive: {
    backgroundColor: "#6200EE",
  },
  periodButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  periodButtonTextActive: {
    color: "white",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  ejercicioSelector: {
    marginBottom: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  ejercicioChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ejercicioChipActive: {
    backgroundColor: "#6200EE",
  },
  ejercicioChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  ejercicioChipTextActive: {
    color: "white",
  },
  tendenciaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#9E9E9E",
    gap: 4,
  },
  tendenciaMejora: {
    backgroundColor: "#4CAF50",
  },
  tendenciaBaja: {
    backgroundColor: "#F44336",
  },
  tendenciaText: {
    fontSize: 11,
    color: "white",
    fontWeight: "bold",
  },
  chartContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  rutinaStatsContainer: {
    gap: 12,
  },
  rutinaStatCard: {
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  rutinaStatValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 4,
  },
  rutinaStatLabel: {
    fontSize: 14,
    color: "#666",
  },
  diaProgresoCard: {
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
  },
  diaProgresoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  diaProgresoStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  diaProgresoStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  diaProgresoStatText: {
    fontSize: 12,
    color: "#666",
  },
  musculosContainer: {
    gap: 12,
  },
  musculoCard: {
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
  },
  musculoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  musculoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  musculoRanking: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  musculoRankingText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  musculoStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  musculoStat: {
    alignItems: "center",
  },
  musculoStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  musculoStatLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  musculoProgressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  musculoProgressFill: {
    height: "100%",
    backgroundColor: "#6200EE",
    borderRadius: 3,
  },
  rutinaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  rutinaChipActive: {
    backgroundColor: "#6200EE",
  },
  rutinaChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  rutinaChipTextActive: {
    color: "white",
  },
  rutinaChipBadge: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rutinaChipBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "column",
    marginBottom: 16,
  },
  periodSelectorScroll: {
    marginTop: 10,
  },
  periodSelector: {
    flexDirection: "row",
    gap: 8,
  },
  sectionHeaderWithButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verMasButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verMasButtonText: {
    fontSize: 12,
    color: "#6200EE",
    fontWeight: "600",
  },
  ejercicioChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 200,
  },
  valoracionesContainer: {
    marginTop: 16,
    gap: 8,
  },
  valoracionItem: {
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 12,
  },
  valoracionFecha: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  valoracionEmojis: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  emojiContainer: {
    alignItems: "center",
  },
  emoji: {
    fontSize: 24,
  },
  emojiLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  rutinaSelectorIntegrado: {
    marginBottom: 16,
  },
  rutinaProgresoContent: {
    gap: 12,
    marginTop: 8,
  },
  rutinaChipBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  rutinaChipBadgeTextActive: {
    color: "white",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: -12,
    marginBottom: 16,
  },
  musculoStat: {
    alignItems: "center",
    flex: 1,
  },
  diasContainer: {
    gap: 12,
    marginTop: 12,
  },
  diaHeader: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#6200EE",
  },
  diaInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  diaNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  diaEstadisticas: {
    flexDirection: "row",
    gap: 8,
  },
  diaStatChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  diaStatText: {
    fontSize: 11,
    color: "#666",
  },
  diaValoracion: {
    alignItems: "center",
    backgroundColor: "white",
    padding: 8,
    borderRadius: 12,
  },
  valoracionEmoji: {
    fontSize: 24,
  },
  valoracionLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  ejerciciosList: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ejerciciosListTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  ejercicioMiniCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  ejercicioMiniNombre: {
    fontSize: 12,
    color: "#212121",
    flex: 1,
  },
  ejercicioMiniInfo: {
    fontSize: 11,
    color: "#6200EE",
    fontWeight: "600",
  },
  ejerciciosMore: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
  },
  modalList: {
    maxHeight: 400,
  },
  modalEjercicioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalEjercicioInfo: {
    flex: 1,
  },
  modalEjercicioNombre: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 4,
  },
  modalEjercicioStats: {
    fontSize: 12,
    color: "#666",
  },
  modalTendenciaIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#9E9E9E",
    gap: 4,
  },
  modalTendenciaText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  diaValoraciones: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  valoracionItem: {
    alignItems: "center",
  },
  valoracionMiniLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  dificultadChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dificultadText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  ejercicioSeleccionadoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ejercicioSeleccionadoInfo: {
    flex: 1,
  },
  ejercicioSeleccionadoLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ejercicioSeleccionadoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 6,
  },
  ejercicioSeleccionadoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tendenciaIndicatorCompact: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#9E9E9E",
    gap: 4,
  },
  tendenciaTextCompact: {
    fontSize: 11,
    color: "white",
    fontWeight: "bold",
  },
  ejercicioHistoricoText: {
    fontSize: 12,
    color: "#666",
  },
  cambiarEjercicioButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#6200EE",
  },
  cambiarEjercicioText: {
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
  },
  valoracionesRecientes: {
    marginTop: 20,
  },
  valoracionesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  valoracionesScroll: {
    marginHorizontal: -8,
  },
  valoracionCard: {
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    minWidth: 100,
  },
  valoracionCardFecha: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  valoracionCardEmojis: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  emojiItem: {
    alignItems: "center",
  },
  emojiSmall: {
    fontSize: 20,
  },
  emojiLabelSmall: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  topEjerciciosContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  topEjerciciosTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  topEjerciciosList: {
    gap: 8,
  },
  topEjercicioItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 10,
    borderRadius: 8,
  },
  topEjercicioRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  topEjercicioRankText: {
    fontSize: 12,
    color: "white",
    fontWeight: "bold",
  },
  topEjercicioNombre: {
    flex: 1,
    fontSize: 14,
    color: "#212121",
  },
  topEjercicioProgress: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#9E9E9E",
    gap: 2,
  },
  progressPositive: {
    backgroundColor: "#4CAF50",
  },
  progressNegative: {
    backgroundColor: "#F44336",
  },
  topEjercicioProgressText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
});
