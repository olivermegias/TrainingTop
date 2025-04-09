// RutinaItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const RutinaItem = ({ item }) => {
  const navigation = useNavigation();
  
  const handleRutinaPress = (rutina) => {
    navigation.navigate("DetalleRutina", { rutina });
  };

  const getNivelIcon = (nivel) => {
    const filledStars = Array(nivel).fill("star");
    const emptyStars = Array(5 - nivel).fill("star-outline");
    return [...filledStars, ...emptyStars];
  };

  return (
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
};

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
  arrow: {
    marginRight: 12,
  },
});

export default RutinaItem;
