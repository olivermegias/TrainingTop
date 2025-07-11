import { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { fetchUsuarioByUid } from "../../services/usuarioPeticiones";

export default function Perfil() {
  const { user, cerrarSesion } = useContext(AuthContext); // Obtener usuario desde Firebase
  const [nombre, setNombre] = useState(""); // Estado para el nombre del usuario desde MongoDB
  const [loading, setLoading] = useState(true); // Estado de carga
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setNombre(user.nombre);
    setLoading(false);
  }, [user]);

  const toggleModal = () => setModalVisible(!modalVisible);

  const confirmAction = async () => {
    try {
      await cerrarSesion(); // Llama a la función del contexto
      toggleModal(); // Cierra el modal
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.logout_button} onPress={toggleModal}>
        <Ionicons name="log-out" size={40} color="black" />
      </Pressable>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar acción</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas cerrar sesión?
            </Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={toggleModal}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton]}
                onPress={confirmAction}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mostrar loader mientras se carga el nombre */}
      {loading ? (
        <ActivityIndicator size="large" color="white" />
      ) : (
        <Text style={styles.welcomeText}>
          ¡Bienvenido, {nombre || "Usuario"}!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "darkgray",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
  },
  logout_button: {
    position: "absolute",
    top: 40,
    right: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalMessage: { fontSize: 16, marginBottom: 20 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  cancelButton: { backgroundColor: "red", marginRight: 10 },
  confirmButton: { backgroundColor: "green" },
});
