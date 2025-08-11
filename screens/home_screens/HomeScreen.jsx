import { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar } from "react-native-calendars";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchRutinaActiva,
  fetchUsuarioByUid,
} from "../../services/usuarioPeticiones";
import { fetchEntrenamientosUsuario } from "../../services/entrenamientoPeticiones";
import { fetchRutinasPublicas } from "../../services/rutinasPeticiones";
import { DetalleEntrenamientoModal } from '../../components/DetalleEntrenamientoModal';


export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [rutinaActiva, setRutinaActiva] = useState(null);
  const [progreso, setProgreso] = useState(null);
  const [entrenamientosRecientes, setEntrenamientosRecientes] = useState([]);
  const [entrenamientosCalendario, setEntrenamientosCalendario] = useState([]);
  const [rutinasPublicas, setRutinasPublicas] = useState([]);
  const [rutinaPublicaActual, setRutinaPublicaActual] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);

  const [entrenamientoSeleccionado, setEntrenamientoSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos(isFirstLoad);
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#6200EE");

      return () => {
        StatusBar.setBarStyle("dark-content");
        StatusBar.setBackgroundColor("#F5F5F5");
      };
    }, [])
  );

  const cargarDatos = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const userResult = await fetchUsuarioByUid(user.uid);
      if (userResult) {
        setUserData(userResult);
      }

      const rutinaResult = await fetchRutinaActiva(user.uid);
      if (rutinaResult.success) {
        setRutinaActiva(rutinaResult.rutinaActiva);
        setProgreso(rutinaResult.progreso);
      }

      const entrenamientosResult = await fetchEntrenamientosUsuario(
        user.uid,
        20
      );
      if (entrenamientosResult.success) {
        setEntrenamientosRecientes(entrenamientosResult.entrenamientos);
        setEntrenamientosCalendario(entrenamientosResult.entrenamientos);
      }

      const rutinasPublicasResult = await fetchRutinasPublicas();
      if (rutinasPublicasResult.rutinasPublicasUnicas) {
        setRutinasPublicas(rutinasPublicasResult.rutinasPublicasUnicas);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
        setIsFirstLoad(false);
      }
    }
  };

  const handleDayPress = (day) => {
    const entrenamientoDelDia = entrenamientosCalendario.find(
      entrenamiento => {
        const fechaEntrenamiento = new Date(entrenamiento.fechaInicio).toISOString().split('T')[0];
        return fechaEntrenamiento === day.dateString;
      }
    );

    if (entrenamientoDelDia) {
      setEntrenamientoSeleccionado(entrenamientoDelDia);
      setModalVisible(true);
    }
  };

  const mostrarMas = () => {
    setVisibleCount((prev) => prev + 4);
  };

  const mostrarMenos = () => {
    setVisibleCount(4);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos(false);
    setRefreshing(false);
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
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
    }
  };

  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora > 4 && hora < 12) return "Buenos días";
    if (hora > 12 && hora < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const iniciarEntrenamientoRapido = () => {
    if (rutinaActiva) {
      navigation.navigate("EjecutarRutina", { rutina: rutinaActiva });
    } else {
      navigation.navigate("Rutinas");
    }
  };

  const generarFechasMarcadas = () => {
    const marcadas = {};

    entrenamientosCalendario.forEach((entrenamiento) => {
      const fecha = new Date(entrenamiento.fechaInicio).toISOString().split('T')[0];
      marcadas[fecha] = {
        selected: true,
        selectedColor: '#6200EE',
        selectedTextColor: 'white',
        marked: true,
        dotColor: 'white',
      };
    });

    return marcadas;
  };

  const onDayPress = (day) => {
    const entrenamientoDelDia = entrenamientosCalendario.find(
      entrenamiento => {
        const fechaEntrenamiento = new Date(entrenamiento.fechaInicio).toISOString().split('T')[0];
        return fechaEntrenamiento === day.dateString;
      }
    );

    if (entrenamientoDelDia) {
      setEntrenamientoSeleccionado(entrenamientoDelDia);
      setModalVisible(true);
    }
  };

  const siguienteRutinaPublica = () => {
    if (rutinasPublicas.length > 0) {
      setRutinaPublicaActual((prev) =>
        prev >= rutinasPublicas.length - 1 ? 0 : prev + 1
      );
    }
  };

  const anteriorRutinaPublica = () => {
    if (rutinasPublicas.length > 0) {
      setRutinaPublicaActual((prev) =>
        prev <= 0 ? rutinasPublicas.length - 1 : prev - 1
      );
    }
  };

  // Calcular estadísticas rápidas
  const getEstadisticasRapidas = () => {
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

    const entrenamientosSemana = entrenamientosRecientes.filter(e => {
      const fecha = new Date(e.fechaInicio);
      return fecha >= hace7Dias;
    }).length;

    const totalMinutos = entrenamientosRecientes.reduce((acc, e) =>
      acc + (e.duracion || 0), 0
    ) / 60;

    return {
      semana: entrenamientosSemana,
      total: entrenamientosRecientes.length,
      minutos: Math.round(totalMinutos),
    };
  };

  const stats = getEstadisticasRapidas();

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6200EE"
          />
        }
      >
        {/* Header con diseño mejorado */}
        <LinearGradient
          colors={["#6200EE", "#5600D8", "#4A00C2"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Patrón decorativo de fondo */}
          <View style={styles.headerPattern}>
            <View style={[styles.circle, { top: -30, right: -30 }]} />
            <View style={[styles.circle, { bottom: -50, left: -50, width: 150, height: 150 }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.saludo}>{getSaludo()},</Text>
              <Text style={styles.nombreUsuario}>
                {userData?.nombre || "Usuario"} 💪
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Perfil")}
            >
              <View style={styles.profileIconContainer}>
                <Ionicons name="person" size={24} color="#6200EE" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Estadísticas rápidas */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={20} color="#fffb00ff" />
              <Text style={styles.statNumber}>{stats.semana}</Text>
              <Text style={styles.statLabel}>Esta semana</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4afe4dff" />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={20} color="#5cf7f9ff" />
              <Text style={styles.statNumber}>{stats.minutos}</Text>
              <Text style={styles.statLabel}>Min. totales</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Sección de Rutina Activa o CTA */}
        <View style={styles.mainActionContainer}>
          {rutinaActiva ? (
            <TouchableOpacity
              style={styles.rutinaActivaCard}
              onPress={iniciarEntrenamientoRapido}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#7C3AED", "#6D28D9"]}
                style={styles.rutinaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.rutinaHeader}>
                  <View style={styles.rutinaLabel}>
                    <Ionicons name="barbell" size={16} color="white" />
                    <Text style={styles.rutinaLabelText}>RUTINA ACTIVA</Text>
                  </View>
                </View>

                <Text style={styles.rutinaActivaNombre}>
                  {rutinaActiva.nombre}
                </Text>

                <View style={styles.rutinaFooter}>
                  <View style={styles.rutinaProgress}>
                    <Text style={styles.rutinaActivaDia}>
                      Día {(progreso?.diaActual || 0) + 1} de {rutinaActiva.dias?.length || 0}
                    </Text>
                  </View>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={24} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.noRutinaCard}
              onPress={() => navigation.navigate("Rutinas")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#9333EA", "#7E22CE"]}
                style={styles.noRutinaGradient}
              >
                <View style={styles.noRutinaContent}>
                  <View style={styles.noRutinaIcon}>
                    <Ionicons name="add" size={32} color="white" />
                  </View>
                  <View>
                    <Text style={styles.noRutinaTitulo}>Comienza tu viaje</Text>
                    <Text style={styles.noRutinaText}>Selecciona tu primera rutina</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Rutinas Destacadas con nuevo diseño */}
        {rutinasPublicas.length > 0 && (
          <View style={styles.rutinasPublicasContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Descubre rutinas</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Rutinas")}>
                <Text style={styles.verTodas}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectorRutinas}>
              <TouchableOpacity
                style={styles.flechaSelector}
                onPress={anteriorRutinaPublica}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={20} color="#6200EE" />
              </TouchableOpacity>

              <View style={styles.rutinaPublicaCard}>
                <LinearGradient
                  colors={["#F5F5F5", "#FAFAFA"]}
                  style={styles.rutinaPublicaGradient}
                >
                  <View style={styles.rutinaPublicaBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.badgeText}>DESTACADA</Text>
                  </View>

                  <Text style={styles.rutinaPublicaNombre}>
                    {rutinasPublicas[rutinaPublicaActual]?.nombre}
                  </Text>

                  {rutinasPublicas[rutinaPublicaActual]?.descripcion && (
                    <Text style={styles.rutinaPublicaDescripcion} numberOfLines={2}>
                      {rutinasPublicas[rutinaPublicaActual].descripcion}
                    </Text>
                  )}

                  <View style={styles.rutinaPublicaFooter}>
                    <View style={styles.rutinaPublicaInfo}>
                      <View style={styles.infoChip}>
                        <Ionicons name="calendar-outline" size={14} color="#6200EE" />
                        <Text style={styles.infoText}>
                          {rutinasPublicas[rutinaPublicaActual]?.dias?.length || 0} días
                        </Text>
                      </View>
                      <View style={styles.infoChip}>
                        <Ionicons name="barbell-outline" size={14} color="#6200EE" />
                        <Text style={styles.infoText}>
                          {rutinasPublicas[rutinaPublicaActual]?.nivel || 'Principiante'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.verRutinaButton}
                      onPress={() => {
                        navigation.navigate("Rutinas", {
                          screen: "DetalleRutina",
                          params: { rutina: rutinasPublicas[rutinaPublicaActual] }
                        });
                      }}
                    >
                      <Ionicons name="arrow-forward-circle" size={32} color="#6200EE" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dotsIndicator}>
                    {rutinasPublicas.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          index === rutinaPublicaActual && styles.dotActive
                        ]}
                      />
                    ))}
                  </View>
                </LinearGradient>
              </View>

              <TouchableOpacity
                style={styles.flechaSelector}
                onPress={siguienteRutinaPublica}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color="#6200EE" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Calendario siempre visible */}
        <View style={styles.calendarioContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu actividad</Text>
          </View>
          <View style={styles.calendarioCard}>
            <Calendar
              style={styles.calendario}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: '#6200EE',
                selectedDayBackgroundColor: '#6200EE',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#6200EE',
                todayBackgroundColor: '#F3E5F5',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#6200EE',
                selectedDotColor: 'white',
                arrowColor: '#6200EE',
                monthTextColor: '#212121',
                indicatorColor: '#6200EE',
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 12
              }}
              markedDates={generarFechasMarcadas()}
              markingType={'dot'}
              hideExtraDays={true}
              firstDay={1}
              enableSwipeMonths={true}
              onDayPress={onDayPress}
            />
          </View>
        </View>

        {/* Historial mejorado */}
        <View style={styles.historialContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Actividad reciente</Text>
          </View>

          {entrenamientosRecientes.length === 0 ? (
            <View style={styles.noEntrenamientos}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="barbell-outline" size={64} color="#E0E0E0" />
              </View>
              <Text style={styles.noEntrenamientosTitle}>
                ¡Es hora de empezar!
              </Text>
              <Text style={styles.noEntrenamientosText}>
                Tu primer entrenamiento te está esperando
              </Text>
              <TouchableOpacity
                style={styles.empezarButton}
                onPress={iniciarEntrenamientoRapido}
              >
                <LinearGradient
                  colors={["#6200EE", "#5600D8"]}
                  style={styles.empezarGradient}
                >
                  <Text style={styles.empezarButtonText}>Comenzar ahora</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {entrenamientosRecientes
                .slice(0, visibleCount)
                .map((entrenamiento, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setEntrenamientoSeleccionado(entrenamiento);
                      setModalVisible(true);
                    }}
                    style={[
                      styles.entrenamientoCard,
                      index === 0 && styles.entrenamientoCardFirst
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.entrenamientoLeft}>
                      <View style={[
                        styles.entrenamientoFecha,
                        index === 0 && styles.entrenamientoFechaRecent
                      ]}>
                        <Text style={[
                          styles.fechaDia,
                          index === 0 && styles.fechaDiaRecent
                        ]}>
                          {formatearFecha(entrenamiento.fechaInicio)}
                        </Text>
                        <Text style={[
                          styles.fechaHora,
                          index === 0 && styles.fechaHoraRecent
                        ]}>
                          {new Date(entrenamiento.fechaInicio).toLocaleTimeString(
                            "es-ES",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.entrenamientoCenter}>
                      <Text style={styles.entrenamientoNombre}>
                        {entrenamiento.nombreRutina}
                      </Text>
                      <Text style={styles.entrenamientoDia}>
                        Día {entrenamiento.diaEntrenamiento + 1}
                      </Text>
                      <View style={styles.entrenamientoStats}>
                        <View style={styles.statChip}>
                          <Ionicons name="time-outline" size={12} color="#666" />
                          <Text style={styles.statChipText}>
                            {Math.round((entrenamiento.duracion || 0) / 60)} min
                          </Text>
                        </View>
                        <View style={styles.statChip}>
                          <Ionicons name="fitness-outline" size={12} color="#666" />
                          <Text style={styles.statChipText}>
                            {entrenamiento.ejercicios?.length || 0} ejercicios
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.entrenamientoRight}>
                      <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
                    </View>
                  </TouchableOpacity>
                ))}

              {entrenamientosRecientes.length > 4 && (
                <View style={styles.verMasContainer}>
                  {visibleCount < entrenamientosRecientes.length && (
                    <TouchableOpacity
                      style={styles.verMasButton}
                      onPress={mostrarMas}
                    >
                      <Text style={styles.verMasText}>
                        Ver más ({entrenamientosRecientes.length - visibleCount})
                      </Text>
                      <Ionicons name="chevron-down" size={16} color="#6200EE" />
                    </TouchableOpacity>
                  )}
                  {visibleCount > 4 && (
                    <TouchableOpacity
                      style={styles.verMenosButton}
                      onPress={mostrarMenos}
                    >
                      <Text style={styles.verMasText}>Ver menos</Text>
                      <Ionicons name="chevron-up" size={16} color="#6200EE" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: "#6200EE",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  saludo: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
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
  profileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  mainActionContainer: {
    marginTop: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  rutinaActivaCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  rutinaGradient: {
    borderRadius: 20,
    padding: 20,
  },
  rutinaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rutinaLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rutinaLabelText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 1.5,
  },
  progressBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  rutinaActivaNombre: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginBottom: 16,
  },
  rutinaFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rutinaProgress: {
    flex: 1,
    marginRight: 16,
  },
  rutinaActivaDia: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  noRutinaCard: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  noRutinaGradient: {
    borderRadius: 20,
    padding: 20,
  },
  noRutinaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noRutinaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  noRutinaTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  noRutinaText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  quickAccessContainer: {
    paddingLeft: 20,
    marginBottom: 24,
  },
  quickAccessCard: {
    alignItems: "center",
    marginRight: 16,
  },
  quickAccessIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickAccessText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  calendarioContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  verTodas: {
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
  },
  calendarioCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  calendario: {
    borderRadius: 12,
  },
  rutinasPublicasContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  selectorRutinas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flechaSelector: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  rutinaPublicaCard: {
    flex: 1,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: "hidden",
  },
  rutinaPublicaGradient: {
    padding: 20,
  },
  rutinaPublicaBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#F59E0B",
    letterSpacing: 0.5,
  },
  rutinaPublicaNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  rutinaPublicaDescripcion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    lineHeight: 20,
  },
  rutinaPublicaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rutinaPublicaInfo: {
    flexDirection: "row",
    gap: 12,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#6200EE",
    fontWeight: "600",
  },
  verRutinaButton: {
    padding: 4,
  },
  dotsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
  },
  dotActive: {
    backgroundColor: "#6200EE",
    width: 18,
  },
  historialContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  noEntrenamientos: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  noEntrenamientosTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  noEntrenamientosText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  empezarButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  empezarGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  empezarButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  entrenamientoCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  entrenamientoCardFirst: {
    backgroundColor: "#F3E5F5",
    borderWidth: 2,
    borderColor: "#E1BEE7",
  },
  entrenamientoLeft: {
    marginRight: 16,
  },
  entrenamientoFecha: {
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
  },
  entrenamientoFechaRecent: {
    backgroundColor: "#6200EE",
  },
  fechaDia: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200EE",
  },
  fechaDiaRecent: {
    color: "white",
  },
  fechaHora: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  fechaHoraRecent: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  entrenamientoCenter: {
    flex: 1,
  },
  entrenamientoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  entrenamientoDia: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  entrenamientoStats: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statChipText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  entrenamientoRight: {
    paddingLeft: 8,
  },
  verMasContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  verMasButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6200EE",
    gap: 6,
  },
  verMenosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  verMasText: {
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
  },
});