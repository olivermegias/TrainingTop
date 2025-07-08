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
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fetchEjerciciosDetails, deleteRutina, asignarRutina } from "../../../services/rutinasPeticiones";
import { DiaEntrenamiento } from "./components/DiaEnternamiento";
import { AuthContext } from "../../../context/AuthContext";
import { Toast } from "../../../components/ToastComponent";

export default function DetalleRutinaScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [rutina, setRutina] = useState(route.params?.rutina || null);
  const [loading, setLoading] = useState(true);
  const [ejerciciosData, setEjerciciosData] = useState({});
  const { user } = useContext(AuthContext);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info'
  });

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
    if (Platform.OS === 'android') {
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
            }
          }
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
      
      if (Platform.OS === 'android') {
        Alert.alert("Éxito", "Rutina eliminada correctamente", [
          { 
            text: "OK", 
            onPress: () => navigation.goBack() 
          }
        ]);
      } else {
        // En web, mostrar un toast y luego navegar hacia atrás
        setToast({
          visible: true,
          message: "Rutina eliminada correctamente",
          type: "success"
        });
        
        // Dar tiempo al toast para mostrarse antes de navegar
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "No se pudo eliminar la rutina";
      
      if (Platform.OS === 'android') {
        Alert.alert("Error", errorMessage);
      } else {
        // En web, mostrar un toast con el error
        setToast({
          visible: true,
          message: errorMessage,
          type: "error"
        });
        console.error(errorMessage);
      }
    }
  };

  const handleAsignarRutina = async () => {
    try {
      const result = await asignarRutina(user.uid, rutina._id);
      
      if (Platform.OS === 'android') {
        Alert.alert("Rutina asignada", result);
      } else {
        // En web, mostrar un toast en lugar del Alert
        setToast({
          visible: true,
          message: "Rutina asignada correctamente",
          type: "success"
        });
      }
    } catch (error) {
      if (Platform.OS === 'android') {
        Alert.alert("Error", "No se pudo asignar la rutina.");
      } else {
        // En web, mostrar un toast con el error
        setToast({
          visible: true,
          message: "No se pudo asignar la rutina",
          type: "error"
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
      <Toast 
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({...toast, visible: false})}
      />
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
        {rutina.publica && (
          <View style={styles.assignContainer}>
            <TouchableOpacity style={styles.assignButton} onPress={handleAsignarRutina}>
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.assignButtonText}>Añadir a mis rutinas</Text>
            </TouchableOpacity>
          </View>
        )}
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
});