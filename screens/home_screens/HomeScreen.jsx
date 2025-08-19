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
  Modal
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchRutinaActiva,
  fetchUsuarioByUid,
} from "../../services/usuarioPeticiones";
import { fetchEntrenamientosUsuario } from "../../services/entrenamientoPeticiones";
import { fetchRutinasPublicas } from "../../services/rutinasPeticiones";
import { DetalleEntrenamientoModal } from '../../components/DetalleEntrenamientoModal';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  monthNamesShort: [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ],
  dayNames: [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

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
  const [entrenamientosDelDia, setEntrenamientosDelDia] = useState([]);
  const [modalSeleccionDia, setModalSeleccionDia] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos(false);
    setRefreshing(false);
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
    const entrenamientosDelDia = entrenamientosCalendario.filter(
      entrenamiento => {
        const fechaEntrenamiento = new Date(entrenamiento.fechaInicio).toISOString().split('T')[0];
        return fechaEntrenamiento === day.dateString;
      }
    );

    if (entrenamientosDelDia.length === 1) {
      // Si solo hay uno, abrirlo directamente
      setEntrenamientoSeleccionado(entrenamientosDelDia[0]);
      setModalVisible(true);
    } else if (entrenamientosDelDia.length > 1) {
      // Si hay varios, mostrar lista para elegir
      setEntrenamientosDelDia(entrenamientosDelDia);
      setModalSeleccionDia(true);
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
              locale={'es'}
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
      </ScrollView>
      <DetalleEntrenamientoModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEntrenamientoSeleccionado(null);
        }}
        entrenamiento={entrenamientoSeleccionado}
      />
      {/* Modal para múltiples entrenamientos del mismo día */}
      <Modal
        visible={modalSeleccionDia}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalSeleccionDia(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSeleccionContent}>
            <View style={styles.modalSeleccionHeader}>
              <Text style={styles.modalSeleccionTitle}>
                Entrenamientos del día
              </Text>
              <TouchableOpacity
                onPress={() => setModalSeleccionDia(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.entrenamientosList}>
              {entrenamientosDelDia.map((entrenamiento, index) => (
                <TouchableOpacity
                  key={entrenamiento._id}
                  style={styles.entrenamientoItem}
                  onPress={() => {
                    setEntrenamientoSeleccionado(entrenamiento);
                    setModalSeleccionDia(false);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.entrenamientoItemContent}>
                    <View style={styles.entrenamientoIcon}>
                      <Ionicons name="barbell" size={20} color="#6200EE" />
                    </View>
                    <View style={styles.entrenamientoDetails}>
                      <Text style={styles.entrenamientoNombre}>
                        {entrenamiento.rutina?.nombre || 'Entrenamiento personalizado'}
                      </Text>
                      <Text style={styles.entrenamientoHora}>
                        {new Date(entrenamiento.fechaInicio).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.entrenamientoDuracion}>
                        {Math.floor(entrenamiento.duracion / 60)} min
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#6200EE" />
                  </View>
                </TouchableOpacity>
              ))}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSeleccionContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalSeleccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalSeleccionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entrenamientosList: {
    maxHeight: 400,
  },
  entrenamientoItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderRadius: 20,
  },
  entrenamientoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entrenamientoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entrenamientoDetails: {
    flex: 1,
  },
  entrenamientoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  entrenamientoHora: {
    fontSize: 14,
    color: '#6200EE',
    fontWeight: '500',
  },
  entrenamientoDuracion: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});