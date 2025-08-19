import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchEjercicioPorId } from '../services/ejerciciosPeticiones';
import { getEmojiSatisfaccion, getEmojiEsfuerzo } from '../services/entrenamientoPeticiones';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DetalleEntrenamientoModal = ({ visible, onClose, entrenamiento }) => {
  const [ejerciciosInfo, setEjerciciosInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && entrenamiento) {
      cargarEjerciciosInfo();
    }
  }, [visible, entrenamiento]);

  const cargarEjerciciosInfo = async () => {
    setLoading(true);
    const infoEjercicios = {};

    try {
      for (const ejercicio of entrenamiento.ejercicios) {
        const info = await fetchEjercicioPorId(ejercicio.ejercicioId);
        if (info) {
          infoEjercicios[ejercicio.ejercicioId] = info;
        }
      }
      setEjerciciosInfo(infoEjercicios);
    } catch (error) {
      console.error('Error cargando info de ejercicios:', error);
    }

    setLoading(false);
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearHora = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearDuracion = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    } else {
      return `${segs}s`;
    }
  };

  const getColorDificultad = (valor) => {
    const colores = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    return colores[valor - 1] || '#757575';
  };

  const calcularTotalPeso = () => {
    let total = 0;
    entrenamiento?.ejercicios.forEach(ejercicio => {
      ejercicio.series?.forEach(serie => {
        if (serie.completada && !serie.saltada) {
          total += (serie.peso || 0);
        }
      });
    });
    return total;
  };

  const calcularSeriesCompletadas = () => {
    let completadas = 0;
    let totales = 0;
    entrenamiento?.ejercicios.forEach(ejercicio => {
      ejercicio.series?.forEach(serie => {
        totales++;
        if (serie.completada && !serie.saltada) {
          completadas++;
        }
      });
    });
    return { completadas, totales };
  };

  if (!entrenamiento) return null;

  const series = calcularSeriesCompletadas();
  const pesoTotal = calcularTotalPeso();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header con gradiente */}
          <LinearGradient
            colors={['#6200EE', '#5600D8']}
            style={styles.modalHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>{entrenamiento.nombreRutina}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Información temporal */}
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={20} color="#6200EE" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValue}>
                    {formatearFecha(entrenamiento.fechaInicio)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.infoCard, styles.infoCardHalf]}>
                  <Ionicons name="time-outline" size={20} color="#6200EE" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Inicio</Text>
                    <Text style={styles.infoValue}>
                      {formatearHora(entrenamiento.fechaInicio)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoCard, styles.infoCardHalf]}>
                  <Ionicons name="stopwatch-outline" size={20} color="#6200EE" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Duración</Text>
                    <Text style={styles.infoValue}>
                      {formatearDuracion(entrenamiento.duracion)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Estadísticas generales */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Estadísticas</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="fitness-outline" size={24} color="#FF6B6B" />
                  <Text style={styles.statValue}>{entrenamiento.ejercicios.length}</Text>
                  <Text style={styles.statLabel}>Ejercicios</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="repeat-outline" size={24} color="#4ECDC4" />
                  <Text style={styles.statValue}>
                    {series.completadas}/{series.totales}
                  </Text>
                  <Text style={styles.statLabel}>Series</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons name="barbell-outline" size={24} color="#45B7D1" />
                  <Text style={styles.statValue}>{pesoTotal} kg</Text>
                  <Text style={styles.statLabel}>Peso total</Text>
                </View>
              </View>
            </View>

            {/* Lista de ejercicios */}
            <View style={styles.ejerciciosSection}>
              <Text style={styles.sectionTitle}>Ejercicios realizados</Text>

              {loading ? (
                <ActivityIndicator size="small" color="#6200EE" />
              ) : (
                <>
                  {entrenamiento.ejercicios.map((ejercicio, index) => {
                    const infoEjercicio = ejerciciosInfo[ejercicio.ejercicioId];
                    const seriesCompletadas = ejercicio.series?.filter(
                      s => s.completada && !s.saltada
                    ).length || 0;
                    return (
                      <View key={index} style={styles.ejercicioCard}>
                        <View style={styles.ejercicioHeader}>
                          <Text style={styles.ejercicioNombre}>
                            {infoEjercicio?.nombre || `Ejercicio ${ejercicio.ejercicioId}`}
                          </Text>
                          <View style={styles.ejercicioBadge}>
                            <Text style={styles.ejercicioBadgeText}>
                              {seriesCompletadas}/{ejercicio.series?.length || 0} series
                            </Text>
                          </View>
                        </View>

                        {/* Series del ejercicio */}
                        <View style={styles.seriesContainer}>
                          {ejercicio.series?.map((serie, serieIndex) => (
                            <View key={serieIndex} style={styles.serieRow}>
                              <Text style={styles.serieNumero}>#{serieIndex + 1}</Text>
                              {serie.saltada ? (
                                <Text style={styles.serieSaltada}>Saltada</Text>
                              ) : serie.completada ? (
                                <Text style={styles.serieInfo}>
                                  {serie.peso} kg × {serie.repeticiones} reps
                                </Text>
                              ) : (
                                <Text style={styles.serieIncompleta}>No completada</Text>
                              )}
                            </View>
                          ))}
                        </View>

                        {/* Valoración del ejercicio */}
                        {ejercicio.valoracion && (
                          <View style={styles.valoracionContainer}>
                            <View style={styles.valoracionItem}>
                              <Text style={styles.valoracionLabel}>Satisfacción</Text>
                              <Text style={styles.valoracionEmoji}>
                                {getEmojiSatisfaccion(ejercicio.valoracion.satisfaccion)}
                              </Text>
                            </View>
                            <View style={styles.valoracionItem}>
                              <Text style={styles.valoracionLabel}>Esfuerzo</Text>
                              <Text style={styles.valoracionEmoji}>
                                {getEmojiEsfuerzo(ejercicio.valoracion.esfuerzo)}
                              </Text>
                            </View>
                            <View style={styles.valoracionItem}>
                              <Text style={styles.valoracionLabel}>Dificultad</Text>
                              <View
                                style={[
                                  styles.dificultadBadge,
                                  { backgroundColor: getColorDificultad(ejercicio.valoracion.dificultad) }
                                ]}
                              >
                                <Text style={styles.dificultadText}>
                                  {ejercicio.valoracion.dificultad}/5
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}

                        {ejercicio.valoracion?.notas && (
                          <View style={styles.notasContainer}>
                            <Text style={styles.notasLabel}>Notas:</Text>
                            <Text style={styles.notasText}>{ejercicio.valoracion.notas}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {entrenamiento.analisisIA && entrenamiento.analisisIA.analisis && (
                    <View style={styles.seccionAnalisisIA}>
                      <View style={styles.headerAnalisisIA}>
                        <Ionicons name="bulb-outline" size={24} color="#6200EE" />
                        <Text style={styles.tituloAnalisisIA}>Análisis IA</Text>
                      </View>

                      <View style={styles.contenidoAnalisisIA}>
                        <Text style={styles.textoAnalisisIA}>
                          {entrenamiento.analisisIA.analisis}
                        </Text>

                        {entrenamiento.analisisIA.metricas && (
                          <View style={styles.metricasIAContainer}>
                            <View style={styles.metricaIA}>
                              <Text style={styles.valorMetricaIA}>
                                {entrenamiento.analisisIA.metricas.promedioSatisfaccion}/5
                              </Text>
                              <Text style={styles.labelMetricaIA}>Satisfacción</Text>
                            </View>
                            <View style={styles.metricaIA}>
                              <Text style={styles.valorMetricaIA}>
                                {entrenamiento.analisisIA.metricas.promedioEsfuerzo}/5
                              </Text>
                              <Text style={styles.labelMetricaIA}>Esfuerzo</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoSection: {
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoCardHalf: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginTop: 2,
  },
  statsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ejerciciosSection: {
    marginBottom: 20,
  },
  ejercicioCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ejercicioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ejercicioNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
  },
  ejercicioBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ejercicioBadgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  seriesContainer: {
    marginBottom: 12,
  },
  serieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  serieNumero: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  serieInfo: {
    fontSize: 14,
    color: '#212121',
    flex: 1,
  },
  serieSaltada: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  serieIncompleta: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  valoracionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  valoracionItem: {
    alignItems: 'center',
  },
  valoracionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  valoracionEmoji: {
    fontSize: 24,
  },
  dificultadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dificultadText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  notasContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  notasLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notasText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  seccionAnalisisIA: {
  marginTop: 20,
  backgroundColor: "#F8F5FF",
  borderRadius: 12,
  padding: 15,
},
headerAnalisisIA: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
},
tituloAnalisisIA: {
  fontSize: 18,
  fontWeight: "bold",
  color: "#333",
},
contenidoAnalisisIA: {
  flex:1,
  backgroundColor: "#FFF",
  borderRadius: 8,
  padding: 12,
},
textoAnalisisIA: {
  fontSize: 14,
  lineHeight: 22,
  color: "#444",
},
metricasIAContainer: {
  flexDirection: "row",
  justifyContent: "space-around",
  marginTop: 15,
  paddingTop: 15,
  borderTopWidth: 1,
  borderTopColor: "#E0E0E0",
},
metricaIA: {
  alignItems: "center",
},
valorMetricaIA: {
  fontSize: 20,
  fontWeight: "bold",
  color: "#6200EE",
},
labelMetricaIA: {
  fontSize: 12,
  color: "#666",
  marginTop: 4,
},
});