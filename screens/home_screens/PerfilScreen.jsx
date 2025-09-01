import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-chart-kit";
import { AuthContext } from "../../context/AuthContext";
import {
  fetchUsuarioByUid,
  actualizarUsuario,
} from "../../services/usuarioPeticiones";
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { appFirebase } from "../../firebase";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function PerfilScreen() {
  const { user, cerrarSesion } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // Estados para edición
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [historialPeso, setHistorialPeso] = useState([]);

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [objetivoPeso, setObjetivoPeso] = useState("");
  const [objetivoModalVisible, setObjetivoModalVisible] = useState(false);

  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#6200EE");

      return () => {
        StatusBar.setBarStyle("dark-content");
        StatusBar.setBackgroundColor("#F5F5F5");
      };
    }, [])
  );

  useEffect(() => {
    cargarDatos();
  }, [user]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const userResult = await fetchUsuarioByUid(user.uid);
      if (userResult) {
        setUserData(userResult);
        setPeso(userResult.peso?.toString() || "");
        setAltura(userResult.altura?.toString() || "");
        setObjetivoPeso(userResult.objetivoPeso?.toString() || "");

        // Cargar historial de peso si existe
        if (userResult.historialPeso && userResult.historialPeso.length > 0) {
          const historialFormateado = userResult.historialPeso
            .map((item) => ({
              fecha: new Date(item.fecha),
              peso: item.peso,
              _id: item._id,
            }))
            .sort((a, b) => a.fecha - b.fecha);

          setHistorialPeso(historialFormateado);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del perfil");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const calcularIMC = () => {
    if (userData?.peso && userData?.altura) {
      const alturaMetros = userData.altura / 100;
      const imc = userData.peso / (alturaMetros * alturaMetros);
      return imc.toFixed(1);
    }
    return "--";
  };

  const interpretarIMC = (imc) => {
    if (imc < 18.5) return { texto: "Bajo peso", color: "#3498db" };
    if (imc < 25) return { texto: "Peso normal", color: "#27ae60" };
    if (imc < 30) return { texto: "Sobrepeso", color: "#f39c12" };
    return { texto: "Obesidad", color: "#e74c3c" };
  };

  const calcularPesoIdeal = () => {
    if (userData?.altura) {
      const alturaMetros = userData.altura / 100;
      const pesoIdealMin = 18.5 * alturaMetros * alturaMetros;
      const pesoIdealMax = 24.9 * alturaMetros * alturaMetros;
      return `${pesoIdealMin.toFixed(1)} - ${pesoIdealMax.toFixed(1)} kg`;
    }
    return "--";
  };

  const guardarDatosBasicos = async () => {
    try {
      const pesoNumerico = parseFloat(peso);
      const alturaNumerico = parseFloat(altura);

      if (isNaN(pesoNumerico) || isNaN(alturaNumerico)) {
        Alert.alert("Error", "Por favor ingresa valores numéricos válidos");
        return;
      }

      // Solo enviar los campos que queremos actualizar
      const datosActualizados = {
        peso: pesoNumerico,
        altura: alturaNumerico,
      };

      const resultado = await actualizarUsuario(user.uid, datosActualizados);

      if (resultado) {
        // Actualizar el estado local con la respuesta completa del servidor
        setUserData(resultado);
        setPeso(resultado.peso?.toString() || "");
        setAltura(resultado.altura?.toString() || "");

        // Actualizar historial si existe
        if (resultado.historialPeso && resultado.historialPeso.length > 0) {
          const historialFormateado = resultado.historialPeso
            .map((item) => ({
              fecha: new Date(item.fecha),
              peso: item.peso,
              _id: item._id,
            }))
            .sort((a, b) => a.fecha - b.fecha);

          setHistorialPeso(historialFormateado);
        }

        setEditModalVisible(false);
        Alert.alert("Éxito", "Datos actualizados correctamente");
      }
    } catch (error) {
      console.error("Error al guardar datos:", error);
      Alert.alert("Error", "No se pudieron actualizar los datos");
    }
  };

  const cambiarPassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPasswordLoading(true);

    try {
      const auth = getAuth(appFirebase);
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.email) {
        Alert.alert(
          "Error",
          "No se pudo obtener la información del usuario. Por favor, cierra sesión y vuelve a iniciar."
        );
        return;
      }

      // Re-autenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Cambiar la contraseña
      await updatePassword(currentUser, newPassword);

      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setPasswordModalVisible(false);

      // Limpiar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        Alert.alert("Error", "La contraseña actual es incorrecta");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "La nueva contraseña es muy débil");
      } else {
        Alert.alert("Error", "No se pudo cambiar la contraseña");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const confirmLogout = () => {
    setConfirmLogoutVisible(true);
  };

  const handleLogout = () => {
    setConfirmLogoutVisible(false);
    cerrarSesion();
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const calcularPromedioTiempoPorEntrenamiento = () => {
    if (
      userData?.estadisticas?.entrenamientosCompletados > 0 &&
      userData?.estadisticas?.tiempoTotalEntrenado > 0
    ) {
      const promedio =
        userData.estadisticas.tiempoTotalEntrenado /
        userData.estadisticas.entrenamientosCompletados;
      return Math.floor(promedio / 60);
    }
    return 0;
  };

  const calcularDiasActivo = () => {
    if (userData?.fechaRegistro) {
      const fechaRegistro = new Date(userData.fechaRegistro);
      const hoy = new Date();
      const diferencia = Math.floor(
        (hoy - fechaRegistro) / (1000 * 60 * 60 * 24)
      );
      return diferencia;
    }
    return 0;
  };

  const haAlcanzadoObjetivo = () => {
    if (!userData?.peso || !userData?.objetivoPeso) return false;

    const pesoActual = userData.peso;
    const objetivo = userData.objetivoPeso;
    const pesoInicial = userData.pesoInicialObjetivo || pesoActual;

    // Determinar la dirección del objetivo basándose en el peso inicial
    if (objetivo > pesoInicial) {
      // Objetivo era ganar peso
      return pesoActual >= objetivo;
    } else if (objetivo < pesoInicial) {
      // Objetivo era perder peso
      return pesoActual <= objetivo;
    } else {
      // El objetivo es igual al peso inicial
      return Math.abs(pesoActual - objetivo) < 0.5;
    }
  };

  // 2. Modificar guardarObjetivoPeso para SIEMPRE actualizar el peso inicial
  const guardarObjetivoPeso = async () => {
    try {
      const objetivoNumerico = parseFloat(objetivoPeso);

      if (isNaN(objetivoNumerico) || objetivoNumerico <= 0) {
        Alert.alert("Error", "Por favor ingresa un peso objetivo válido");
        return;
      }

      // SIEMPRE actualizar el peso inicial al peso actual cuando se cambia el objetivo
      const datosActualizados = {
        objetivoPeso: objetivoNumerico,
        pesoInicialObjetivo: userData.peso, // Siempre usar el peso actual como nuevo punto de partida
      };

      const resultado = await actualizarUsuario(user.uid, datosActualizados);

      if (resultado) {
        setUserData({
          ...userData,
          objetivoPeso: objetivoNumerico,
          pesoInicialObjetivo: userData.peso,
        });
        setObjetivoModalVisible(false);
        Alert.alert(
          "Éxito",
          "Objetivo actualizado correctamente. Tu progreso comienza desde tu peso actual."
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el objetivo");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      </SafeAreaView>
    );
  }

  const imc = calcularIMC();
  const estadoIMC = imc !== "--" ? interpretarIMC(parseFloat(imc)) : null;

  // Datos para la gráfica
  const chartData =
    historialPeso.length > 1
      ? {
        labels: historialPeso
          .slice(-6)
          .map((item) => formatearFecha(item.fecha)),
        datasets: [
          {
            data: historialPeso.slice(-6).map((item) => item.peso),
            color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      }
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={["#6200EE", "#3700B3"]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.profileInfo}>
              <View style={styles.profileImageContainer}>
                <Ionicons name="person" size={60} color="white" />
              </View>
              <View style={styles.profileTextContainer}>
                <Text style={styles.nombreUsuario}>
                  {userData?.nombre || "Usuario"}
                </Text>
                <Text style={styles.emailUsuario}>{user?.email}</Text>
                <Text style={styles.memberSince}>
                  Miembro desde{" "}
                  {new Date(
                    userData?.fechaRegistro || Date.now()
                  ).toLocaleDateString("es-ES", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Datos básicos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Datos Básicos</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(true)}>
              <Ionicons name="pencil" size={20} color="#6200EE" />
            </TouchableOpacity>
          </View>

          <View style={styles.datosGrid}>
            <View style={styles.datoCard}>
              <Ionicons name="scale-outline" size={24} color="#6200EE" />
              <Text style={styles.datoValor}>{userData?.peso || "--"}</Text>
              <Text style={styles.datoLabel}>Peso (kg)</Text>
            </View>

            <View style={styles.datoCard}>
              <Ionicons name="resize-outline" size={24} color="#6200EE" />
              <Text style={styles.datoValor}>{userData?.altura || "--"}</Text>
              <Text style={styles.datoLabel}>Altura (cm)</Text>
            </View>

            <View style={styles.datoCard}>
              <Ionicons name="analytics-outline" size={24} color="#6200EE" />
              <Text style={[styles.datoValor, { color: estadoIMC?.color }]}>
                {imc}
              </Text>
              <Text style={styles.datoLabel}>IMC</Text>
              {estadoIMC && (
                <Text style={[styles.datoEstado, { color: estadoIMC.color }]}>
                  {estadoIMC.texto}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.pesoIdealCard}>
            <View style={styles.pesoIdealInfo}>
              <Ionicons name="fitness-outline" size={20} color="#27ae60" />
              <Text style={styles.pesoIdealLabel}>Peso ideal:</Text>
              <Text style={styles.pesoIdealValor}>{calcularPesoIdeal()}</Text>
            </View>
          </View>
        </View>

        {/* Gráfica de progreso de peso */}
        {chartData && historialPeso.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Progreso de Peso</Text>
              <Text style={styles.pesoActualText}>
                Actual: {userData?.peso || "--"} kg
              </Text>
            </View>

            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                width={width - 40}
                height={200}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#6200EE",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />

              {/* Mostrar cambio de peso */}
              {historialPeso.length >= 2 && (
                <View style={styles.cambiosPeso}>
                  <Text style={styles.cambioLabel}>Cambio total:</Text>
                  <Text
                    style={[
                      styles.cambioValor,
                      {
                        color:
                          historialPeso[historialPeso.length - 1].peso <
                            historialPeso[0].peso
                            ? "#27ae60"
                            : "#e74c3c",
                      },
                    ]}
                  >
                    {(
                      historialPeso[historialPeso.length - 1].peso -
                      historialPeso[0].peso
                    ).toFixed(1)}{" "}
                    kg
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Objetivos y logros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Objetivos</Text>

          <View style={styles.objetivoCard}>
            <View style={styles.objetivoHeader}>
              <View style={styles.objetivoHeaderLeft}>
                <Ionicons
                  name={haAlcanzadoObjetivo() ? "trophy" : "trophy-outline"}
                  size={24}
                  color={haAlcanzadoObjetivo() ? "#27ae60" : "#FFB800"}
                />
                <Text style={styles.objetivoTitle}>Objetivo de peso</Text>
              </View>
              <TouchableOpacity onPress={() => setObjetivoModalVisible(true)}>
                <Ionicons name="create-outline" size={20} color="#6200EE" />
              </TouchableOpacity>
            </View>

            <Text style={styles.objetivoText}>
              {userData?.objetivoPeso
                ? haAlcanzadoObjetivo()
                  ? `¡Meta alcanzada! Objetivo: ${userData.objetivoPeso} kg`
                  : `Objetivo: ${userData.objetivoPeso} kg (Actual: ${userData.peso} kg)`
                : userData?.peso && userData?.altura
                  ? `Peso ideal recomendado: ${calcularPesoIdeal()}`
                  : "Establece tu peso y objetivo"}
            </Text>

            {userData?.peso && userData?.objetivoPeso && (
              <Text style={styles.progressText}>
                {!haAlcanzadoObjetivo() &&
                  (userData.objetivoPeso > userData.peso
                    ? ` (${(userData.objetivoPeso - userData.peso).toFixed(
                      1
                    )} kg por ganar)`
                    : ` (${(userData.peso - userData.objetivoPeso).toFixed(
                      1
                    )} kg por perder)`)}
              </Text>
            )}
          </View>
        </View>

        {/* Opciones de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="key-outline" size={24} color="#6200EE" />
            </View>
            <Text style={styles.optionText}>Cambiar contraseña</Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={confirmLogout}>
            <View style={styles.optionIcon}>
              <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            </View>
            <Text style={[styles.optionText, { color: "#e74c3c" }]}>
              Cerrar sesión
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de edición de datos básicos */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar Datos Básicos</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                placeholder="Ej: 70.5"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={altura}
                onChangeText={setAltura}
                keyboardType="numeric"
                placeholder="Ej: 175"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={guardarDatosBasicos}
              >
                <Text style={[styles.buttonText, { color: "white" }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Ingresa tu contraseña actual"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry
                placeholder="Repite la nueva contraseña"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                disabled={passwordLoading}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={cambiarPassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.buttonText, { color: "white" }]}>
                    Cambiar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de objetivo de peso */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={objetivoModalVisible}
        onRequestClose={() => setObjetivoModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Establecer Objetivo de Peso</Text>

            <Text style={styles.modalSubtext}>
              Tu peso actual: {userData?.peso || "--"} kg
              {userData?.altura &&
                `\nPeso ideal recomendado: ${calcularPesoIdeal()}`}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Peso objetivo (kg)</Text>
              <TextInput
                style={styles.input}
                value={objetivoPeso}
                onChangeText={setObjetivoPeso}
                keyboardType="numeric"
                placeholder="Ej: 70"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setObjetivoModalVisible(false);
                  setObjetivoPeso(userData?.objetivoPeso?.toString() || "");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={guardarObjetivoPeso}
              >
                <Text style={[styles.buttonText, { color: "white" }]}>
                  Establecer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de confirmación de cerrar sesión */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmLogoutVisible}
        onRequestClose={() => setConfirmLogoutVisible(false)}
      >
        <View style={styles.confirmModalBackground}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="log-out-outline" size={32} color="#e74c3c" />
              <Text style={styles.confirmModalTitle}>Cerrar Sesión</Text>
            </View>

            <Text style={styles.confirmModalMessage}>
              ¿Estás seguro de que deseas cerrar sesión?
            </Text>

            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmCancelButton]}
                onPress={() => setConfirmLogoutVisible(false)}
              >
                <Text style={styles.confirmCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmLogoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmLogoutButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#6200EE",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  headerGradient: {
    paddingTop: 0, // Asegurarse de que no tenga padding extra
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 20,
  },
  profileInfo: {
    alignItems: "center",
    marginTop: 10,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileTextContainer: {
    alignItems: "center",
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  emailUsuario: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  datosGrid: {
    flexDirection: "row",
    gap: 12,
  },
  datoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  datoValor: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
  datoLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  datoEstado: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  pesoIdealCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  pesoIdealLabel: {
    fontSize: 14,
    color: "#666",
  },
  pesoIdealValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
  },
  pesoActualText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cambiosPeso: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  cambioLabel: {
    fontSize: 14,
    color: "#666",
  },
  cambioValor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValor: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  objetivoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  objetivoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  objetivoText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
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
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  confirmButton: {
    backgroundColor: "#6200EE",
  },
  buttonText: {
    fontWeight: "600",
    color: "#666",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  objetivoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  modalSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  pesoIdealContent: {
    flexDirection: "column",
    gap: 12,
  },
  pesoIdealInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  objetivoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmModalBackground: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
},
confirmModalContainer: {
  backgroundColor: "white",
  borderRadius: 16,
  padding: 24,
  width: "85%",
  maxWidth: 400,
  alignItems: "center",
},
confirmModalHeader: {
  alignItems: "center",
  marginBottom: 16,
},
confirmModalTitle: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#212121",
  marginTop: 8,
},
confirmModalMessage: {
  fontSize: 16,
  color: "#666",
  textAlign: "center",
  marginBottom: 24,
  lineHeight: 22,
},
confirmModalButtons: {
  flexDirection: "row",
  gap: 12,
  width: "100%",
},
confirmModalButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: "center",
},
confirmCancelButton: {
  backgroundColor: "#F5F5F5",
},
confirmLogoutButton: {
  backgroundColor: "#e74c3c",
},
confirmCancelButtonText: {
  fontWeight: "600",
  color: "#666",
  fontSize: 16,
},
confirmLogoutButtonText: {
  fontWeight: "600",
  color: "white",
  fontSize: 16,
},
});
