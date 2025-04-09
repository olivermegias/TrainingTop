import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fetchEjerciciosDetails, deleteRutina } from "../../../services/rutinasPeticiones";
import { DiaEntrenamiento } from "./components/DiaEnternamiento";


export default function DetalleRutinaScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [rutina, setRutina] = useState(route.params?.rutina || null);
  const [loading, setLoading] = useState(true);
  const [ejerciciosData, setEjerciciosData] = useState({});

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
            <DiaEntrenamiento
            key={index}
            dia={dia}
            index={index}
            ejerciciosData={ejerciciosData}
          />
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
});
