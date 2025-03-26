import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";

const API_URL_ANDROID = "http://10.0.2.2:5005";
const API_URL_WEB = "http://localhost:5005";

const API_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB;

export default function EjerciciosScreen() {
  const [ejercicios, setEjercicios] = useState([]);
  const [filteredEjercicios, setFilteredEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    nivel: null,
    categoria: null,
    equipo: null,
    musculo: null,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    nivel: null,
    categoria: null,
    equipo: null,
    musculo: null,
  });
  const navigation = useNavigation();

  // Opciones para los filtros (exactamente como están en la base de datos)
  const niveles = ["principiante", "intermedio", "experto"];
  const categorias = [
    "fortaleza",
    "estiramiento",
    "pliométricos",
    "levantamiento de pesas",
    "levantamiento de pesas olímpico",
    "cardiovascular",
  ];
  const equipos = [
    "mancuerna",
    "cable",
    "solo cuerpo",
    "pesas rusas",
    "máquinas",
    "balón medicinal",
    "bandas",
    "barra curl con forma de e-z",
    "pelota de ejercicio",
    "otro",
  ];
  const musculos = [
    "cuádriceps",
    "bíceps",
    "tríceps",
    "isquiotibiales",
    "Las pantorrillas",
    "antebrazo",
    "espalda media",
    "espalda baja",
    "abdominales",
    "aductores",
    "hombros",
    "glúteos",
    "trampas",
  ];

  useEffect(() => {
    fetchEjercicios();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appliedFilters, clea]); 

  const fetchEjercicios = async () => {
    try {
      const response = await axios.get(`${API_URL}/ejercicios`);
      setEjercicios(response.data);
      setFilteredEjercicios(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener ejercicios:", error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let results = [...ejercicios];

    if (searchText.trim() !== "") {
      const searchLower = searchText.toLowerCase();
      results = results.filter(
        (ejercicio) =>
          ejercicio.nombre.toLowerCase().includes(searchLower) ||
          (ejercicio.categoria &&
            ejercicio.categoria.toLowerCase().includes(searchLower)) ||
          (ejercicio.musculosPrimarios &&
            ejercicio.musculosPrimarios.some((m) =>
              m.toLowerCase().includes(searchLower)
            )) ||
          (ejercicio.musculosSecundarios &&
            ejercicio.musculosSecundarios.some((m) =>
              m.toLowerCase().includes(searchLower)
            ))
      );
    }

    // Aplicar los filtros solo cuando se presione "Aplicar"
    if (appliedFilters.nivel) {
      results = results.filter(
        (ejercicio) => ejercicio.nivel === appliedFilters.nivel
      );
    }

    if (appliedFilters.categoria) {
      results = results.filter(
        (ejercicio) => ejercicio.categoria === appliedFilters.categoria
      );
    }

    if (appliedFilters.equipo) {
      results = results.filter(
        (ejercicio) => ejercicio.equipo === appliedFilters.equipo
      );
    }

    if (appliedFilters.musculo) {
      results = results.filter(
        (ejercicio) =>
          ejercicio.musculosPrimarios &&
          ejercicio.musculosPrimarios.includes(appliedFilters.musculo)
      );
    }

    setFilteredEjercicios(results);
  };

  // Debounce la búsqueda para mejorar rendimiento
  const debouncedSearch = useCallback(
    debounce((text) => {
      setSearchText(text);
    }, 300),
    []
  );

  const handleEjercicioPress = (ejercicio) => {
    navigation.navigate("DetallesEjercicio", { ejercicio });
  };

  const getNivelColor = (nivel) => {
    switch (nivel.toLowerCase()) {
      case "principiante":
        return "#4CAF50"; // Verde
      case "intermedio":
        return "#FFC107"; // Amarillo
      case "experto":
        return "#F44336"; // Rojo
      default:
        return "#9E9E9E"; // Gris
    }
  };

  const toggleFilter = (type, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: prevFilters[type] === value ? null : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
    applyFilters();
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some((filter) => filter !== null);
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Componente para los chips de filtro
  const FilterChip = ({ label, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
      >
        {capitalizeFirstLetter(label)}
      </Text>
      {isActive && (
        <Ionicons
          name="close-circle"
          size={16}
          color="white"
          style={styles.chipCloseIcon}
        />
      )}
    </TouchableOpacity>
  );

  // Modal de filtros
  const FilterModal = () => (
    <Modal
      visible={isFilterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#212121" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Sección de nivel */}
            <Text style={styles.filterSectionTitle}>Nivel</Text>
            <View style={styles.filterOptionsContainer}>
              {niveles.map((nivel) => (
                <FilterChip
                  key={nivel}
                  label={nivel}
                  isActive={filters.nivel === nivel}
                  onPress={() => toggleFilter("nivel", nivel)}
                />
              ))}
            </View>

            {/* Sección de categoría */}
            <Text style={styles.filterSectionTitle}>Categoría</Text>
            <View style={styles.filterOptionsContainer}>
              {categorias.map((categoria) => (
                <FilterChip
                  key={categoria}
                  label={categoria}
                  isActive={filters.categoria === categoria}
                  onPress={() => toggleFilter("categoria", categoria)}
                />
              ))}
            </View>

            {/* Sección de equipo */}
            <Text style={styles.filterSectionTitle}>Equipo</Text>
            <View style={styles.filterOptionsContainer}>
              {equipos.map((equipo) => (
                <FilterChip
                  key={equipo}
                  label={equipo}
                  isActive={filters.equipo === equipo}
                  onPress={() => toggleFilter("equipo", equipo)}
                />
              ))}
            </View>

            {/* Sección de músculos */}
            <Text style={styles.filterSectionTitle}>Músculo</Text>
            <View style={styles.filterOptionsContainer}>
              {musculos.map((musculo) => (
                <FilterChip
                  key={musculo}
                  label={musculo}
                  isActive={filters.musculo === musculo}
                  onPress={() => toggleFilter("musculo", musculo)}
                />
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {hasActiveFilters() && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpiar filtros</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setAppliedFilters(filters); // Guardar los filtros seleccionados
                applyFilters(); // Aplicar los filtros con los valores nuevos
                setIsFilterModalVisible(false); // Cerrar modal
              }}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>Cargando ejercicios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        {/* Header con título y búsqueda */}
        <View style={styles.header}>
          <Text style={styles.title}>Ejercicios</Text>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#757575"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ejercicios..."
              onChangeText={debouncedSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}>
              <Ionicons
                name="options"
                size={20}
                color={hasActiveFilters() ? "#6200EE" : "#757575"}
                style={styles.filterIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Chips de filtros activos */}
          {hasActiveFilters() && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.activeFiltersContainer}
              contentContainerStyle={styles.activeFiltersContent}
            >
              {filters.nivel && (
                <FilterChip
                  label={filters.nivel}
                  isActive={true}
                  onPress={() => toggleFilter("nivel", filters.nivel)}
                />
              )}
              {filters.categoria && (
                <FilterChip
                  label={filters.categoria}
                  isActive={true}
                  onPress={() => toggleFilter("categoria", filters.categoria)}
                />
              )}
              {filters.equipo && (
                <FilterChip
                  label={filters.equipo}
                  isActive={true}
                  onPress={() => toggleFilter("equipo", filters.equipo)}
                />
              )}
              {filters.musculo && (
                <FilterChip
                  label={filters.musculo}
                  isActive={true}
                  onPress={() => toggleFilter("musculo", filters.musculo)}
                />
              )}

              {hasActiveFilters() && (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearAllText}>Limpiar todos</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Contador de resultados */}
          <Text style={styles.resultsCount}>
            {filteredEjercicios.length}{" "}
            {filteredEjercicios.length === 1 ? "ejercicio" : "ejercicios"}{" "}
            encontrados
          </Text>
        </View>

        {/* Lista de ejercicios */}
        {filteredEjercicios.length > 0 ? (
          <FlatList
            data={filteredEjercicios}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<View style={styles.listHeader} />}
            ListFooterComponent={<View style={styles.listFooter} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleEjercicioPress(item)}
                activeOpacity={0.7}
              >
                {item.imagenes && item.imagenes.length > 0 ? (
                  <Image
                    source={{ uri: item.imagenes[0] }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons
                      name="barbell-outline"
                      size={50}
                      color="#BDBDBD"
                    />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.exerciseName}>{item.nombre}</Text>

                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: getNivelColor(item.nivel) },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {capitalizeFirstLetter(item.nivel)}
                      </Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {capitalizeFirstLetter(item.categoria)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="fitness-outline"
                        size={16}
                        color="#6200EE"
                      />
                      <Text style={styles.infoText}>
                        {item.fuerza
                          ? capitalizeFirstLetter(item.fuerza)
                          : "No especificado"}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="construct-outline"
                        size={16}
                        color="#6200EE"
                      />
                      <Text style={styles.infoText}>
                        {item.equipo
                          ? capitalizeFirstLetter(item.equipo)
                          : "No especificado"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#9E9E9E"
                  style={styles.arrow}
                />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#BDBDBD" />
            <Text style={styles.noResultsText}>
              No se encontraron ejercicios
            </Text>
            <Text style={styles.noResultsSubtext}>
              Intenta con otros términos de búsqueda o filtros
            </Text>
            {hasActiveFilters() && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={clearFilters}
              >
                <Text style={styles.resetButtonText}>Restablecer filtros</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Modal de filtros */}
      <FilterModal />
    </SafeAreaView>
  );
}

// Estilos mejorados con búsqueda y filtros
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
    padding: 15,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#6200EE",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    padding: 0,
  },
  filterIcon: {
    marginLeft: 8,
    padding: 4,
  },
  activeFiltersContainer: {
    marginBottom: 10,
  },
  activeFiltersContent: {
    paddingRight: 10,
  },
  filterChip: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  activeFilterChip: {
    backgroundColor: "#6200EE",
  },
  filterChipText: {
    fontSize: 14,
    color: "#424242",
  },
  activeFilterChipText: {
    color: "white",
  },
  chipCloseIcon: {
    marginLeft: 4,
  },
  clearAllButton: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6200EE",
  },
  clearAllText: {
    color: "#6200EE",
    fontSize: 14,
  },
  resultsCount: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 5,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  listHeader: {
    height: 10,
  },
  listFooter: {
    height: 80,
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
  cardContent: {
    flex: 1,
    padding: 15,
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#212121",
  },
  badgeContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  infoContainer: {
    flexDirection: "column",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#616161",
    marginLeft: 6,
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#424242",
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
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
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  modalScrollView: {
    paddingHorizontal: 16,
    maxHeight: 500,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginTop: 16,
    marginBottom: 12,
  },
  filterOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  clearButtonText: {
    color: "#6200EE",
    fontWeight: "bold",
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: "#6200EE",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
