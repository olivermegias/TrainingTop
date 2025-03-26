import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const API_URL_ANDROID = "http://10.0.2.2:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export default function RutinaScreen() {
  const [rutinasUsuario, setRutinasUsuario] = useState([]);
  const [rutinasPublicas, setRutinasPublicas] = useState([]);
  const [loadingUsuario, setLoadingUsuario] = useState(true);
  const [loadingPublicas, setLoadingPublicas] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchRutinasUsuario();
    fetchRutinasPublicas();
  }, []);

  const fetchRutinasUsuario = async () => {
    try {
      const response = await axios.get(`${API_URL}/rutinas/usuario`);
      setRutinasUsuario(response.data);
      setLoadingUsuario(false);
    } catch (error) {
      console.error("Error al obtener rutinas del usuario:", error);
      setLoadingUsuario(false);
    }
  };

  const fetchRutinasPublicas = async () => {
    try {
      const response = await axios.get(`${API_URL}/rutinas/publicas`);
      // Filtramos para evitar mostrar rutinas que ya pertenecen al usuario
      const rutinasPublicasUnicas = response.data.filter(
        (rutinaPublica) =>
          !rutinasUsuario.some(
            (rutinaUser) => rutinaUser._id === rutinaPublica._id
          )
      );
      setRutinasPublicas(rutinasPublicasUnicas);
      setLoadingPublicas(false);
    } catch (error) {
      console.error("Error al obtener rutinas públicas:", error);
      setLoadingPublicas(false);
    }
  };

  const handleRutinaPress = (rutina) => {
    navigation.navigate("DetalleRutina", { rutina });
  };

  const getNivelIcon = (nivel) => {
    const filledStars = Array(nivel).fill("star");
    const emptyStars = Array(5 - nivel).fill("star-outline");
    return [...filledStars, ...emptyStars];
  };

  const renderRutinaItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleRutinaPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name="calendar-outline" size={40} color="#6200EE" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.rutinaName}>{item.nombre}</Text>

        <View style={styles.nivelContainer}>
          {getNivelIcon(item.nivel).map((icon, index) => (
            <Ionicons
              key={index}
              name={icon}
              size={16}
              color={icon === "star" ? "#FFC107" : "#BDBDBD"}
              style={styles.starIcon}
            />
          ))}
        </View>

        <Text style={styles.diasText}>
          {item.dias.length} {item.dias.length === 1 ? "día" : "días"}
        </Text>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#6200EE" />
            <Text style={styles.infoText}>
              {new Date(item.fechaCreacion).toLocaleDateString()}
            </Text>
          </View>

          {item.publica && (
            <View style={styles.publicBadge}>
              <Ionicons name="globe-outline" size={14} color="white" />
              <Text style={styles.publicText}>Pública</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={24}
        color="#9E9E9E"
        style={styles.arrow}
      />
    </TouchableOpacity>
  );

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
            <TouchableOpacity
              onPress={() => navigation.navigate("CrearRutina")}
            >
              <Ionicons name="add-circle" size={24} color="#6200EE" />
            </TouchableOpacity>
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
  card: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#F0E6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    padding: 15,
  },
  rutinaName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#212121",
  },
  nivelContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  diasText: {
    fontSize: 14,
    color: "#616161",
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#616161",
    marginLeft: 6,
  },
  publicBadge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  publicText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
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
