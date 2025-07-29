import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { Toast } from "../../components/ToastComponent";
import { fetchEjercicioPorId } from "../../services/ejerciciosPeticiones";
import { guardarEntrenamiento } from "../../services/entrenamientoPeticiones";

const { width } = Dimensions.get("window");

export default function EjecutarRutinaScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rutina } = route.params;
  const { user } = useContext(AuthContext);

  const [diaActual, setDiaActual] = useState(0);
  const [ejercicioActual, setEjercicioActual] = useState(0);
  const [serieActual, setSerieActual] = useState(0);
  const [entrenamientoData, setEntrenamientoData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [pesoTemporal, setPesoTemporal] = useState("");
  const [repeticionesTemporal, setRepeticionesTemporal] = useState("");
  const [descansoActivo, setDescansoActivo] = useState(false);
  const [tiempoDescanso, setTiempoDescanso] = useState(0);
  const [entrenamientoIniciado, setEntrenamientoIniciado] = useState(false);
  const [horaInicio, setHoraInicio] = useState(null);
  const [ejercicioDetalle, setEjercicioDetalle] = useState(null);
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  const [imagenActual, setImagenActual] = useState(0);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [modalValoracion, setModalValoracion] = useState(false);
  const [valoracionActual, setValoracionActual] = useState({
    satisfaccion: 3,
    esfuerzo: 3,
    dificultad: 3,
    notas: "",
  });
  const [valoracionesEjercicios, setValoracionesEjercicios] = useState({});
  const [tiemposEjercicios, setTiemposEjercicios] = useState({});
  const [tiempoInicioEjercicio, setTiempoInicioEjercicio] = useState(null);

  const diaEntrenamiento = rutina.dias[diaActual];
  const ejercicioActualData = diaEntrenamiento?.ejercicios[ejercicioActual];
  const totalSeries = ejercicioActualData?.series || 0;
  const totalEjercicios = diaEntrenamiento?.ejercicios.length || 0;

  const [modalSeleccionarDia, setModalSeleccionarDia] = useState(false);
  const [diaRecomendado, setDiaRecomendado] = useState(0);
  const [cargandoProgreso, setCargandoProgreso] = useState(true);

  useEffect(() => {
    const inicializarDatos = () => {
      const datos = {};
      rutina.dias.forEach((dia, diaIndex) => {
        datos[diaIndex] = {};
        dia.ejercicios.forEach((ejercicio, ejIndex) => {
          datos[diaIndex][ejIndex] = {
            ejercicioId: ejercicio.ejercicio, // Cambiar de ejercicio.ejercicioId a ejercicio.ejercicio
            series: Array.from({ length: ejercicio.series }, () => ({
              peso: ejercicio.peso || 0,
              repeticiones: ejercicio.repeticiones || 0,
              completada: false,
            })),
          };
        });
      });
      setEntrenamientoData(datos);
      console.log(rutina);
    };

    inicializarDatos();
  }, [rutina]);

  useEffect(() => {
    const cargarEjercicio = async () => {
      try {
        // Añadir logs para debug
        console.log("Día actual:", diaActual);
        console.log("Ejercicio actual index:", ejercicioActual);
        console.log("Día entrenamiento:", diaEntrenamiento);
        console.log("Ejercicio actual data:", ejercicioActualData);
        console.log(
          "ID del ejercicio a cargar:",
          ejercicioActualData?.ejercicio
        );

        if (ejercicioActualData?.ejercicio && diaEntrenamiento) {
          const detalle = await fetchEjercicioPorId(
            ejercicioActualData.ejercicio
          );
          setEjercicioDetalle(detalle);
          setImagenActual(0);

          if (entrenamientoIniciado && !tiempoInicioEjercicio) {
            setTiempoInicioEjercicio(new Date());
          }
        }
      } catch (error) {
        console.error("Error al cargar el ejercicio:", error);
        if (diaEntrenamiento && ejercicioActualData) {
          mostrarToast("Error al cargar el ejercicio", "error");
        }
      }
    };

    if (diaEntrenamiento && ejercicioActualData) {
      cargarEjercicio();
    }
  }, [ejercicioActualData?.ejercicio, entrenamientoIniciado, diaActual]);

  useEffect(() => {
    const cargarProgreso = async () => {
      setCargandoProgreso(true);
      const resultado = await fetchProgresoRutina(user.uid, rutina._id);
      if (resultado.success) {
        setDiaRecomendado(resultado.diaActual);
        setDiaActual(resultado.diaActual);
      }
      setCargandoProgreso(false);
    };

    cargarProgreso();
  }, [user.uid, rutina._id]);

  useEffect(() => {
    let interval;
    if (entrenamientoIniciado && horaInicio) {
      interval = setInterval(() => {
        const segundos = Math.floor((Date.now() - new Date(horaInicio)) / 1000);
        setTiempoTranscurrido(segundos);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [entrenamientoIniciado, horaInicio]);

  useEffect(() => {
    let interval;
    if (descansoActivo && tiempoDescanso > 0) {
      interval = setInterval(() => {
        setTiempoDescanso((prev) => {
          if (prev <= 1) {
            setDescansoActivo(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [descansoActivo, tiempoDescanso]);

  const iniciarEntrenamiento = () => {
    setEntrenamientoIniciado(true);
    setHoraInicio(new Date());
    setTiempoInicioEjercicio(new Date());
    mostrarToast("¡Entrenamiento iniciado! 💪", "success");
  };

  const mostrarToast = (message, type = "info") => {
    setToast({
      visible: true,
      message,
      type,
    });
  };

  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const seleccionarDia = (diaIndex) => {
    // Log para ver la estructura
    console.log("Cambiando a día:", diaIndex);
    console.log("Datos del día seleccionado:", rutina.dias[diaIndex]);
    console.log("Ejercicios del día:", rutina.dias[diaIndex].ejercicios);

    setDiaActual(diaIndex);
    setModalSeleccionarDia(false);

    // Reinicializar estados
    setEjercicioActual(0);
    setSerieActual(0);
    setEjercicioDetalle(null);
    setMostrarInstrucciones(false);
    setImagenActual(0);
    setValoracionesEjercicios({});
    setTiemposEjercicios({});
    setTiempoInicioEjercicio(null);

    // Forzar la recarga del ejercicio después de cambiar el día
    setTimeout(() => {
      const nuevoDia = rutina.dias[diaIndex];
      const primerEjercicio = nuevoDia?.ejercicios[0];
      console.log("Primer ejercicio del nuevo día:", primerEjercicio);

      if (primerEjercicio?.ejercicio) {
        // Cargar manualmente el primer ejercicio
        fetchEjercicioPorId(primerEjercicio.ejercicio)
          .then((detalle) => {
            setEjercicioDetalle(detalle);
            console.log("Ejercicio cargado manualmente:", detalle);
          })
          .catch((error) => {
            console.error("Error manual al cargar ejercicio:", error);
          });
      }
    }, 100);

    mostrarToast(`${rutina.dias[diaIndex].nombre} seleccionado`, "info");
  };

  const abrirModalSerie = () => {
    const serieData =
      entrenamientoData[diaActual]?.[ejercicioActual]?.series[serieActual];
    setPesoTemporal(serieData?.peso?.toString() || "");
    setRepeticionesTemporal(serieData?.repeticiones?.toString() || "");
    setModalVisible(true);
  };

  const completarSerie = () => {
    const peso = parseFloat(pesoTemporal) || 0;
    const repeticiones = parseInt(repeticionesTemporal) || 0;

    setEntrenamientoData((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        [ejercicioActual]: {
          ...prev[diaActual][ejercicioActual],
          series: prev[diaActual][ejercicioActual].series.map((serie, index) =>
            index === serieActual
              ? { ...serie, peso, repeticiones, completada: true }
              : serie
          ),
        },
      },
    }));

    setModalVisible(false);

    const esUltimaSerie = serieActual === totalSeries - 1;
    const esUltimoEjercicio = ejercicioActual === totalEjercicios - 1;
    const esFinDelEntrenamiento = esUltimaSerie && esUltimoEjercicio;

    // Iniciar descanso si hay tiempo configurado
    const tiempoDescansoEjercicio = ejercicioActualData?.descanso || 0;
    if (tiempoDescansoEjercicio > 0 && !esFinDelEntrenamiento) {
      setTiempoDescanso(tiempoDescansoEjercicio);
      setDescansoActivo(true);
    }

    // Avanzar a la siguiente serie o ejercicio
    if (serieActual < totalSeries - 1) {
      setSerieActual(serieActual + 1);
    } else {
      setModalValoracion(true);
    }
  };

  const saltarSerie = () => {
    // Marcar la serie como saltada
    setEntrenamientoData((prev) => ({
      ...prev,
      [diaActual]: {
        ...prev[diaActual],
        [ejercicioActual]: {
          ...prev[diaActual][ejercicioActual],
          series: prev[diaActual][ejercicioActual].series.map((serie, index) =>
            index === serieActual
              ? {
                  ...serie,
                  peso: 0,
                  repeticiones: 0,
                  completada: false,
                  saltada: true,
                }
              : serie
          ),
        },
      },
    }));

    setModalVisible(false);
    mostrarToast("Serie saltada", "info");

    if (serieActual < totalSeries - 1) {
      setSerieActual(serieActual + 1);
    } else {
      setModalValoracion(true);
    }
  };

  const guardarValoracionYAvanzar = () => {
    const tiempoFin = new Date();
    const duracionEjercicio = Math.floor(
      (tiempoFin - tiempoInicioEjercicio) / 1000
    );

    // Guardar los datos del ejercicio actual
    const nuevosTimemposEjercicios = {
      ...tiemposEjercicios,
      [ejercicioActual]: duracionEjercicio,
    };

    const nuevasValoracionesEjercicios = {
      ...valoracionesEjercicios,
      [ejercicioActual]: {
        ejercicioId: ejercicioActualData?.ejercicio,
        nombre: ejercicioDetalle?.nombre,
        duracion: duracionEjercicio, // Añadir duración aquí también
        ...valoracionActual,
      },
    };

    setTiemposEjercicios(nuevosTimemposEjercicios);
    setValoracionesEjercicios(nuevasValoracionesEjercicios);

    // Cerrar modal
    setModalValoracion(false);

    // Resetear valoración para el siguiente ejercicio
    setValoracionActual({
      satisfaccion: 3,
      esfuerzo: 3,
      dificultad: 3,
      notas: "",
    });

    if (ejercicioActual < totalEjercicios - 1) {
      setEjercicioActual(ejercicioActual + 1);
      setSerieActual(0);
      setMostrarInstrucciones(false);
      setTiempoInicioEjercicio(new Date());
      mostrarToast("¡Ejercicio completado! 🎯", "success");
    } else {
      // Día completado - pasar los datos actualizados directamente
      mostrarToast("¡Día de entrenamiento completado! 🏆", "success");
      finalizarEntrenamiento(
        nuevasValoracionesEjercicios,
        nuevosTimemposEjercicios
      );
    }
  };

  const finalizarEntrenamiento = async (
    valoracionesActualizadas,
    tiemposActualizados
  ) => {
    try {
      const horaFin = new Date();
      const duracion = Math.floor((horaFin - horaInicio) / 1000);

      // Usar los valores pasados como parámetros o los del estado si no se pasan
      const valoracionesFinal =
        valoracionesActualizadas || valoracionesEjercicios;
      const tiemposFinal = tiemposActualizados || tiemposEjercicios;

      const datosEntrenamiento = {
        usuarioId: user.uid,
        rutinaId: rutina._id,
        nombreRutina: rutina.nombre,
        diaEntrenamiento: diaActual,
        ejercicios: Object.entries(entrenamientoData[diaActual] || {}).map(
          ([ejercicioIndex, data]) => ({
            ejercicioId: data.ejercicioId,
            series: data.series.filter(
              (serie) => serie.completada && !serie.saltada
            ),
            seriesSaltadas: data.series.filter((serie) => serie.saltada).length,
            valoracion: valoracionesFinal[ejercicioIndex] || null,
            duracion: tiemposFinal[ejercicioIndex] || 0,
          })
        ),
        duracion,
        fechaInicio: horaInicio,
        fechaFin: horaFin,
        completado: true,
      };

      const resultado = await guardarEntrenamiento(datosEntrenamiento);

      if (resultado.success) {
        if (Platform.OS === "android") {
          Alert.alert(
            "¡Entrenamiento Completado!",
            "Tu progreso ha sido guardado exitosamente.",
            [
              {
                text: "Continuar",
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          mostrarToast("¡Entrenamiento guardado exitosamente! 📊", "success");
          navigation.goBack();
        }
      } else {
        throw new Error(resultado.error);
      }
    } catch (error) {
      console.error("Error al guardar entrenamiento:", error);
      mostrarToast(
        error.message || "Error al guardar el entrenamiento",
        "error"
      );
    }
  };

  const salirEntrenamiento = () => {
    if (Platform.OS === "android") {
      Alert.alert(
        "Salir del Entrenamiento",
        "¿Estás seguro de que quieres salir? Se perderá el progreso actual.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const cambiarImagen = (direccion) => {
    if (!ejercicioDetalle?.imagenes) return;

    const totalImagenes = ejercicioDetalle.imagenes.length;
    if (direccion === "siguiente") {
      setImagenActual((prev) => (prev + 1) % totalImagenes);
    } else {
      setImagenActual((prev) => (prev - 1 + totalImagenes) % totalImagenes);
    }
  };

  const renderMusculosChip = (musculos, titulo, color) => {
    if (!musculos || musculos.length === 0) return null;

    return (
      <View style={styles.musculosSection}>
        <Text style={[styles.musculosTitle, { color }]}>{titulo}</Text>
        <View style={styles.musculosContainer}>
          {musculos.map((musculo, index) => (
            <View
              key={index}
              style={[styles.musculoChip, { borderColor: color }]}
            >
              <Text style={[styles.musculoText, { color }]}>
                {musculo.charAt(0).toUpperCase() + musculo.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const serieCompletada =
    entrenamientoData[diaActual]?.[ejercicioActual]?.series[serieActual]
      ?.completada;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ ...toast, visible: false })}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={salirEntrenamiento}>
          <Ionicons name="close" size={24} color="#F44336" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {rutina.nombre} - Día {diaActual + 1}
        </Text>

        <View style={styles.headerRight}>
          {entrenamientoIniciado && (
            <Text style={styles.tiempoText}>
              {formatearTiempo(tiempoTranscurrido)}
            </Text>
          )}
        </View>
      </View>

      {/* Progreso */}
      <View style={styles.progresoContainer}>
        <Text style={styles.progresoText}>
          Ejercicio {ejercicioActual + 1}/{totalEjercicios} - Serie{" "}
          {serieActual + 1}/{totalSeries}
        </Text>
        <View style={styles.barraProgreso}>
          <View
            style={[
              styles.barraProgresoFill,
              { width: `${((ejercicioActual + 1) / totalEjercicios) * 100}%` },
            ]}
          />
        </View>
      </View>

      {!entrenamientoIniciado ? (
        /* Pantalla de inicio */
        <ScrollView style={styles.container}>
          <View style={styles.inicioContainer}>
            <Ionicons name="fitness" size={80} color="#6200EE" />
            <Text style={styles.inicioTitle}>¿Listo para entrenar?</Text>
            <Text style={styles.inicioSubtitle}>{rutina.nombre}</Text>

            {/* Información del día actual */}
            <View style={styles.diaInfoContainer}>
              <Text style={styles.diaActualText}>
                {diaEntrenamiento?.nombre || `Día ${diaActual + 1}`}
              </Text>
              <Text style={styles.ejerciciosInfo}>
                {totalEjercicios} ejercicios programados
              </Text>
            </View>

            {/* Botón para cambiar día */}
            <TouchableOpacity
              style={styles.cambiarDiaButton}
              onPress={() => setModalSeleccionarDia(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6200EE" />
              <Text style={styles.cambiarDiaText}>Elegir otro día</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iniciarButton}
              onPress={iniciarEntrenamiento}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text style={styles.iniciarButtonText}>
                Iniciar Entrenamiento
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Pantalla de entrenamiento */
        <ScrollView style={styles.container}>
          {/* Descanso activo */}
          {descansoActivo ? (
            <View style={styles.descansoFullScreen}>
              <View style={styles.descansoContent}>
                <View style={styles.descansoIconContainer}>
                  <Ionicons name="time" size={80} color="#FF9800" />
                </View>

                <Text style={styles.descansoTitle}>Tiempo de Descanso</Text>

                <View style={styles.timerContainer}>
                  <Text style={styles.descansoTimer}>
                    {formatearTiempo(tiempoDescanso)}
                  </Text>
                </View>

                <Text style={styles.descansoSubtitle}>
                  Prepárate para la siguiente serie
                </Text>

                <TouchableOpacity
                  style={styles.saltarDescansoButton}
                  onPress={() => setDescansoActivo(false)}
                >
                  <Ionicons name="play-skip-forward" size={20} color="white" />
                  <Text style={styles.saltarDescansoText}>Saltar Descanso</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Información del ejercicio actual */}
              <View style={styles.ejercicioContainer}>
                <View style={styles.ejercicioHeader}>
                  <Text style={styles.ejercicioNombre}>
                    {ejercicioDetalle?.nombre || "Ejercicio"}
                  </Text>

                  {ejercicioDetalle && (
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={() =>
                        setMostrarInstrucciones(!mostrarInstrucciones)
                      }
                    >
                      <Ionicons
                        name={
                          mostrarInstrucciones
                            ? "chevron-up"
                            : "information-circle"
                        }
                        size={18}
                        color="#6200EE"
                      />
                      <Text style={styles.infoButtonText}>
                        {mostrarInstrucciones ? "Ocultar" : "Ver más"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Imágenes del ejercicio */}
                {ejercicioDetalle?.imagenes &&
                  ejercicioDetalle.imagenes.length > 0 && (
                    <View style={styles.imagenesContainer}>
                      <View style={styles.imagenWrapper}>
                        <Image
                          source={{
                            uri: ejercicioDetalle.imagenes[imagenActual],
                          }}
                          style={styles.ejercicioImagen}
                          resizeMode="contain"
                        />

                        {ejercicioDetalle.imagenes.length > 1 && (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.imagenButton,
                                styles.imagenButtonLeft,
                              ]}
                              onPress={() => cambiarImagen("anterior")}
                            >
                              <Ionicons
                                name="chevron-back"
                                size={20}
                                color="white"
                              />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.imagenButton,
                                styles.imagenButtonRight,
                              ]}
                              onPress={() => cambiarImagen("siguiente")}
                            >
                              <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="white"
                              />
                            </TouchableOpacity>

                            <View style={styles.indicadorImagenes}>
                              <Text style={styles.indicadorText}>
                                {imagenActual + 1}/
                                {ejercicioDetalle.imagenes.length}
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  )}

                <View style={styles.ejercicioInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons name="repeat" size={20} color="#6200EE" />
                    <Text style={styles.infoText}>
                      {ejercicioActualData?.repeticiones} reps
                    </Text>
                  </View>

                  {ejercicioActualData?.peso && (
                    <View style={styles.infoItem}>
                      <Ionicons name="barbell" size={20} color="#6200EE" />
                      <Text style={styles.infoText}>
                        {ejercicioActualData.peso} kg
                      </Text>
                    </View>
                  )}

                  {ejercicioActualData?.descanso && (
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={20} color="#6200EE" />
                      <Text style={styles.infoText}>
                        {ejercicioActualData.descanso}s
                      </Text>
                    </View>
                  )}
                </View>

                {/* Información expandida del ejercicio */}
                {mostrarInstrucciones && ejercicioDetalle && (
                  <View style={styles.detalleExpandido}>
                    {/* Información básica */}
                    <View style={styles.infoBasica}>
                      <View style={styles.infoRow}>
                        <View style={styles.infoItemDetalle}>
                          <Text style={styles.infoLabel}>Nivel</Text>
                          <Text style={styles.infoValue}>
                            {ejercicioDetalle.nivel?.charAt(0).toUpperCase() +
                              ejercicioDetalle.nivel?.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.infoItemDetalle}>
                          <Text style={styles.infoLabel}>Equipo</Text>
                          <Text style={styles.infoValue}>
                            {ejercicioDetalle.equipo?.charAt(0).toUpperCase() +
                              ejercicioDetalle.equipo?.slice(1)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <View style={styles.infoItemDetalle}>
                          <Text style={styles.infoLabel}>Mecánica</Text>
                          <Text style={styles.infoValue}>
                            {ejercicioDetalle.mecanica
                              ?.charAt(0)
                              .toUpperCase() +
                              ejercicioDetalle.mecanica?.slice(1)}
                          </Text>
                        </View>
                        <View style={styles.infoItemDetalle}>
                          <Text style={styles.infoLabel}>Fuerza</Text>
                          <Text style={styles.infoValue}>
                            {ejercicioDetalle.fuerza?.charAt(0).toUpperCase() +
                              ejercicioDetalle.fuerza?.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Músculos trabajados */}
                    {renderMusculosChip(
                      ejercicioDetalle.musculosPrimarios,
                      "Músculos Primarios",
                      "#6200EE"
                    )}
                    {renderMusculosChip(
                      ejercicioDetalle.musculosSecundarios,
                      "Músculos Secundarios",
                      "#FF9800"
                    )}

                    {/* Instrucciones */}
                    {ejercicioDetalle.instrucciones &&
                      ejercicioDetalle.instrucciones.length > 0 && (
                        <View style={styles.instruccionesSection}>
                          <Text style={styles.instruccionesTitle}>
                            Instrucciones
                          </Text>
                          {ejercicioDetalle.instrucciones.map(
                            (instruccion, index) => (
                              <View key={index} style={styles.instruccionItem}>
                                <Text style={styles.instruccionNumero}>
                                  {index + 1}.
                                </Text>
                                <Text style={styles.instruccionTexto}>
                                  {instruccion}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      )}
                  </View>
                )}

                {/* Series */}
                <View style={styles.seriesContainer}>
                  <Text style={styles.seriesTitle}>Series</Text>

                  {entrenamientoData[diaActual]?.[ejercicioActual]?.series.map(
                    (serie, index) => (
                      <View
                        key={index}
                        style={[
                          styles.serieItem,
                          serie.completada && styles.serieCompletada,
                          serie.saltada && styles.serieSaltada,
                          index === serieActual && styles.serieActual,
                        ]}
                      >
                        <Text style={styles.serieNumero}>#{index + 1}</Text>
                        <Text style={styles.serieInfo}>
                          {serie.saltada ? (
                            "Serie saltada"
                          ) : (
                            <>
                              {serie.peso > 0 ? `${serie.peso}kg × ` : ""}
                              {serie.repeticiones} reps
                            </>
                          )}
                        </Text>
                        {serie.completada && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#4CAF50"
                          />
                        )}
                        {serie.saltada && (
                          <Ionicons
                            name="play-skip-forward"
                            size={20}
                            color="#FF9800"
                          />
                        )}
                      </View>
                    )
                  )}
                </View>

                {/* Botón de acción */}
                <View style={styles.botonesAccion}>
                  <TouchableOpacity
                    style={[
                      styles.accionButton,
                      serieCompletada && styles.accionButtonCompletada,
                    ]}
                    onPress={abrirModalSerie}
                    disabled={descansoActivo}
                  >
                    <Text style={styles.accionButtonText}>
                      {serieCompletada ? "Serie Completada" : "Registrar Serie"}
                    </Text>
                  </TouchableOpacity>

                  {!serieCompletada && !descansoActivo && (
                    <TouchableOpacity
                      style={styles.saltarDirectoButton}
                      onPress={() => {
                        if (Platform.OS === "android") {
                          Alert.alert(
                            "Saltar Serie",
                            "¿Estás seguro de que quieres saltar esta serie?",
                            [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Saltar", onPress: saltarSerie },
                            ]
                          );
                        } else {
                          saltarSerie();
                        }
                      }}
                    >
                      <Ionicons
                        name="play-skip-forward"
                        size={18}
                        color="#FF9800"
                      />
                      <Text style={styles.saltarDirectoText}>Saltar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Modal para registrar serie */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Registrar Serie {serieActual + 1}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={pesoTemporal}
                onChangeText={setPesoTemporal}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Repeticiones</Text>
              <TextInput
                style={styles.input}
                value={repeticionesTemporal}
                onChangeText={setRepeticionesTemporal}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={completarSerie}
              >
                <Text style={styles.confirmButtonText}>Completar</Text>
              </TouchableOpacity>
            </View>

            {/* Botón para saltar serie */}
            <TouchableOpacity
              style={styles.saltarSerieButton}
              onPress={saltarSerie}
            >
              <Ionicons name="play-skip-forward" size={16} color="#FF9800" />
              <Text style={styles.saltarSerieText}>Saltar esta serie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal de Valoración del Ejercicio */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalValoracion}
        onRequestClose={() => setModalValoracion(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContentValoracion}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalTitle}>
                ¿Cómo te fue con {ejercicioDetalle?.nombre}?
              </Text>

              {/* Satisfacción */}
              <View style={styles.valoracionSection}>
                <Text style={styles.valoracionLabel}>Satisfacción</Text>
                <View style={styles.emojiContainer}>
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <TouchableOpacity
                      key={valor}
                      onPress={() =>
                        setValoracionActual((prev) => ({
                          ...prev,
                          satisfaccion: valor,
                        }))
                      }
                      style={[
                        styles.emojiButton,
                        valoracionActual.satisfaccion === valor &&
                          styles.emojiSelected,
                      ]}
                    >
                      <Text style={styles.emojiText}>
                        {valor === 1
                          ? "😞"
                          : valor === 2
                          ? "😕"
                          : valor === 3
                          ? "😐"
                          : valor === 4
                          ? "😊"
                          : "😄"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Esfuerzo */}
              <View style={styles.valoracionSection}>
                <Text style={styles.valoracionLabel}>Nivel de Esfuerzo</Text>
                <View style={styles.emojiContainer}>
                  {[1, 2, 3, 4, 5].map((valor) => (
                    <TouchableOpacity
                      key={valor}
                      onPress={() =>
                        setValoracionActual((prev) => ({
                          ...prev,
                          esfuerzo: valor,
                        }))
                      }
                      style={[
                        styles.emojiButton,
                        valoracionActual.esfuerzo === valor &&
                          styles.emojiSelected,
                      ]}
                    >
                      <Text style={styles.emojiText}>
                        {valor === 1
                          ? "😴"
                          : valor === 2
                          ? "🙂"
                          : valor === 3
                          ? "😤"
                          : valor === 4
                          ? "💪"
                          : "🔥"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dificultad */}
              <View style={styles.valoracionSection}>
                <Text style={styles.valoracionLabel}>Dificultad percibida</Text>
                <View style={styles.nivelContainer}>
                  {[
                    { valor: 1, texto: "Muy fácil", color: "#4CAF50" },
                    { valor: 2, texto: "Fácil", color: "#8BC34A" },
                    { valor: 3, texto: "Moderada", color: "#FFC107" },
                    { valor: 4, texto: "Difícil", color: "#FF9800" },
                    { valor: 5, texto: "Muy difícil", color: "#F44336" },
                  ].map(({ valor, texto, color }) => (
                    <TouchableOpacity
                      key={valor}
                      onPress={() =>
                        setValoracionActual((prev) => ({
                          ...prev,
                          dificultad: valor,
                        }))
                      }
                      style={[
                        styles.nivelButton,
                        valoracionActual.dificultad === valor && {
                          backgroundColor: color,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.nivelText,
                          valoracionActual.dificultad === valor &&
                            styles.nivelTextSelected,
                        ]}
                      >
                        {texto}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notas opcionales */}
              <View style={styles.valoracionSection}>
                <Text style={styles.valoracionLabel}>Notas (opcional)</Text>
                <TextInput
                  style={styles.notasInput}
                  value={valoracionActual.notas}
                  onChangeText={(text) =>
                    setValoracionActual((prev) => ({ ...prev, notas: text }))
                  }
                  placeholder="¿Algún comentario sobre el ejercicio?"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActionsFixed}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={guardarValoracionYAvanzar}
              >
                <Text style={styles.confirmButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal para seleccionar día */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalSeleccionarDia}
        onRequestClose={() => setModalSeleccionarDia(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Seleccionar Día de Entrenamiento
            </Text>

            <ScrollView style={styles.diasLista}>
              {rutina.dias.map((dia, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.diaItem,
                    index === diaActual && styles.diaItemActual,
                    index === diaRecomendado && styles.diaItemRecomendado,
                  ]}
                  onPress={() => seleccionarDia(index)}
                >
                  <View style={styles.diaItemContent}>
                    <Text style={styles.diaItemNombre}>
                      {dia.nombre || `Día ${index + 1}`}
                    </Text>
                    <Text style={styles.diaItemInfo}>
                      {dia.ejercicios.length} ejercicios
                    </Text>
                    {index === diaRecomendado && (
                      <Text style={styles.diaRecomendadoLabel}>
                        Día recomendado
                      </Text>
                    )}
                  </View>
                  {index === diaActual && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#6200EE"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalSeleccionarDia(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backIcon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    minWidth: 50,
    alignItems: "flex-end",
  },
  tiempoText: {
    fontSize: 16,
    color: "#6200EE",
    fontWeight: "bold",
  },
  progresoContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  progresoText: {
    fontSize: 14,
    color: "#616161",
    marginBottom: 5,
  },
  barraProgreso: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  barraProgresoFill: {
    height: "100%",
    backgroundColor: "#6200EE",
    borderRadius: 2,
  },
  inicioContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 80,
  },
  inicioTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 20,
    marginBottom: 10,
  },
  inicioSubtitle: {
    fontSize: 18,
    color: "#6200EE",
    marginBottom: 5,
  },
  inicioInfo: {
    fontSize: 16,
    color: "#616161",
    marginBottom: 40,
  },
  iniciarButton: {
    backgroundColor: "#6200EE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  iniciarButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  descansoFullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  descansoContent: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    width: "100%",
    maxWidth: 350,
    borderWidth: 3,
    borderColor: "#FFE0B2",
  },
  descansoIconContainer: {
    backgroundColor: "#FFF3E0",
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFE0B2",
  },
  descansoTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 20,
    textAlign: "center",
  },
  timerContainer: {
    backgroundColor: "#FF9800",
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginBottom: 15,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  descansoTimer: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    letterSpacing: 2,
  },
  descansoSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  saltarDescansoButton: {
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saltarDescansoText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  ejercicioContainer: {
    margin: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ejercicioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  ejercicioNombre: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE7F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6200EE",
  },
  infoButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#6200EE",
    fontWeight: "600",
  },
  imagenesContainer: {
    marginBottom: 20,
  },
  imagenWrapper: {
    position: "relative",
    alignItems: "center",
  },
  ejercicioImagen: {
    width: width - 70,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  imagenButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imagenButtonLeft: {
    left: 10,
  },
  imagenButtonRight: {
    right: 10,
  },
  indicadorImagenes: {
    position: "absolute",
    bottom: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  indicadorText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  ejercicioInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  infoItem: {
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#616161",
    marginTop: 5,
  },
  detalleExpandido: {
    backgroundColor: "#F8F9FF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  infoBasica: {
    marginBottom: 15,
  },
  seriesContainer: {
    marginBottom: 20,
  },
  seriesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 10,
  },
  serieItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  serieActual: {
    borderColor: "#6200EE",
    backgroundColor: "#EDE7F6",
  },
  serieCompletada: {
    backgroundColor: "#E8F5E8",
  },
  serieNumero: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
  },
  serieInfo: {
    fontSize: 16,
    color: "#424242",
    flex: 1,
    textAlign: "center",
  },
  accionButton: {
    backgroundColor: "#6200EE",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  accionButtonCompletada: {
    backgroundColor: "#4CAF50",
  },
  accionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalContentValoracion: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: "#616161",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#616161",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    padding: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: "#6200EE",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoItemDetalle: {
    flex: 1,
    marginHorizontal: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9E9E9E",
    fontWeight: "500",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#424242",
    fontWeight: "600",
  },
  musculosSection: {
    marginBottom: 15,
  },
  musculosTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  musculosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  musculoChip: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  musculoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  instruccionesSection: {
    marginTop: 15,
  },
  instruccionesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 10,
  },
  instruccionItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 10,
  },
  instruccionNumero: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200EE",
    marginRight: 8,
    minWidth: 20,
  },
  instruccionTexto: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 10,
  },
  modalActionsFixed: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "white",
  },
  valoracionSection: {
    marginBottom: 25,
  },
  valoracionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 12,
  },
  emojiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiSelected: {
    backgroundColor: "#EDE7F6",
    borderWidth: 2,
    borderColor: "#6200EE",
  },
  emojiText: {
    fontSize: 24,
  },
  nivelContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  nivelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    minWidth: "30%",
    alignItems: "center",
    marginBottom: 8,
  },
  nivelText: {
    fontSize: 13,
    color: "#616161",
    fontWeight: "500",
  },
  nivelTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  notasInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#F9F9F9",
    minHeight: 80,
    textAlignVertical: "top",
  },
  saltarSerieButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
  },
  saltarSerieText: {
    color: "#FF9800",
    fontSize: 14,
    marginLeft: 6,
  },
  serieSaltada: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
    opacity: 0.8,
  },
  botonesAccion: {
    marginTop: 10,
  },
  saltarDirectoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FF9800",
    borderRadius: 8,
    backgroundColor: "#FFF3E0",
  },
  saltarDirectoText: {
    color: "#FF9800",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  diaInfoContainer: {
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: "center",
  },
  diaActualText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200EE",
    marginBottom: 5,
  },
  ejerciciosInfo: {
    fontSize: 16,
    color: "#666",
  },
  cambiarDiaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE7F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  cambiarDiaText: {
    marginLeft: 8,
    color: "#6200EE",
    fontWeight: "600",
  },
  diasLista: {
    maxHeight: 300,
    marginVertical: 20,
  },
  diaItem: {
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  diaItemActual: {
    backgroundColor: "#EDE7F6",
    borderWidth: 2,
    borderColor: "#6200EE",
  },
  diaItemRecomendado: {
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  diaItemContent: {
    flex: 1,
  },
  diaItemNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  diaItemInfo: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  diaRecomendadoLabel: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginTop: 4,
  },
});
