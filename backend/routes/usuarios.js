const express = require("express");
const Usuario = require("../models/Usuarios");
const admin = require("../firebaseAdmin.js");
const router = express.Router();

const registrarUsuario = async (uid, email, nombre) => {
  try {
    const nuevoUsuario = new Usuario({ uid, email, nombre });
    await nuevoUsuario.save();
    console.log(`✅ Usuario ${email} registrado en MongoDB`);
  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
  }
};

router.post("/registro", async (req, res) => {
  const { token, nombre } = req.body;

  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    await registrarUsuario(decodedToken.uid, decodedToken.email, nombre);
    res.status(200).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    res.status(500).json({ error: "Error al procesar usuario" });
  }
});

// Ruta para obtener usuario por UID
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    console.log("🔍 Buscando usuario con UID:", uid);

    const usuario = await Usuario.findOne({ uid });
    console.log("✅ Usuario encontrado:", usuario ? "Sí" : "No");

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (error) {
    console.error("❌ Error detallado al obtener usuario:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error en el servidor",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.put("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const datosActualizar = req.body;

    // Buscar el usuario
    const usuario = await Usuario.findOne({ uid });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Guardar el peso anterior para comparación
    const pesoAnterior = usuario.peso;

    // Lista de campos que NO deben ser actualizados directamente
    const camposProtegidos = [
      "historialPeso",
      "_id",
      "uid",
      "email",
      "fechaRegistro",
    ];

    // Actualizar solo los campos permitidos
    Object.keys(datosActualizar).forEach((key) => {
      if (
        !camposProtegidos.includes(key) &&
        datosActualizar[key] !== undefined
      ) {
        usuario[key] = datosActualizar[key];
      }
    });

    // Si se actualiza el peso y es diferente al anterior, añadir al historial
    if (
      datosActualizar.peso !== undefined &&
      datosActualizar.peso !== null &&
      datosActualizar.peso !== pesoAnterior
    ) {
      console.log("🏋️ Peso cambió de", pesoAnterior, "a", datosActualizar.peso);

      // Inicializar historialPeso si no existe
      if (!usuario.historialPeso) {
        usuario.historialPeso = [];
      }

      // Añadir al historial
      usuario.historialPeso.push({
        peso: parseFloat(datosActualizar.peso),
        fecha: new Date(),
      });

      // Limitar el historial a los últimos 100 registros
      if (usuario.historialPeso.length > 100) {
        usuario.historialPeso = usuario.historialPeso.slice(-100);
      }
    }

    // Guardar cambios
    const usuarioActualizado = await usuario.save();

    res.json(usuarioActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({
      error: "Error al actualizar usuario",
      details: error.message,
    });
  }
});

// Obtener historial de peso
router.get("/:uid/historial-peso", async (req, res) => {
  try {
    const { uid } = req.params;
    const { limite = 30 } = req.query;

    const usuario = await Usuario.findOne({ uid }).select("historialPeso");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolver los últimos N registros
    const historial = usuario.historialPeso?.slice(-limite) || [];

    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial de peso:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// Añadir un nuevo registro de peso
router.post("/:uid/historial-peso", async (req, res) => {
  try {
    const { uid } = req.params;
    const { peso } = req.body;

    if (!peso || peso <= 0) {
      return res.status(400).json({ error: "Peso inválido" });
    }

    const usuario = await Usuario.findOne({ uid });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Añadir al historial
    usuario.historialPeso.push({
      peso,
      fecha: new Date(),
    });

    // Actualizar peso actual
    usuario.peso = peso;

    // Limitar el historial
    if (usuario.historialPeso.length > 100) {
      usuario.historialPeso = usuario.historialPeso.slice(-100);
    }

    await usuario.save();

    res.json({
      message: "Peso registrado correctamente",
      pesoActual: usuario.peso,
      historial: usuario.historialPeso.slice(-30), // Devolver últimos 30
    });
  } catch (error) {
    console.error("Error al registrar peso:", error);
    res.status(500).json({ error: "Error al registrar peso" });
  }
});

// Eliminar un registro del historial de peso
router.delete("/:uid/historial-peso/:registroId", async (req, res) => {
  try {
    const { uid, registroId } = req.params;

    const usuario = await Usuario.findOne({ uid });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.historialPeso = usuario.historialPeso.filter(
      (registro) => registro._id.toString() !== registroId
    );

    await usuario.save();

    res.json({ message: "Registro eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    res.status(500).json({ error: "Error al eliminar registro" });
  }
});

router.get("/", async (req, res) => {
  try {
    const usuario = await Usuario.find();
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario." + error.message });
  }
});

// Obtener rutina activa
router.get("/:uid/rutina-activa", async (req, res) => {
  try {
    const { uid } = req.params;
    const usuario = await Usuario.findOne({ uid }).populate("rutinaActiva");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Buscar progreso de la rutina activa
    let progreso = null;
    if (usuario.rutinaActiva) {
      progreso = usuario.progresoRutinas.find(
        (p) => p.rutinaId.toString() === usuario.rutinaActiva._id.toString()
      );
    }

    res.json({
      rutinaActiva: usuario.rutinaActiva,
      progreso: progreso || { diaActual: 0 },
    });
  } catch (error) {
    console.error("Error al obtener rutina activa:", error);
    res.status(500).json({ error: "Error al obtener rutina activa" });
  }
});

// Actualizar rutina activa
router.put("/:uid/rutina-activa", async (req, res) => {
  try {
    const { uid } = req.params;
    const { rutinaId } = req.body;

    // Verificar que la rutina existe y pertenece al usuario
    const usuario = await Usuario.findOne({ uid }).populate("rutinas");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que el usuario tiene acceso a esta rutina
    const tieneAcceso = usuario.rutinas.some(
      (r) => r._id.toString() === rutinaId
    );

    if (!tieneAcceso) {
      // Verificar si es una rutina pública
      const Rutina = require("../models/Rutinas");
      const rutina = await Rutina.findById(rutinaId);

      if (!rutina || !rutina.publica) {
        return res
          .status(403)
          .json({ error: "No tienes acceso a esta rutina" });
      }
    }

    // Actualizar rutina activa
    usuario.rutinaActiva = rutinaId;

    // Inicializar progreso si no existe
    const progresoExistente = usuario.progresoRutinas.find(
      (p) => p.rutinaId.toString() === rutinaId
    );

    if (!progresoExistente) {
      usuario.progresoRutinas.push({
        rutinaId,
        diaActual: 0,
        ultimaEjecucion: null,
      });
    }

    await usuario.save();

    // Devolver usuario actualizado con la rutina poblada
    const usuarioActualizado = await Usuario.findOne({ uid }).populate(
      "rutinaActiva"
    );

    res.json({
      message: "Rutina activa actualizada correctamente",
      rutinaActiva: usuarioActualizado.rutinaActiva,
      progreso: usuario.progresoRutinas.find(
        (p) => p.rutinaId.toString() === rutinaId
      ),
    });
  } catch (error) {
    console.error("Error al actualizar rutina activa:", error);
    res.status(500).json({ error: "Error al actualizar rutina activa" });
  }
});

// Obtener progreso de una rutina específica (para el modal de selección de día)
router.get("/:uid/progreso-rutina/:rutinaId", async (req, res) => {
  try {
    const { uid, rutinaId } = req.params;
    const usuario = await Usuario.findOne({ uid });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const progreso = usuario.progresoRutinas.find(
      (p) => p.rutinaId.toString() === rutinaId
    );

    res.json({
      diaActual: progreso?.diaActual || 0,
      ultimaEjecucion: progreso?.ultimaEjecucion,
    });
  } catch (error) {
    console.error("Error al obtener progreso:", error);
    res.status(500).json({ error: "Error al obtener progreso" });
  }
});

module.exports = router;
