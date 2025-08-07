import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FilterModalContent from "../../Ejercicios/components/FilterModalContent";
import { useFiltrosEjercicios } from "../../../../hooks/useFiltrosEjercicios";

export default function DiaEntrenamientoEditor({
  dia,
  ejerciciosDisponibles,
  onDiaChange,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedEjercicio, setSelectedEjercicio] = useState(null);
  const [editingEjercicioIndex, setEditingEjercicioIndex] = useState(null);
  const [ejerciciosAsignados, setEjerciciosAsignados] = useState(
  () => (dia?.ejercicios || []).map(cfg => ({
    ...cfg,
    ejercicio:
      typeof cfg.ejercicio === "object"
        ? (cfg.ejercicio.id || cfg.ejercicio._id)
        : cfg.ejercicio,
  }))
);

  // Filter states
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

  // Exercise config states
  const [series, setSeries] = useState("3");
  const [repeticiones, setRepeticiones] = useState("12");
  const [descanso, setDescanso] = useState("60");
  const [peso, setPeso] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Build lookup maps for available exercises
  const { ejerciciosPorId, ejerciciosPorObjectId } = useMemo(() => {
    const byId = {};
    const byObjectId = {};
    ejerciciosDisponibles.forEach((ej) => {
      byId[ej.id] = ej;
      if (ej._id) byObjectId[ej._id] = ej;
    });
    return { ejerciciosPorId: byId, ejerciciosPorObjectId: byObjectId };
  }, [ejerciciosDisponibles]);

  const findEjercicioByAnyId = useCallback(
    (ejercicioId) =>
      ejerciciosPorId[ejercicioId] ||
      ejerciciosPorObjectId[ejercicioId] ||
      null,
    [ejerciciosPorId, ejerciciosPorObjectId]
  );

  // Apply filters hook
  const filteredEjercicios = useFiltrosEjercicios(
    ejerciciosDisponibles,
    appliedFilters,
    searchTerm
  );

  const mostrarEjercicios = () => {
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    setSelectedEjercicio(null);
    setEditingEjercicioIndex(null);
    setSeries("3");
    setRepeticiones("12");
    setDescanso("60");
    setPeso("");
    setSearchTerm("");
    setTempFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
  };

  const toggleFilter = useCallback((type, value) => {
    setTempFilters((prev) => ({
      ...prev,
      [type]: prev[type] === value ? null : value,
    }));
  }, []);

  const clearTempFilters = useCallback(() => {
    setTempFilters({
      nivel: null,
      categoria: null,
      equipo: null,
      musculo: null,
    });
  }, []);

  const hasActiveTempFilters = useCallback(
    () => Object.values(tempFilters).some((f) => f !== null),
    [tempFilters]
  );

  const handleSelectEjercicio = (ejercicio) => setSelectedEjercicio(ejercicio);

  const handleConfirmSelection = () => {
    if (!selectedEjercicio) return;
    const idValue = selectedEjercicio.id || selectedEjercicio._id;
    const config = {
      ejercicio: idValue,
      series: parseInt(series, 10),
      repeticiones: parseInt(repeticiones, 10),
      descanso: parseInt(descanso, 10),
      peso: peso ? parseFloat(peso) : null,
    };
    const updated = [...ejerciciosAsignados];
    if (editingEjercicioIndex !== null) updated[editingEjercicioIndex] = config;
    else updated.push(config);
    setEjerciciosAsignados(updated);
    onDiaChange({ ...dia, ejercicios: updated });
    setModalVisible(false);
    resetForm();
  };

  const handleEditEjercicio = (index) => {
    const cfg = ejerciciosAsignados[index];
    const data = findEjercicioByAnyId(cfg.ejercicio);
    setSelectedEjercicio(data);
    setSeries(cfg.series.toString());
    setRepeticiones(cfg.repeticiones.toString());
    setDescanso(cfg.descanso.toString());
    setPeso(cfg.peso?.toString() || "");
    setEditingEjercicioIndex(index);
    setModalVisible(true);
  };

  const handleRemoveEjercicio = (index) => {
    const updated = ejerciciosAsignados.filter((_, i) => i !== index);
    setEjerciciosAsignados(updated);
    onDiaChange({ ...dia, ejercicios: updated });
  };

  const renderModalItem = ({ item }) => {
    const isSelected =
      selectedEjercicio?.id === item.id || selectedEjercicio?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
        onPress={() => handleSelectEjercicio(item)}
      >
        <View style={styles.modalItemContent}>
          {item.imagenes?.[0] ? (
            <Image
              source={{ uri: item.imagenes[0] }}
              style={styles.modalItemImage}
            />
          ) : (
            <View style={styles.modalItemImagePlaceholder}>
              <Ionicons name="barbell-outline" size={24} color="#BDBDBD" />
            </View>
          )}
          <View style={styles.modalItemText}>
            <Text style={styles.modalItemTitle}>{item.nombre}</Text>
            <Text style={styles.modalItemSubtitle}>
              {item.musculosPrimarios?.[0] || ""} - {item.categoria || ""}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#6200EE" />
        )}
      </TouchableOpacity>
    );
  };

  const renderAssignedExerciseItem = ({ item, index }) => {
    const data = findEjercicioByAnyId(item.ejercicio);
    const img = data?.imagenes?.[0];
    return (
      <View style={styles.assignedItem}>
        <View style={styles.assignedItemContent}>
          {img ? (
            <Image source={{ uri: img }} style={styles.assignedItemImage} />
          ) : (
            <View style={styles.assignedItemImagePlaceholder}>
              <Ionicons name="barbell-outline" size={24} color="#BDBDBD" />
            </View>
          )}
          <View style={styles.assignedItemText}>
            <Text style={styles.assignedItemTitle}>{data?.nombre || ""}</Text>
            <Text style={styles.assignedItemSubtitle}>
              {item.series} series x {item.repeticiones} reps
              {item.peso ? ` | ${item.peso} kg` : ""}
            </Text>
          </View>
        </View>
        <View style={styles.assignedItemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditEjercicio(index)}
          >
            <Ionicons name="create-outline" size={20} color="#6200EE" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemoveEjercicio(index)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMainModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setModalVisible(false);
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedEjercicio
                ? editingEjercicioIndex !== null
                  ? "Editar ejercicio"
                  : "Configurar ejercicio"
                : "Seleccionar ejercicio"}
            </Text>
            {!selectedEjercicio && (
              <TouchableOpacity
                style={styles.filterButtonModal}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="filter-outline" size={20} color="#6200EE" />
                <Text style={styles.filterButtonText}>Filtros</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#616161" />
            </TouchableOpacity>
          </View>
          {selectedEjercicio ? (
            <View style={styles.configContainer}>
              <Text style={styles.configTitle}>
                Configuración del ejercicio
              </Text>
              <Text style={styles.selectedExerciseTitle}>
                {selectedEjercicio.nombre}
              </Text>
              <View style={styles.configRow}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Series</Text>
                  <TextInput
                    style={styles.configInput}
                    value={series}
                    onChangeText={setSeries}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Repeticiones</Text>
                  <TextInput
                    style={styles.configInput}
                    value={repeticiones}
                    onChangeText={setRepeticiones}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.configRow}>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Descanso (seg)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={descanso}
                    onChangeText={setDescanso}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.configItem}>
                  <Text style={styles.configLabel}>Peso (kg)</Text>
                  <TextInput
                    style={styles.configInput}
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="numeric"
                    placeholder="Opcional"
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmSelection}
              >
                <Text style={styles.confirmButtonText}>
                  {editingEjercicioIndex !== null
                    ? "Actualizar ejercicio"
                    : "Añadir ejercicio"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color="#757575"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar ejercicio..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
              {hasActiveTempFilters() && (
                <View style={styles.activeFiltersContainer}>
                  <Text style={styles.activeFiltersText}>
                    Filtros activos:{" "}
                  </Text>
                  {tempFilters.nivel && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>
                        {tempFilters.nivel}
                      </Text>
                    </View>
                  )}
                  {tempFilters.categoria && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>
                        {tempFilters.categoria}
                      </Text>
                    </View>
                  )}
                  {tempFilters.equipo && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>
                        {tempFilters.equipo}
                      </Text>
                    </View>
                  )}
                  {tempFilters.musculo && (
                    <View style={styles.activeFilterBadge}>
                      <Text style={styles.activeFilterText}>
                        {tempFilters.musculo}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={clearTempFilters}>
                    <Text style={styles.clearFiltersText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>
              )}
              {filteredEjercicios.length > 0 ? (
                <FlatList
                  data={filteredEjercicios}
                  renderItem={renderModalItem}
                  keyExtractor={(item) => item.id || item._id}
                  style={styles.exerciseList}
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
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{dia?.nombre}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.showExercisesButton}
          onPress={mostrarEjercicios}
        >
          <Ionicons name="barbell-outline" size={20} color="#6200EE" />
          <Text style={styles.showExercisesButtonText}>Mostrar ejercicios</Text>
        </TouchableOpacity>
      </View>
      {ejerciciosAsignados.length > 0 ? (
        <FlatList
          data={ejerciciosAsignados}
          renderItem={renderAssignedExerciseItem}
          keyExtractor={(_, i) => `aj-${i}`}
          contentContainerStyle={styles.assignedListContainer}
          scrollEnabled={false}
          nestedScrollEnabled
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="fitness-outline" size={64} color="#BDBDBD" />
          <Text style={styles.emptyText}>No hay ejercicios asignados</Text>
          <Text style={styles.emptySubtext}>
            Agrega ejercicios para completar tu entrenamiento
          </Text>
        </View>
      )}
      {renderMainModal()}
      {filterModalVisible && (
        <Modal
          visible
          animationType="slide"
          transparent
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <FilterModalContent
            onClose={() => setFilterModalVisible(false)}
            tempFilters={tempFilters}
            niveles={["principiante", "intermedio", "experto"]}
            categorias={[
              "fortaleza",
              "estiramiento",
              "pliométricos",
              "levantamiento de pesas",
              "levantamiento de pesas olímpico",
              "cardiovascular",
            ]}
            equipos={[
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
            ]}
            musculos={[
              "cuádriceps",
              "bíceps",
              "tríceps",
              "isquiotibiales",
              "pantorrillas",
              "antebrazo",
              "espalda media",
              "espalda baja",
              "abdominales",
              "aductores",
              "hombros",
              "glúteos",
              "trampas",
              "pecho",
            ]}
            toggleFilter={toggleFilter}
            hasActiveTempFilters={hasActiveTempFilters}
            clearTempFilters={clearTempFilters}
            onApply={() => {
              setAppliedFilters(tempFilters);
              setFilterModalVisible(false);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  showExercisesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F0E6FF",
    borderRadius: 8,
    justifyContent: "center",
    minWidth: "80%",
  },
  showExercisesButtonText: {
    marginLeft: 8,
    color: "#6200EE",
    fontWeight: "bold",
    fontSize: 16,
  },
  filterButtonModal: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#F0E6FF",
    borderRadius: 8,
    marginRight: 12,
  },
  filterButtonText: {
    marginLeft: 4,
    color: "#6200EE",
    fontWeight: "500",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activeFiltersText: {
    fontSize: 14,
    color: "#757575",
    marginRight: 8,
  },
  activeFilterBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterText: {
    color: "#388E3C",
    fontSize: 12,
  },
  clearFiltersText: {
    color: "#F44336",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BDBDBD",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BDBDBD",
    marginTop: 8,
    textAlign: "center",
  },
  assignedListContainer: {
    paddingBottom: 16,
  },
  assignedItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  assignedItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  assignedItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  assignedItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  assignedItemText: {
    flex: 1,
  },
  assignedItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  assignedItemSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  assignedItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  exerciseList: {
    maxHeight: "70%",
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemSelected: {
    backgroundColor: "#F0E6FF",
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  modalItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  configContainer: {
    padding: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  selectedExerciseTitle: {
    fontSize: 18,
    color: "#6200EE",
    marginBottom: 16,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  configItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  configLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  configInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 10,
  },
  confirmButton: {
    backgroundColor: "#6200EE",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  noResultsContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#BDBDBD",
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#BDBDBD",
    marginTop: 8,
    textAlign: "center",
  },
});
