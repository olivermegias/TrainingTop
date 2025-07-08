import { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../context/AuthContext";
import {
  asignarRutina,
  crearRutina,
} from "../../../services/rutinasPeticiones";
import DiaEntrenamientoEditor from "./components/DiaEntrenamientoEditor";
import { fetchEjercicios } from "../../../services/ejerciciosPeticiones";

// Toast Component
const Toast = ({
  visible,
  message,
  type = "info",
  duration = 3000,
  onDismiss,
}) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration - 600),
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onDismiss) {
          onDismiss();
        }
      });
    }
  }, [visible, duration, animation, onDismiss]);

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#F44336";
      case "warning":
        return "#FF9800";
      default:
        return "#6200EE";
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: getBackgroundColor(),
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function CrearRutinaScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);

  // Estados iniciales para crear rutina desde cero
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivel, setNivel] = useState(3);
  const [esPublica, setEsPublica] = useState(false);
  const [dias, setDias] = useState([{ nombre: "Día 1", ejercicios: [] }]);

  const [loading, setLoading] = useState(false);
  const [ejercicios, setEjercicios] = useState([]);
  const [loadingEjercicios, setLoadingEjercicios] = useState(true);
  const [currentDiaIndex, setCurrentDiaIndex] = useState(0);
  const [showBasicInfo, setShowBasicInfo] = useState(true);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });

  // Function to show toast
  const showToast = (message, type = "info") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Cargar ejercicios disponibles
  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        const { ejercicios: ejerciciosDisponibles } = await fetchEjercicios();
        setEjercicios(ejerciciosDisponibles);
        setLoadingEjercicios(false);
      } catch (error) {
        console.error("Error al cargar ejercicios:", error);
        if (Platform.OS === "web") {
          showToast("No se pudieron cargar los ejercicios", "error");
        } else {
          Alert.alert("Error", "No se pudieron cargar los ejercicios");
        }
        setLoadingEjercicios(false);
      }
    };

    cargarEjercicios();
  }, []);

  const handleNivelChange = (newNivel) => {
    setNivel(newNivel);
  };

  const handlePublicaChange = () => {
    setEsPublica(!esPublica);
  };

  const agregarDia = () => {
    const nuevoDia = {
      nombre: `Día ${dias.length + 1}`,
      ejercicios: [],
    };
    setDias([...dias, nuevoDia]);
    // Cambiar a la vista de días y seleccionar el nuevo día
    setShowBasicInfo(false);
    setCurrentDiaIndex(dias.length);
  };

  const eliminarDia = (index) => {
    if (dias.length <= 1) {
      if (Platform.OS === "web") {
        showToast("La rutina debe tener al menos un día", "error");
      } else {
        Alert.alert("Error", "La rutina debe tener al menos un día");
      }
      return;
    }

    if (Platform.OS === "web") {
      const confirmacion = window.confirm(
        "¿Estás seguro de que deseas eliminar este día de entrenamiento?"
      );
      if (confirmacion) {
        const nuevosDias = dias.filter((_, i) => i !== index);
        setDias(nuevosDias);
        // Ajustar el índice actual si es necesario
        if (currentDiaIndex >= nuevosDias.length) {
          setCurrentDiaIndex(Math.max(0, nuevosDias.length - 1));
        } else if (currentDiaIndex === index) {
          setCurrentDiaIndex(Math.max(0, index - 1));
        }
        showToast("Día eliminado correctamente", "success");
      }
    } else {
      Alert.alert(
        "Eliminar día",
        "¿Estás seguro de que deseas eliminar este día de entrenamiento?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              const nuevosDias = dias.filter((_, i) => i !== index);
              setDias(nuevosDias);
              if (currentDiaIndex >= nuevosDias.length) {
                setCurrentDiaIndex(Math.max(0, nuevosDias.length - 1));
              } else if (currentDiaIndex === index) {
                setCurrentDiaIndex(Math.max(0, index - 1));
              }
              showToast("Día eliminado correctamente", "success");
            },
          },
        ]
      );
    }
  };

  // Función clave para actualizar un día específico correctamente
  const actualizarDia = (index, diaNuevo) => {
    const nuevosDias = [...dias];
    nuevosDias[index] = { ...diaNuevo }; // Aseguramos que sea una copia profunda
    setDias(nuevosDias);
  };

  const actualizarNombreDia = (index, nuevoNombre) => {
    const nuevosDias = [...dias];
    nuevosDias[index] = { ...nuevosDias[index], nombre: nuevoNombre };
    setDias(nuevosDias);
  };

  const crearNuevaRutina = async () => {
    // Validaciones
    if (!nombre.trim()) {
      if (Platform.OS === "web") {
        showToast("Por favor ingresa un nombre para la rutina", "error");
      } else {
        Alert.alert("Error", "Por favor ingresa un nombre para la rutina");
      }
      return;
    }

    if (dias.length === 0) {
      if (Platform.OS === "web") {
        showToast("Debes añadir al menos un día de entrenamiento", "error");
      } else {
        Alert.alert("Error", "Debes añadir al menos un día de entrenamiento");
      }
      return;
    }

    // Validar que todos los días tengan al menos un ejercicio
    const diasSinEjercicios = dias.filter((dia) => dia.ejercicios.length === 0);
    if (diasSinEjercicios.length > 0) {
      if (Platform.OS === "web") {
        showToast("Todos los días deben tener al menos un ejercicio", "error");
      } else {
        Alert.alert(
          "Error",
          "Todos los días deben tener al menos un ejercicio"
        );
      }
      return;
    }

    setLoading(true);

    try {
      const diasTransformados = dias.map((dia) => ({
        nombre: dia.nombre,
        ejercicios: dia.ejercicios.map((ejercicioData) => ({
          ejercicio: ejercicioData.ejercicio.id, // Solo enviamos el ID del ejercicio
          series: ejercicioData.series,
          repeticiones: ejercicioData.repeticiones,
          descanso: ejercicioData.descanso,
          peso: ejercicioData.peso,
        })),
      }));
      console.log("👤 Usuario ID que se enviará:", user.uid);
      const nuevaRutina = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        nivel,
        publica: esPublica,
        dias: diasTransformados, // Usar los días transformados
        usuarioId: user.uid,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
      };

      let rutinaCreada;

      try {
        rutinaCreada = await crearRutina(nuevaRutina);
        console.log(
          "✅ Rutina creada y asignada automáticamente:",
          rutinaCreada
        );
        // Ya no necesitas la llamada a asignarRutina
      } catch (error) {
        console.error("❌ Error al crear la rutina:", error);
      }
      // Ya no necesitas la llamada a asignarRutina

      if (Platform.OS === "web") {
        showToast("Rutina creada correctamente", "success");
        setTimeout(() => {
          navigation.navigate("DetalleRutina", { rutina: rutinaCreada });
        }, 1500);
      } else {
        Alert.alert("Éxito", "Rutina creada correctamente", [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("DetalleRutina", {
                rutina: rutinaCreada,
              }),
          },
        ]);
      }
    } catch (error) {
      console.error("Error al crear la rutina:", error);
      if (Platform.OS === "web") {
        showToast("No se pudo crear la rutina. Inténtalo de nuevo.", "error");
      } else {
        Alert.alert("Error", "No se pudo crear la rutina. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingEjercicios) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Cargando ejercicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Crear', dias[currentDiaIndex])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Toast component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        {/* Header - FIJO */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#6200EE" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Rutina</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Navigation tabs - FIJO */}
        <View style={styles.navigationTabs}>
          <TouchableOpacity
            style={[styles.navTab, showBasicInfo && styles.navTabActive]}
            onPress={() => setShowBasicInfo(true)}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={showBasicInfo ? "#6200EE" : "#9E9E9E"}
            />
            <Text
              style={[
                styles.navTabText,
                showBasicInfo && styles.navTabTextActive,
              ]}
            >
              Información
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navTab, !showBasicInfo && styles.navTabActive]}
            onPress={() => setShowBasicInfo(false)}
          >
            <Ionicons
              name="fitness"
              size={20}
              color={!showBasicInfo ? "#6200EE" : "#9E9E9E"}
            />
            <Text
              style={[
                styles.navTabText,
                !showBasicInfo && styles.navTabTextActive,
              ]}
            >
              Entrenamientos
            </Text>
          </TouchableOpacity>
        </View>

        {!showBasicInfo && (
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.diasTabs}
            >
              {dias.map((dia, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.diaTab,
                    currentDiaIndex === index && styles.diaTabActive,
                  ]}
                  onPress={() => setCurrentDiaIndex(index)}
                >
                  <Text
                    style={[
                      styles.diaTabText,
                      currentDiaIndex === index && styles.diaTabTextActive,
                    ]}
                  >
                    {dia.nombre}
                  </Text>
                  {dias.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeDiaButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        eliminarDia(index);
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={
                          currentDiaIndex === index ? "#6200EE" : "#9E9E9E"
                        }
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.addButton} onPress={agregarDia}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Día</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CONTENIDO SCROLLABLE PRINCIPAL */}
        <ScrollView 
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollableContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {showBasicInfo ? (
            // SECCIÓN A: Información básica
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Básica</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre de la rutina</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Rutina de fuerza para principiantes"
                  value={nombre}
                  onChangeText={setNombre}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.textInput, styles.textInputMultiline]}
                  placeholder="Describe el objetivo y características de esta rutina"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nivel de dificultad</Text>
                <View style={styles.nivelSelector}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleNivelChange(value)}
                      style={styles.nivelStar}
                    >
                      <Ionicons
                        name={value <= nivel ? "star" : "star-outline"}
                        size={30}
                        color={value <= nivel ? "#FFC107" : "#BDBDBD"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.publicToggle}
                  onPress={handlePublicaChange}
                >
                  <View style={styles.publicToggleContent}>
                    <View style={styles.publicToggleLeft}>
                      <Ionicons
                        name={esPublica ? "globe" : "lock-closed"}
                        size={20}
                        color="#6200EE"
                      />
                      <View style={styles.publicToggleText}>
                        <Text style={styles.publicToggleTitle}>
                          {esPublica ? "Rutina Pública" : "Rutina Privada"}
                        </Text>
                        <Text style={styles.publicToggleDescription}>
                          {esPublica
                            ? "Otros usuarios podrán ver y usar esta rutina"
                            : "Solo tú podrás ver y usar esta rutina"}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.toggleSwitch,
                        esPublica && styles.toggleSwitchActive,
                      ]}
                    >
                      <View
                        style={[
                          styles.toggleSwitchThumb,
                          esPublica && styles.toggleSwitchThumbActive,
                        ]}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Botón para ir a entrenamientos */}
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setShowBasicInfo(false)}
              >
                <Text style={styles.nextButtonText}>
                  Configurar Entrenamientos
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            // SECCIÓN B: Gestión de días de entrenamiento
            <View style={styles.diaEditorWrapper}>
              <View style={styles.diaNameContainer}>
                <Text style={styles.inputLabel}>Nombre del día</Text>
                <TextInput
                  style={styles.textInput}
                  value={dias[currentDiaIndex]?.nombre || ""}
                  onChangeText={(text) =>
                    actualizarNombreDia(currentDiaIndex, text)
                  }
                  placeholder="Ej: Día de pierna, Pecho y bíceps, etc."
                />
              </View>

              {/* Editor del día actual - SIN ScrollView interno */}
              <View style={styles.diaEditorContainer}>
                <DiaEntrenamientoEditor
                  key={`dia-${currentDiaIndex}`} // Key para forzar re-render
                  dia={dias[currentDiaIndex]}
                  ejerciciosDisponibles={ejercicios}
                  onDiaChange={(nuevoDia) =>
                    actualizarDia(currentDiaIndex, nuevoDia)
                  }
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer con botón crear - FIJO */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.crearButton}
            onPress={crearNuevaRutina}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text style={styles.crearButtonText}>Crear Rutina</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardAvoid: {
    flex: 1,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#F5F5F5",
  },
  backIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
  },
  headerSpacer: {
    width: 34,
  },
  navigationTabs: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  navTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  navTabActive: {
    borderBottomColor: "#6200EE",
  },
  navTabText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  navTabTextActive: {
    color: "#6200EE",
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  diasTabs: {
    flex: 1,
    maxHeight: 50,
  },
  diaTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  diaTabActive: {
    backgroundColor: "#E6D5FF",
  },
  diaTabText: {
    fontSize: 14,
    color: "#616161",
    fontWeight: "500",
  },
  diaTabTextActive: {
    color: "#6200EE",
    fontWeight: "bold",
  },
  removeDiaButton: {
    marginLeft: 6,
  },
  addButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  // NUEVO: Contenido scrollable principal
  scrollableContent: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollableContentContainer: {
    flexGrow: 1,
  },
  formSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#616161",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  nivelSelector: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingVertical: 5,
  },
  nivelStar: {
    marginRight: 8,
  },
  publicToggle: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 15,
  },
  publicToggleContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  publicToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  publicToggleText: {
    marginLeft: 12,
    flex: 1,
  },
  publicToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  publicToggleDescription: {
    fontSize: 14,
    color: "#616161",
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: "#6200EE",
  },
  toggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  toggleSwitchThumbActive: {
    alignSelf: "flex-end",
  },
  nextButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  diaEditorWrapper: {
    flex: 1,
    backgroundColor: "white",
  },
  diaEditorContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  diaNameContainer: {
    backgroundColor: "white",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  footer: {
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  crearButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  crearButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  // Toast styles
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});