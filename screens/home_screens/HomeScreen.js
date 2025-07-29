import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { fetchRutinaActiva, fetchUsuarioByUid } from "../../services/usuarioPeticiones";
import { fetchEntrenamientosUsuario } from "../../services/entrenamientoPeticiones";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [entrenamientosRecientes, setEntrenamientosRecientes] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    entrenamientosTotal: 0,
    tiempoTotal: 0,
    rachaDias: 0,
    entrenamientosSemana: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar datos del usuario
      const userResult = await fetchUsuarioByUid(user.uid);
      if (userResult) {
        setUserData(userResult);
      }

      // Cargar rutina activa
      const rutinaResult = await fetchRutinaActiva(user.uid);
      console.log(rutinaResult)
      if (rutinaResult.success) {
        setRutinaActiva(rutinaResult.rutinaActiva);
        setProgreso(rutinaResult.progreso);
      }

      // Cargar entrenamientos recientes
      const entrenamientosResult = await fetchEntrenamientosUsuario(user.uid, 10);
      if (entrenamientosResult.success) {
        setEntrenamientosRecientes(entrenamientosResult.entrenamientos);
        calcularEstadisticas(entrenamientosResult.entrenamientos);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const calcularEstadisticas = (entrenamientos) => {
    if (!entrenamientos || entrenamientos.length === 0) return;

    // Total de entrenamientos
    const total = entrenamientos.length;

    // Tiempo total
    const tiempoTotal = entrenamientos.reduce((sum, e) => sum + (e.duracion || 0), 0);

    // Entrenamientos esta semana
    const haceUnaSemana = new Date();
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
    const entrenamientosSemana = entrenamientos.filter(
      e => new Date(e.fechaInicio) >= haceUnaSemana
    ).length;

    // Calcular racha (días consecutivos)
    let rachaDias = 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const entrenamientosPorDia = {};
    entrenamientos.forEach(e => {
      const fecha = new Date(e.fechaInicio);
      fecha.setHours(0, 0, 0, 0);
      entrenamientosPorDia[fecha.toDateString()] = true;
    });

    let diaActual = new Date(hoy);
    while (entrenamientosPorDia[diaActual.toDateString()]) {
      rachaDias++;
      diaActual.setDate(diaActual.getDate() - 1);
    }

    setEstadisticas({
      entrenamientosTotal: total,
      tiempoTotal,
      rachaDias,
      entrenamientosSemana,
    });
  };

  const formatearTiempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    if (date.toDateString() === hoy.toDateString()) {
      return "Hoy";
    } else if (date.toDateString() === ayer.toDateString()) {
      return "Ayer";
    } else {
      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const iniciarEntrenamientoRapido = () => {
    if (rutinaActiva) {
      navigation.navigate("EjecutarRutina", { rutina: rutinaActiva });
    } else {
      navigation.navigate("Rutinas");
    }
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
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={["#6200EE", "#3700B3"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.saludo}>{getSaludo()},</Text>
              <Text style={styles.nombreUsuario}>{userData?.nombre || "Usuario"}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate("Perfil")}
            >
              <Ionicons name="person-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de rutina activa */}
          {rutinaActiva ? (
            <TouchableOpacity
              style={styles.rutinaActivaCard}
              onPress={iniciarEntrenamientoRapido}
              activeOpacity={0.9}
            >
              <View style={styles.rutinaActivaHeader}>
                <Text style={styles.rutinaActivaLabel}>RUTINA ACTIVA</Text>
                <View style={styles.diaIndicator}>
                  <Text style={styles.diaText}>
                    Día {(progreso?.diaActual || 0) + 1}/{rutinaActiva.dias.length}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.rutinaActivaNombre}>{rutinaActiva.nombre}</Text>
              
              <View style={styles.rutinaActivaFooter}>
                <View style={styles.rutinaInfo}>
                  <Ionicons name="fitness" size={16} color="#6200EE" />
                  <Text style={styles.rutinaInfoText}>
                    {rutinaActiva.dias[progreso?.diaActual || 0]?.ejercicios.length} ejercicios
                  </Text>
                </View>
                
                <View style={styles.iniciarButton}>
                  <Text style={styles.iniciarButtonText}>Iniciar</Text>
                  <Ionicons name="play-circle" size={24} color="#6200EE" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.noRutinaCard}
              onPress={() => navigation.navigate("Rutinas")}
            >
              <Ionicons name="add-circle-outline" size={48} color="white" />
              <Text style={styles.noRutinaText}>
                No tienes una rutina activa
              </Text>
              <Text style={styles.noRutinaSubtext}>
                Toca para seleccionar una
              </Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* Estadísticas */}
        <View style={styles.estadisticasContainer}>
          <Text style={styles.sectionTitle}>Tu Progreso</Text>
          
          <View style={styles.estadisticasGrid}>
            <View style={styles.estatCard}>
              <View style={[styles.estatIconContainer, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="flame" size={24} color="#2196F3" />
              </View>
              <Text style={styles.estatValor}>{estadisticas.rachaDias}</Text>
              <Text style={styles.estatLabel}>Días de racha</Text>
            </View>

            <View style={styles.estatCard}>
              <View style={[styles.estatIconContainer, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.estatValor}>{estadisticas.entrenamientosSemana}</Text>
              <Text style={styles.estatLabel}>Esta semana</Text>
            </View>

            <View style={styles.estatCard}>
              <View style={[styles.estatIconContainer, { backgroundColor: "#FFF3E0" }]}>
                <Ionicons name="time" size={24} color="#FF9800" />
              </View>
              <Text style={styles.estatValor}>{formatearTiempo(estadisticas.tiempoTotal)}</Text>
              <Text style={styles.estatLabel}>Tiempo total</Text>
            </View>

            <View style={styles.estatCard}>
              <View style={[styles.estatIconContainer, { backgroundColor: "#FCE4EC" }]}>
                <Ionicons name="trophy" size={24} color="#E91E63" />
              </View>
              <Text style={styles.estatValor}>{estadisticas.entrenamientosTotal}</Text>
              <Text style={styles.estatLabel}>Entrenamientos</Text>
            </View>
          </View>
        </View>
        
        {/* Historial de entrenamientos */}
        <View style={styles.historialContainer}>
          <View style={styles.historialHeader}>
            <Text style={styles.sectionTitle}>Entrenamientos Recientes</Text>
            <TouchableOpacity
              //onPress={() => navigation.navigate("HistorialCompleto")}
            >
              <Text style={styles.verTodoText}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {entrenamientosRecientes.length === 0 ? (
            <View style={styles.noEntrenamientos}>
              <Ionicons name="fitness-outline" size={48} color="#E0E0E0" />
              <Text style={styles.noEntrenamientosText}>
                Aún no has completado ningún entrenamiento
              </Text>
              <TouchableOpacity
                style={styles.empezarButton}
                onPress={iniciarEntrenamientoRapido}
              >
                <Text style={styles.empezarButtonText}>Empezar ahora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entrenamientosRecientes.slice(0, 5).map((entrenamiento, index) => (
              <TouchableOpacity
                key={index}
                style={styles.entrenamientoCard}
                //onPress={() => navigation.navigate("DetalleEntrenamiento", { entrenamiento })}
              >
                <View style={styles.entrenamientoFecha}>
                  <Text style={styles.fechaDia}>{formatearFecha(entrenamiento.fechaInicio)}</Text>
                  <Text style={styles.fechaHora}>
                    {new Date(entrenamiento.fechaInicio).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>

                <View style={styles.entrenamientoInfo}>
                  <Text style={styles.entrenamientoNombre}>{entrenamiento.nombreRutina}</Text>
                  <Text style={styles.entrenamientoDia}>
                    Día {entrenamiento.diaEntrenamiento + 1}
                  </Text>
                </View>

                <View style={styles.entrenamientoStats}>
                  <View style={styles.statChip}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.statChipText}>
                      {formatearTiempo(entrenamiento.duracion)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#6200EE",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
  },
  saludo: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  nombreUsuario: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  rutinaActivaCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rutinaActivaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rutinaActivaLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6200EE",
    letterSpacing: 1,
  },
  diaIndicator: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  diaText: {
    fontSize: 12,
    color: "#2196F3",
    fontWeight: "600",
  },
  rutinaActivaNombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  rutinaActivaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rutinaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rutinaInfoText: {
    fontSize: 14,
    color: "#666",
  },
  iniciarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iniciarButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
  },
  noRutinaCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderStyle: "dashed",
  },
  noRutinaText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
    marginTop: 12,
  },
  noRutinaSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  estadisticasContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  estadisticasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  estatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  estatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  estatValor: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  estatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  accionesContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  accionCard: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accionText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontWeight: "600",
  },
  historialContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  historialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  verTodoText: {
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
  },
  noEntrenamientos: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  noEntrenamientosText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  empezarButton: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  empezarButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  entrenamientoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  entrenamientoFecha: {
    alignItems: "center",
    marginRight: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    minWidth: 60,
  },
  fechaDia: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200EE",
  },
  fechaHora: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  entrenamientoInfo: {
    flex: 1,
  },
  entrenamientoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  entrenamientoDia: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  entrenamientoStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statChipText: {
    fontSize: 12,
    color: "#666",
  },
});