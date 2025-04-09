import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fetchRutinasPublicas, fetchRutinasUsuario } from "../../../services/rutinasPeticiones";
import { renderRutinaItem } from "./components/RutinaItem";

export default function RutinaScreen() {
  const [rutinasUsuario, setRutinasUsuario] = useState([]);
  const [rutinasPublicas, setRutinasPublicas] = useState([]);
  const [loadingUsuario, setLoadingUsuario] = useState(true);
  const [loadingPublicas, setLoadingPublicas] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const obtenerDatos = async () => {
      const { rutinasUsuario, loadingUsuario } = await fetchRutinasUsuario();
      const { rutinasPublicasUnicas, loadingPublicas } = await fetchRutinasPublicas(rutinasUsuario);
      setRutinasUsuario(rutinasUsuario);
      setLoadingUsuario(loadingUsuario);
      setRutinasPublicas(rutinasPublicasUnicas);
      setLoadingPublicas(loadingPublicas); 
    };
    obtenerDatos();
  }, []);

  if (loadingUsuario && loadingPublicas) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Cargando rutinas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sección de Rutinas del Usuario */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Rutinas</Text>
          </View>

          {loadingUsuario ? (
            <ActivityIndicator color="#6200EE" style={styles.sectionLoading} />
          ) : rutinasUsuario.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="fitness-outline" size={40} color="#BDBDBD" />
              <Text style={styles.emptyText}>No tienes rutinas guardadas</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate("CrearRutina")}
              >
                <Text style={styles.addButtonText}>Crear nueva rutina</Text>
              </TouchableOpacity>
            </View>
          ) : (
            rutinasUsuario.map((item) => (
              <View key={item._id.toString()}>
                {renderRutinaItem({ item })}
              </View>
            ))
          )}
        </View>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Sección de Rutinas Públicas */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rutinas Públicas</Text>
          </View>

          {loadingPublicas ? (
            <ActivityIndicator color="#6200EE" style={styles.sectionLoading} />
          ) : rutinasPublicas.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="globe-outline" size={40} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                No hay rutinas públicas disponibles
              </Text>
            </View>
          ) : (
            rutinasPublicas.map((item) => (
              <View key={item._id.toString()}>
                {renderRutinaItem({ item })}
              </View>
            ))
          )}
        </View>

        {/* Espacio adicional al final */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CrearRutina")}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
  sectionContainer: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#6200EE",
  },
  sectionLoading: {
    marginVertical: 20,
  },
  separator: {
    height: 8,
    backgroundColor: "#EEEEEE",
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
  arrow: {
    marginRight: 12,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6200EE",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 12,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomPadding: {
    height: 80,
  },
});
