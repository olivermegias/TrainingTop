import { useState, useEffect } from "react";

export function useFiltrosEjercicios(ejercicios, appliedFilters, searchText) {
  const [filteredEjercicios, setFilteredEjercicios] = useState(ejercicios);

  useEffect(() => {
    let results = [...ejercicios];

    // Filtrado por texto de búsqueda
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

    // Aplicar filtros específicos
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
  }, [ejercicios, appliedFilters, searchText]);

  return filteredEjercicios;
}