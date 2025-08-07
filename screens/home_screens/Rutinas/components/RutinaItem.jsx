// RutinaItem.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const RutinaItem = ({ item, rutinaActiva }) => {
  const navigation = useNavigation();
  const esRutinaActiva = rutinaActiva === item._id;

  const handleRutinaPress = (rutina) => {
    navigation.navigate("DetalleRutina", { rutina });
  };

  const getNivelIcon = (nivel) => {
    const filledStars = Array(nivel).fill("star");
    const emptyStars = Array(5 - nivel).fill("star-outline");
    return [...filledStars, ...emptyStars];
  };

  // Función para obtener icono según el nivel de dificultad
  const getIcono = () => {
    const nivel = typeof item.nivel === "number" ? item.nivel : 3;

    switch (nivel) {
      case 1:
        return {
          name: "walk",
          color: "#4CAF50",
          backgroundColor: "#E8F5E9",
        };
      case 2:
        return {
          name: "bicycle",
          color: "#8BC34A",
          backgroundColor: "#F1F8E9",
        };
      case 3:
        return {
          name: "fitness",
          color: "#FF9800",
          backgroundColor: "#FFF3E0",
        };
      case 4:
        return {
          name: "barbell",
          color: "#FF5722",
          backgroundColor: "#FBE9E7",
        };
      case 5:
        return {
          name: "flame",
          color: "#F44336",
          backgroundColor: "#FFEBEE",
        };
      default:
        return {
          name: "fitness",
          color: "#6200EE",
          backgroundColor: "#F3E5F5",
        };
    }
  };

  const icono = getIcono();

  return (
    <TouchableOpacity
      style={[styles.card, esRutinaActiva && styles.cardActiva]}
      onPress={() => handleRutinaPress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.cardIconContainer,
          { backgroundColor: icono.backgroundColor },
        ]}
      >
        <Ionicons name={icono.name} size={36} color={icono.color} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.rutinaName,
              esRutinaActiva && styles.rutinaNameActiva,
            ]}
          >
            {item.nombre}
          </Text>
          {esRutinaActiva && (
            <View style={styles.activaBadge}>
              <Text style={styles.activaText}>ACTIVA</Text>
            </View>
          )}
        </View>

        <View style={styles.nivelContainer}>
          <Text style={styles.nivelLabel}>Nivel: </Text>
          {getNivelIcon(item.nivel).map((icon, index) => (
            <Ionicons
              key={index}
              name={icon}
              size={14}
              color={icon === "star" ? "#FFC107" : "#E0E0E0"}
              style={styles.starIcon}
            />
          ))}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.dias.length} {item.dias.length === 1 ? "día" : "días"}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          {item.publica && (
            <View style={styles.publicBadge}>
              <Ionicons name="globe-outline" size={12} color="#6200EE" />
              <Text style={styles.publicText}>Pública</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={esRutinaActiva ? "#6200EE" : "#BDBDBD"}
        style={styles.arrow}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex:1,
    backgroundColor: "white",
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardActiva: {
    borderColor: "#6200EE",
    borderWidth: 2,
    elevation: 6,
    shadowOpacity: 0.15,
  },
  cardIconContainer: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  rutinaName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212121",
    flex: 1,
  },
  rutinaNameActiva: {
    color: "#6200EE",
    fontWeight: "700",
  },
  activaBadge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  activaText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  nivelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  nivelLabel: {
    fontSize: 13,
    color: "#666",
    marginRight: 4,
  },
  starIcon: {
    marginRight: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
  },
  descripcion: {
    fontSize: 12,
    color: "#999",
    flex: 1,
    fontStyle: "italic",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  publicBadge: {
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  publicText: {
    color: "#6200EE",
    fontSize: 11,
    fontWeight: "600",
  },
  setActiveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#F5F3FF",
  },
  setActiveText: {
    fontSize: 11,
    color: "#6200EE",
    fontWeight: "600",
  },
  arrow: {
    marginRight: 12,
  },
});

export default RutinaItem;
