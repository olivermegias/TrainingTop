const express = require("express");
const Usuario = require("../models/Usuarios.js");
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
    const usuario = await Usuario.findOne({ uid }); // Busca por UID

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario); // Devuelve los datos del usuario
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const usuario = await Usuario.find();
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuario." });
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
