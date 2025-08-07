const express = require("express");
const Rutina = require("../models/Rutinas");
const Usuario = require("../models/Usuarios");
const router = express.Router();

// 📌 Crear una nueva rutina
router.post("/", async (req, res) => {
  try {
    console.log("🔥 Petición POST recibida en /rutinas");
    console.log("📦 Body recibido:", req.body);
    const {
      nombre,
      descripcion,
      nivel,
      publica,
      dias,
      usuarioId,
      fechaCreacion,
    } = req.body;

    console.log("👤 Buscando usuario con ID:", usuarioId); // ← NUEVO LOG

    if (!nombre || !dias || !Array.isArray(dias)) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Crear la nueva rutina
    const nuevaRutina = new Rutina({
      nombre,
      descripcion,
      nivel,
      publica,
      usuarioId,
      fechaCreacion,
      dias: dias.map((dia) => ({
        nombre: dia.nombre,
        ejercicios: dia.ejercicios.map((ejercicio) => ({
          ejercicio: ejercicio.ejercicio,
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
          descanso: ejercicio.descanso,
          peso: ejercicio.peso || undefined,
        })),
      })),
    });

    console.log("💾 Guardando rutina..."); // ← NUEVO LOG
    const rutinaGuardada = await nuevaRutina.save();
    console.log("✅ Rutina guardada con ID:", rutinaGuardada._id); // ← NUEVO LOG

    // ASIGNAR LA RUTINA AL USUARIO AUTOMÁTICAMENTE
    console.log("🔍 Buscando usuario en BD..."); // ← NUEVO LOG
    const usuario = await Usuario.findOne({ uid: usuarioId });
    console.log("👤 Usuario encontrado:", usuario ? "SÍ" : "NO"); // ← NUEVO LOG

    if (!usuario) {
      console.log("❌ Usuario no encontrado con uid:", usuarioId); // ← NUEVO LOG
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Inicializar array de rutinas si no existe
    if (!usuario.rutinas) {
      usuario.rutinas = [];
    }

    // Evitar duplicados y añadir la rutina
    if (!usuario.rutinas.includes(rutinaGuardada._id)) {
      usuario.rutinas.push(rutinaGuardada._id);
      await usuario.save();
      console.log("✅ Usuario actualizado con nueva rutina"); // ← NUEVO LOG
    }

    res.status(201).json({
      message: "Rutina creada y asignada correctamente",
      rutina: rutinaGuardada,
      usuarioActualizado: {
        id: usuario._id,
        rutinas: usuario.rutinas,
      },
    });
  } catch (error) {
    console.error("❌ Error al crear rutina:", error);
    res.status(500).json({ error: "Error al guardar la rutina" });
  }
});
// 📌 Obtener todas las rutinas
router.get("/", async (req, res) => {
  try {
    const rutinas = await Rutina.find().populate("dias.ejercicios.ejercicio");
    res.json(rutinas);
  } catch (error) {
    res.status(500).json({ error: `Error al obtener rutinas: ` + error.message });
  }
});

// 📌 Obtener solo rutinas públicas
router.get("/publicas", async (req, res) => {
  try {
    const rutinas = await Rutina.find({ publica: true }).populate(
      "dias.ejercicios.ejercicio"
    );
    res.json(rutinas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener rutinas públicas" + error.message });
  }
});

// 📌 Modificar una rutina (Solo si no es pública)
router.put("/:id", async (req, res) => {
  try {
    const rutina = await Rutina.findById(req.params.id);
    if (!rutina) {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    if (rutina.publica) {
      return res
        .status(403)
        .json({ error: "No puedes modificar una rutina pública" });
    }

    const rutinaActualizada = await Rutina.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(rutinaActualizada);
  } catch (error) {
    res.status(500).json({ error: `Error al modificar la rutina: ${error.message}` });
  }
});

// 📌 Eliminar una rutina (No permite eliminar rutinas públicas)
router.delete("/:id", async (req, res) => {
  try {
    const rutina = await Rutina.findById(req.params.id);
    if (!rutina) {
      return res.status(404).json({ error: "Rutina no encontrada" });
    }
    if (rutina.publica) {
      return res
        .status(403)
        .json({ error: "No puedes eliminar una rutina pública" });
    }

    await Rutina.findByIdAndDelete(req.params.id);
    res.json({ message: "Rutina eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: `Error al eliminar la rutina: ${error.message}` });
  }
});

// 📌 Asignar una rutina pública a un usuario (sin duplicarla en la DB)
router.post("/asignar", async (req, res) => {
  try {
    const { usuarioId, rutinaId } = req.body;
    const usuario = await Usuario.findOne({ uid: usuarioId });
    const rutina = await Rutina.findById(rutinaId);

    if (!usuario || !rutina) {
      return res.status(404).json({ error: "Usuario o rutina no encontrados" });
    }
    if (!rutina.publica) {
      return res
        .status(403)
        .json({ error: "Solo se pueden asignar rutinas públicas" });
    }

    if (!usuario.rutinas) {
      usuario.rutinas = [];
    }

    // Crear una nueva rutina privada basada en la rutina pública
    const nuevaRutina = new Rutina({
      nombre: rutina.nombre,
      descripcion: rutina.descripcion,
      ejercicios: rutina.ejercicios,
      creador: usuarioId,
      publica: false,
      ...rutina.toObject(),
      _id: undefined,
    });

    const rutinaGuardada = await nuevaRutina.save();

    // Asignar la nueva rutina privada al usuario
    if (!usuario.rutinas.includes(rutinaGuardada._id)) {
      usuario.rutinas.push(rutinaGuardada._id);
      await usuario.save();
    }

    res.json({
      message: "Rutina asignada correctamente",
      rutinas: usuario.rutinas,
      nuevaRutinaId: rutinaGuardada._id,
    });
  } catch (error) {
    res.status(500).json({ error: `Error al asignar la rutina ${error.message}` });
  }
});

// 📌 Desasignar una rutina pública de un usuario
router.post("/desasignar", async (req, res) => {
  try {
    const { usuarioId, rutinaId } = req.body;
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    usuario.rutinas = usuario.rutinas.filter(
      (id) => id.toString() !== rutinaId
    );
    await usuario.save();

    res.json({
      message: "Rutina desasignada correctamente",
      rutinas: usuario.rutinas,
    });
  } catch (error) {
    res.status(500).json({ error: `Error al desasignar la rutina: ${error.message}`  });
  }
});

router.get("/usuario/:uid", async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ uid: req.params.uid }).populate(
      "rutinas"
    );

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario.rutinas);
  } catch (error) {
    console.error("❌ Error al obtener las rutinas del usuario:", error);
    res.status(500).json({ error: "Error al obtener las rutinas del usuario" });
  }
});

module.exports = router;
