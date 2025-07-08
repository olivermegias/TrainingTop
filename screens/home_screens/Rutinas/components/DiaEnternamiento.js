import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function DiaEntrenamiento({ dia, index, ejerciciosData }) {
  const [expandedDia, setExpandedDia] = useState(false);

  // Crear índices de búsqueda por id personalizado y por _id de Mongo
  const { ejerciciosPorId, ejerciciosPorObjectId } = useMemo(() => {
    const byId = {};
    const byObjectId = {};
    Object.values(ejerciciosData).forEach(ej => {
      byId[ej.id] = ej;
      if (ej._id) byObjectId[ej._id] = ej;
    });
    return { ejerciciosPorId: byId, ejerciciosPorObjectId: byObjectId };
  }, [ejerciciosData]);

  // Normalizar la lista para asegurar que siempre sea string
  const ejerciciosList = useMemo(
    () =>
      (dia.ejercicios || []).map(cfg => ({
        ...cfg,
        ejercicio:
          typeof cfg.ejercicio === 'object'
            ? cfg.ejercicio.id || cfg.ejercicio._id
            : cfg.ejercicio,
      })),
    [dia.ejercicios]
  );

  const toggleDia = idx => {
    setExpandedDia(expandedDia === idx ? null : idx);
  };

  // Función que resuelve ejercicios por id o _id
  const findEjercicioByAnyId = ejercicioId =>
    ejerciciosPorId[ejercicioId] || ejerciciosPorObjectId[ejercicioId] || null;

  return (
    <View key={index} style={styles.diaCard}>
      <TouchableOpacity
        style={styles.diaHeader}
        onPress={() => toggleDia(index)}
        activeOpacity={0.7}
      >
        <Text style={styles.diaTitle}>{dia.nombre}</Text>
        <Ionicons
          name={expandedDia === index ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#6200EE"
        />
      </TouchableOpacity>

      {expandedDia === index && (
        <View style={styles.ejerciciosList}>
          {ejerciciosList.map((ej, ejIndex) => {
            const ejercicioData = findEjercicioByAnyId(ej.ejercicio);
            const imagen = ejercicioData?.imagenes?.[0];
            const nombre = ejercicioData?.nombre || 'Cargando...';

            return (
              <View key={ejIndex} style={styles.ejercicioItem}>
                <View style={styles.ejercicioRow}>
                  {imagen ? (
                    <Image
                      source={{ uri: imagen }}
                      style={styles.exerciseImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImagePlaceholder}>
                      <Ionicons
                        name="barbell-outline"
                        size={24}
                        color="#BDBDBD"
                      />
                    </View>
                  )}
                  <View style={styles.ejercicioContent}>
                    <Text style={styles.ejercicioNombre}>{nombre}</Text>
                    <View style={styles.ejercicioDetalles}>
                      <View style={styles.detalleItem}>
                        <Ionicons
                          name="repeat-outline"
                          size={16}
                          color="#6200EE"
                        />
                        <Text style={styles.detalleText}>
                          {ej.series} x {ej.repeticiones}
                        </Text>
                      </View>

                      {ej.descanso && (
                        <View style={styles.detalleItem}>
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#6200EE"
                          />
                          <Text style={styles.detalleText}>
                            {ej.descanso}s descanso
                          </Text>
                        </View>
                      )}

                      {ej.peso && (
                        <View style={styles.detalleItem}>
                          <Ionicons
                            name="barbell-outline"
                            size={16}
                            color="#6200EE"
                          />
                          <Text style={styles.detalleText}>
                            {ej.peso} kg
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diaCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F9F5FF',
  },
  diaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  ejerciciosList: {
    padding: 15,
  },
  ejercicioItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ejercicioNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  ejercicioDetalles: {
    marginLeft: 10,
  },
  detalleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detalleText: {
    fontSize: 14,
    color: '#616161',
    marginLeft: 8,
  },
  exerciseImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  noImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  ejercicioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ejercicioContent: {
    flex: 1,
  },
});
