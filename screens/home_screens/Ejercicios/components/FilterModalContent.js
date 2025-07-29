import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Componente para los chips de filtro (ya memoizado)
const FilterChip = React.memo(({ label, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, isActive && styles.activeFilterChip]}
    onPress={onPress}
  >
    <Text
      style={[styles.filterChipText, isActive && styles.activeFilterChipText]}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
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
));

// Componente para renderizar una lista de chips para una sección
const FilterChipList = React.memo(
  ({ title, options, selectedOption, onToggle }) => {
    const chips = useMemo(() => {
      return options.map((option) => (
        <FilterChip
          key={option}
          label={option}
          isActive={selectedOption === option}
          onPress={() => onToggle(option)}
        />
      ));
    }, [options, selectedOption, onToggle]);

    return (
      <>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        <View style={styles.filterOptionsContainer}>{chips}</View>
      </>
    );
  }
);

const FilterModalContent = ({
  onClose,
  tempFilters,
  niveles,
  categorias,
  equipos,
  musculos,
  toggleFilter,
  hasActiveTempFilters,
  clearTempFilters,
  onApply,
}) => {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity
            onPress={() => {
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScrollView}>
          <FilterChipList
            title="Nivel"
            options={niveles}
            selectedOption={tempFilters.nivel}
            onToggle={(value) => toggleFilter("nivel", value)}
          />
          <FilterChipList
            title="Categoría"
            options={categorias}
            selectedOption={tempFilters.categoria}
            onToggle={(value) => toggleFilter("categoria", value)}
          />
          <FilterChipList
            title="Equipo"
            options={equipos}
            selectedOption={tempFilters.equipo}
            onToggle={(value) => toggleFilter("equipo", value)}
          />
          <FilterChipList
            title="Músculo"
            options={musculos}
            selectedOption={tempFilters.musculo}
            onToggle={(value) => toggleFilter("musculo", value)}
          />
        </ScrollView>

        <View style={styles.modalFooter}>
          {hasActiveTempFilters() && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearTempFilters}
            >
              <Text style={styles.clearButtonText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.applyButton} onPress={onApply}>
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default React.memo(FilterModalContent);

const styles = StyleSheet.create({
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
  filterChip: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 4,
    marginBottom:4,
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
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
});
