import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import FilterModalContent from "./components/FilterModalContent";
import { fetchEjercicios } from "../../../services/ejerciciosPeticiones";
import { useFiltrosEjercicios } from "../../../hooks/useFiltrosEjercicios";
import { EjercicioItem } from "./components/EjercicioItem";
import { HeaderEjercicios } from "./components/HeaderEjercicios";

export default function EjerciciosScreen() {
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    nivel: null,
    categoria: null,
    equipo: null,
    musculo: null,
  });
  const [tempFilters, setTempFilters] = useState({
    nivel: null,
    categoria: null,
    equipo: null,
    musculo: null,
  });

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
    const obtenerEjercicios = async () => {
      const { ejercicios, loading } = await fetchEjercicios();
      setEjercicios(ejercicios);
      setLoading(loading);
    };
    obtenerEjercicios();
  }, []);

  const filteredEjercicios = useFiltrosEjercicios(
    ejercicios,
    appliedFilters,
    searchText
  );

  const toggleFilter = useCallback((type, value) => {
    setTempFilters((prevFilters) => ({
      ...prevFilters,
      [type]: prevFilters[type] === value ? null : value,
    }));
  }, []);

  const clearFilters = () => {
    setAppliedFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
    setTempFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
  };

  const clearTempFilters = useCallback(() => {
    setTempFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
  }, []);

  const hasActiveFilters = () => {
    return Object.values(appliedFilters).some((filter) => filter !== null);
  };
  const hasActiveTempFilters = useCallback(() => {
    return Object.values(tempFilters).some((filter) => filter !== null);
  }, [tempFilters]);

  const memoizedFilterModal = useMemo(
    () => (
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <FilterModalContent
          onClose={() => setIsFilterModalVisible(false)}
          tempFilters={tempFilters}
          niveles={niveles}
          categorias={categorias}
          equipos={equipos}
          musculos={musculos}
          toggleFilter={toggleFilter}
          hasActiveTempFilters={hasActiveTempFilters}
          clearTempFilters={clearTempFilters}
          onApply={() => {
            setAppliedFilters(tempFilters);
            setIsFilterModalVisible(false);
          }}
        />
      </Modal>
    ),
    [
      isFilterModalVisible,
      tempFilters,
      niveles,
      categorias,
      equipos,
      musculos,
      toggleFilter,
      hasActiveTempFilters,
      clearTempFilters,
    ]
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
      <View style={styles.container}>
        {/* Header con título y búsqueda */}
        <HeaderEjercicios
          hasActiveFilters={hasActiveFilters}
          appliedFilters={appliedFilters}
          toggleFilter={toggleFilter}
          setIsFilterModalVisible={setIsFilterModalVisible}
          setAppliedFilters={setAppliedFilters}
          setSearchText={setSearchText}
          clearFilters={clearFilters}
          resultsCount={filteredEjercicios.length}
        />
        {/* Lista de ejercicios */}
        {filteredEjercicios.length > 0 ? (
          <FlatList
            data={filteredEjercicios}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={<View style={styles.listHeader} />}
            ListFooterComponent={<View style={styles.listFooter} />}
            renderItem={({ item }) => <EjercicioItem item={item} />}
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
      {memoizedFilterModal}
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
});
