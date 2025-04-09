// components/HeaderEjercicios.js

import React, {useCallback} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";

const FilterChip = ({ label, isActive, onPress }) => (
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
);

export function HeaderEjercicios({
  hasActiveFilters,
  appliedFilters,
  toggleFilter,
  setIsFilterModalVisible,
  clearFilters,
  resultsCount,
}) {
  const debouncedSearch = useCallback(
    debounce((text) => {
      setSearchText(text);
    }, 300),
    []
  );

  const toggleAppliedFilter = useCallback((type, value) => {
    setAppliedFilters((prevFilters) => ({
      ...prevFilters,
      [type]: prevFilters[type] === value ? null : value,
    }));
  }, []);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>Ejercicios</Text>

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

      {hasActiveFilters() && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersContainer}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {appliedFilters.nivel && (
            <FilterChip
              label={appliedFilters.nivel}
              isActive={true}
              onPress={() => {
                toggleAppliedFilter("nivel", appliedFilters.nivel);
                toggleFilter("nivel", appliedFilters.nivel);
              }}
            />
          )}
          {appliedFilters.categoria && (
            <FilterChip
              label={appliedFilters.categoria}
              isActive={true}
              onPress={() => {
                toggleAppliedFilter("categoria", appliedFilters.categoria);
                toggleFilter("categoria", appliedFilters.categoria);
              }}
            />
          )}
          {appliedFilters.equipo && (
            <FilterChip
              label={appliedFilters.equipo}
              isActive={true}
              onPress={() =>
                toggleAppliedFilter("equipo", appliedFilters.equipo)
              }
            />
          )}
          {appliedFilters.musculo && (
            <FilterChip
              label={appliedFilters.musculo}
              isActive={true}
              onPress={() =>
                toggleAppliedFilter("musculo", appliedFilters.musculo)
              }
            />
          )}

          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearAllText}>Limpiar todos</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Text style={styles.resultsCount}>
        {resultsCount} {resultsCount === 1 ? "ejercicio" : "ejercicios"}{" "}
        encontrados
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
