import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../../context/AuthContext";
import {
  actualizarRutina,
  fetchEjerciciosDetails,
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

export default function EditarRutinaScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useContext(AuthContext);

  // Obtenemos la rutina pasada como parámetro desde el DetalleRutinaScreen
  const rutinaOriginal = route.params?.rutina;

  // Estados con los valores iniciales de la rutina existente
  const [nombre, setNombre] = useState(rutinaOriginal?.nombre || "");
  const [descripcion, setDescripcion] = useState(
    rutinaOriginal?.descripcion || ""
  );
  const [nivel, setNivel] = useState(
    typeof rutinaOriginal?.nivel === "string"
      ? parseInt(rutinaOriginal.nivel.replace(/\D/g, "")) || 3
      : rutinaOriginal?.nivel || 3
  );
  const [esPublica, setEsPublica] = useState(rutinaOriginal?.publica || false);
  const [dias, setDias] = useState([]);

  const [loading, setLoading] = useState(false);
  const [ejercicios, setEjercicios] = useState([]);
  const [loadingEjercicios, setLoadingEjercicios] = useState(true);
  const [currentDiaIndex, setCurrentDiaIndex] = useState(0);

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

  // Función para mapear ejercicios con sus datos completos
  const mapearEjerciciosCompletos = (diasOriginal, ejerciciosCompletos) => {

    return diasOriginal.map((dia, diaIndex) => {

      const ejerciciosMapeados = dia.ejercicios.map((ej, ejIndex) => {

        const id = ej.ejercicio;
        if (!Array.isArray(ejerciciosCompletos)) {
          console.error(
            "ERROR: ejerciciosCompletos no es un array:",
            ejerciciosCompletos
          );
          return diasOriginal; // o lanza error, o maneja como quieras
        }
        const ejercicioCompleto = ejerciciosCompletos.find((e) => e.id === id);

        const resultado = {
          ...ej,
          ejercicio: ejercicioCompleto || ej.ejercicio,
        };

        return resultado;
      });

      return {
        ...dia,
        ejercicios: ejerciciosMapeados,
      };
    });
  };

  // Cargar ejercicios disponibles y ejercicios de la rutina
  useEffect(() => {
    // Validamos que exista una rutina para editar
    if (!rutinaOriginal) {
      if (Platform.OS === "web") {
        showToast("No se ha proporcionado una rutina para editar", "error");
      } else {
        Alert.alert("Error", "No se ha proporcionado una rutina para editar", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
      return;
    }

    const cargarDatos = async () => {
      try {
        // Cargar todos los ejercicios disponibles
        const { ejercicios: ejerciciosDisponibles } = await fetchEjercicios();
        setEjercicios(ejerciciosDisponibles);
        try {
          const { ejerciciosData: ejerciciosRutina } =
            await fetchEjerciciosDetails(rutinaOriginal);

          // Mapear los días con los ejercicios completos
          const diasConEjerciciosCompletos = mapearEjerciciosCompletos(
            rutinaOriginal.dias || [{ nombre: "Día 1", ejercicios: [] }],
            Object.values(ejerciciosRutina)
          );

          setDias(diasConEjerciciosCompletos);
        } catch (error) {
          console.error("Error al cargar ejercicios de la rutina:", error);
        }

        setLoadingEjercicios(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        if (Platform.OS === "web") {
          showToast("No se pudieron cargar los datos necesarios", "error");
        } else {
          Alert.alert("Error", "No se pudieron cargar los datos necesarios");
        }
        setLoadingEjercicios(false);
        // En caso de error, usar datos básicos para no bloquear la edición
        setDias(rutinaOriginal.dias || [{ nombre: "Día 1", ejercicios: [] }]);
      }
    };

    cargarDatos();
  }, [rutinaOriginal, navigation]);

  const handleNivelChange = (newNivel) => {
    setNivel(newNivel);
  };

  const agregarDia = () => {
    const nuevoDia = {
      nombre: `Día ${dias.length + 1}`,
      ejercicios: [],
    };
    setDias([...dias, nuevoDia]);
    // Seleccionar automáticamente el nuevo día
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
      // Confirmación en web usando window.confirm
      const confirmacion = window.confirm(
        "¿Estás seguro de que deseas eliminar este día de entrenamiento?"
      );
      if (confirmacion) {
        const nuevosDias = dias.filter((_, i) => i !== index);
        setDias(nuevosDias);
        if (currentDiaIndex >= nuevosDias.length) {
          setCurrentDiaIndex(Math.max(0, nuevosDias.length - 1));
        } else if (currentDiaIndex === index) {
          setCurrentDiaIndex(Math.max(0, index - 1));
        }
        showToast("Día eliminado correctamente", "success");
      }
    } else {
      // Confirmación en móvil usando Alert
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

  const actualizarDia = (index, diaNuevo) => {
    const nuevosDias = [...dias];
    nuevosDias[index] = { ...diaNuevo };
    setDias(nuevosDias);
  };

  const actualizarNombreDia = (index, nuevoNombre) => {
    const nuevosDias = [...dias];
    nuevosDias[index] = { ...nuevosDias[index], nombre: nuevoNombre };
    setDias(nuevosDias);
  };

  const guardarCambios = async () => {
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
      // Preparar los días para guardar (convertir ejercicios a IDs si es necesario)
      const diasParaGuardar = dias.map((dia) => ({
        ...dia,
        ejercicios: dia.ejercicios.map((ejercicio) => {
          // Si el ejercicio es un objeto, extraer su ID
          if (typeof ejercicio === "object" && ejercicio.ejercicio) {
            return {
              ...ejercicio,
              id: ejercicio.ejercicio, // Asegurarse de que el ID esté presente
            };
          }
          return ejercicio;
        }),
      }));
      const rutinaActualizada = {
        ...rutinaOriginal,
        nombre,
        descripcion,
        nivel,
        publica: esPublica, // Mantenemos la visibilidad original, no se permite cambiar
        dias: diasParaGuardar,
        fechaActualizacion: new Date(),
      };
      // Llamamos al servicio de actualización
      await actualizarRutina(rutinaOriginal._id, rutinaActualizada);

      // Mostrar éxito
      if (Platform.OS === "web") {
        showToast("Rutina actualizada correctamente", "success");
        setTimeout(() => {
          // Navegamos de vuelta al detalle con la rutina actualizada
          navigation.navigate("DetalleRutina", { rutina: rutinaActualizada });
        }, 1500);
      } else {
        Alert.alert("Éxito", "Rutina actualizada correctamente", [
          {
            text: "OK",
            onPress: () =>
              navigation.navigate("DetalleRutina", {
                rutina: rutinaActualizada,
              }),
          },
        ]);
      }
    } catch (error) {
      console.error("Error al actualizar la rutina:", error);
      if (Platform.OS === "web") {
        showToast(
          "No se pudo actualizar la rutina. Inténtalo de nuevo.",
          "error"
        );
      } else {
        Alert.alert(
          "Error",
          "No se pudo actualizar la rutina. Inténtalo de nuevo."
        );
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
          <Text style={styles.loadingText}>Cargando datos de la rutina...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

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
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backIcon}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#6200EE" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Rutina</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Sección información básica */}
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

            {/* Si la rutina es pública, mostramos un mensaje informativo */}
            {rutinaOriginal?.publica && (
              <View style={styles.publicBadge}>
                <Ionicons name="globe-outline" size={16} color="white" />
                <Text style={styles.publicText}>
                  Esta es una rutina pública y no puede modificarse su
                  visibilidad
                </Text>
              </View>
            )}
          </View>

          {/* Separador */}
          <View style={styles.separator} />

          {/* Sección días de entrenamiento */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderWithAction}>
              <Text style={styles.sectionTitle}>Días de Entrenamiento</Text>
              <TouchableOpacity style={styles.addButton} onPress={agregarDia}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Añadir día</Text>
              </TouchableOpacity>
            </View>

            {/* Pestañas de días */}
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
                      onPress={() => eliminarDia(index)}
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

            {/* Editor del día actual */}
            <View style={styles.diaEditorContainer}>
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

              {/* Solo renderizar DiaEntrenamientoEditor si tenemos un día válido */}
              {dias[currentDiaIndex] && (
                <DiaEntrenamientoEditor
                  key={`dia-${currentDiaIndex}`}
                  dia={dias[currentDiaIndex]}
                  ejerciciosDisponibles={ejercicios}
                  onDiaChange={(nuevoDia) =>
                    actualizarDia(currentDiaIndex, nuevoDia)
                  }
                />
              )}
            </View>
          </View>

          {/* Espacio al final para botón flotante */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Botón guardar */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.guardarButton}
            onPress={guardarCambios}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.guardarButtonText}>Guardar Cambios</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    width: 34, // Igual que el ancho del botón de retroceso
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
  publicBadge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  publicText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
    flexShrink: 1,
  },
  separator: {
    height: 8,
    backgroundColor: "#EEEEEE",
  },
  sectionHeaderWithAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  diasTabs: {
    flexDirection: "row",
    maxHeight: 50,
    marginBottom: 15,
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
  diaEditorContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  diaNameContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 15,
  },
  footer: {
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  guardarButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
  },
  guardarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  bottomPadding: {
    height: 80,
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
