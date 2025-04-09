import React from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DetallesEjercicioScreen({ route, navigation }) {
  const { ejercicio } = route.params;
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.goBack();
  };

  const getNivelColor = (nivel) => {
    switch (nivel.toLowerCase()) {
      case "principiante":
        return "#4CAF50"; // Verde
      case "intermedio":
        return "#FFC107"; // Amarillo
      case "avanzado":
        return "#F44336"; // Rojo
      default:
        return "#9E9E9E"; // Gris
    }
  };

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="light-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 70 // Ajustar para tab navigator
        }}
      >
        {/* Header con la imagen */}
        <View style={styles.imageContainer}>
          {ejercicio.imagenes && ejercicio.imagenes.length > 0 ? (
            <Image 
              source={{ uri: ejercicio.imagenes[0] }} 
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="barbell-outline" size={80} color="#BDBDBD" />
            </View>
          )}
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top }]} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.imageOverlay} />
          <Text style={styles.headerTitle}>{ejercicio.nombre}</Text>
        </View>


        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: getNivelColor(ejercicio.nivel) }]}>
              <Text style={styles.badgeText}>{ejercicio.nivel}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ejercicio.categoria}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="fitness-outline" size={22} color="#6200EE" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Fuerza</Text>
                <Text style={styles.detailText}>{ejercicio.fuerza || "No especificado"}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={22} color="#6200EE" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Mecánica</Text>
                <Text style={styles.detailText}>{ejercicio.mecanica || "No especificado"}</Text>
              </View>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="construct-outline" size={22} color="#6200EE" />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Equipo</Text>
                <Text style={styles.detailText}>{ejercicio.equipo || "No especificado"}</Text>
              </View>
            </View>
          </View>

          {/* Músculos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Músculos Trabajados</Text>
            
            {/* Músculos primarios */}
            <View style={styles.musculoSection}>
              <Text style={styles.musculoTitle}>Primarios:</Text>
              <View style={styles.musculosList}>
                {ejercicio.musculosPrimarios && ejercicio.musculosPrimarios.length > 0 ? (
                  ejercicio.musculosPrimarios.map((musculo, index) => (
                    <View key={index} style={styles.musculoItem}>
                      <Ionicons name="body-outline" size={16} color="#6200EE" />
                      <Text style={styles.musculoText}>{musculo}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.notSpecified}>No especificados</Text>
                )}
              </View>
            </View>
            
            {/* Músculos secundarios */}
            <View style={styles.musculoSection}>
              <Text style={styles.musculoTitle}>Secundarios:</Text>
              <View style={styles.musculosList}>
                {ejercicio.musculosSecundarios && ejercicio.musculosSecundarios.length > 0 ? (
                  ejercicio.musculosSecundarios.map((musculo, index) => (
                    <View key={index} style={styles.musculoItem}>
                      <Ionicons name="body-outline" size={16} color="#9E9E9E" />
                      <Text style={styles.musculoText}>{musculo}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.notSpecified}>No especificados</Text>
                )}
              </View>
            </View>
          </View>

          {/* Instrucciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instrucciones</Text>
            {ejercicio.instrucciones && ejercicio.instrucciones.length > 0 ? (
              ejercicio.instrucciones.map((instruccion, index) => (
                <View key={index} style={styles.instruccionItem}>
                  <Text style={styles.instruccionNumero}>{index + 1}</Text>
                  <Text style={styles.instruccionText}>{instruccion}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.notSpecified}>No hay instrucciones disponibles</Text>
            )}
          </View>
          
          {/* Galería de imágenes */}
          {ejercicio.imagenes && ejercicio.imagenes.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Galería</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galeriaContainer}>
                {ejercicio.imagenes.map((imagen, index) => (
                  <Image 
                    key={index}
                    source={{ uri: imagen }} 
                    style={styles.galeriaImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#BDBDBD",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerTitle: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  backButton: {
    position: "absolute",
    left: 15,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  badgeContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  badge: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 10,
  },
  badgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 15,
    alignItems: "center",
  },
  detailTextContainer: {
    marginLeft: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  detailText: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 15,
  },
  musculoSection: {
    marginBottom: 15,
  },
  musculoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  musculosList: {
    marginLeft: 10,
  },
  musculoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  musculoText: {
    fontSize: 15,
    color: "#424242",
    marginLeft: 8,
  },
  instruccionItem: {
    flexDirection: "row",
    marginBottom: 12,
    paddingLeft: 10,
  },
  instruccionNumero: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#6200EE",
    color: "white",
    textAlign: "center",
    lineHeight: 25,
    fontWeight: "bold",
    marginRight: 12,
  },
  instruccionText: {
    flex: 1,
    fontSize: 15,
    color: "#424242",
    lineHeight: 22,
  },
  notSpecified: {
    fontSize: 15,
    color: "#9E9E9E",
    fontStyle: "italic",
  },
  galeriaContainer: {
    flexDirection: "row",
    marginLeft: -5,
  },
  galeriaImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginHorizontal: 5,
  }
});