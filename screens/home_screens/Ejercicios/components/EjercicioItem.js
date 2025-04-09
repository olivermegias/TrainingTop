import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export function EjercicioItem({ item }) {
  const navigation = useNavigation();

  const handleEjercicioPress = (ejercicio) => {
    navigation.navigate("DetallesEjercicio", { ejercicio });
  };

  const getNivelColor = (nivel) => {
    if (!nivel) {
        return "#9E9E9E"; // Gris por defecto si el nivel no está definido
      }
      
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

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <>
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
            <Ionicons name="barbell-outline" size={50} color="#BDBDBD" />
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
              <Ionicons name="fitness-outline" size={16} color="#6200EE" />
              <Text style={styles.infoText}>
                {item.fuerza
                  ? capitalizeFirstLetter(item.fuerza)
                  : "No especificado"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="construct-outline" size={16} color="#6200EE" />
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
