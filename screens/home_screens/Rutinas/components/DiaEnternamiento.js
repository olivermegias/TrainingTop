import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function DiaEntrenamiento({
  dia,
  index,
  ejerciciosData,
}) {
  const [expandedDia, setExpandedDia] = useState(false);

  const toggleDia = (index) => {
    setExpandedDia(expandedDia === index ? null : index);
  };

  const getEjercicioNombre = (ejercicioId) => {
    if (ejerciciosData[ejercicioId]) {
      return ejerciciosData[ejercicioId].nombre;
    }
    return "Cargando...";
  };

  return (
    <View key={index} style={styles.diaCard}>
      <TouchableOpacity
        style={styles.diaHeader}
        onPress={() => toggleDia(index)}
        activeOpacity={0.7}
      >
        <Text style={styles.diaTitle}>{dia.nombre}</Text>
        <Ionicons
          name={expandedDia === index ? "chevron-up" : "chevron-down"}
          size={24}
          color="#6200EE"
        />
      </TouchableOpacity>

      {expandedDia === index && (
        <View style={styles.ejerciciosList}>
          {dia.ejercicios.map((ejercicio, ejIndex) => (
            <View key={ejIndex} style={styles.ejercicioItem}>
              <View style={styles.ejercicioRow}>
                {ejerciciosData[ejercicio.ejercicio]?.imagenes?.[0] ? (
                  <Image
                    source={{
                      uri: ejerciciosData[ejercicio.ejercicio].imagenes[0],
                    }}
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
                  <Text style={styles.ejercicioNombre}>
                    {getEjercicioNombre(ejercicio.ejercicio)}
                  </Text>
                  <View style={styles.ejercicioDetalles}>
                    <View style={styles.detalleItem}>
                      <Ionicons
                        name="repeat-outline"
                        size={16}
                        color="#6200EE"
                      />
                      <Text style={styles.detalleText}>
                        {ejercicio.series} x {ejercicio.repeticiones}
                      </Text>
                    </View>

                    {ejercicio.descanso && (
                      <View style={styles.detalleItem}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="#6200EE"
                        />
                        <Text style={styles.detalleText}>
                          {ejercicio.descanso}s descanso
                        </Text>
                      </View>
                    )}

                    {ejercicio.peso && (
                      <View style={styles.detalleItem}>
                        <Ionicons
                          name="barbell-outline"
                          size={16}
                          color="#6200EE"
                        />
                        <Text style={styles.detalleText}>
                          {ejercicio.peso} kg
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
    diaCard: {
        backgroundColor: "white",
        borderRadius: 12,
        marginBottom: 15,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      diaHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        backgroundColor: "#F9F5FF",
      },
      diaTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#212121",
      },
      ejerciciosList: {
        padding: 15,
      },
      ejercicioItem: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
      },
      ejercicioNombre: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#212121",
        marginBottom: 8,
      },
      ejercicioDetalles: {
        marginLeft: 10,
      },
      detalleItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
      },
      detalleText: {
        fontSize: 14,
        color: "#616161",
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
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
      },
      ejercicioRow: {
        flexDirection: "row",
        alignItems: "center",
      },
      ejercicioContent: {
        flex: 1,
      },

});