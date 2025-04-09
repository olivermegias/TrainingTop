const express = require("express");
const mongoose = require("mongoose");
const Rutina = require("../models/Rutinas");
const Usuario = require("../models/Usuarios");
const router = express.Router();

// 📌 Crear una nueva rutina
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, nivel, publica, dias } = req.body;
    console.log(req.body)

    if (!nombre || !dias || !Array.isArray(dias)) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Validar que los ejercicios tienen un `id` válido
    const nuevaRutina = new Rutina({
      nombre,
      descripcion,
      nivel,
      publica,
      dias: dias.map(dia => ({
        nombre: dia.nombre,
        ejercicios: dia.ejercicios.map(ejercicio => ({
          ejercicio: ejercicio.ejercicio, // Guardamos `id`, NO `_id`
          series: ejercicio.series,
          repeticiones: ejercicio.repeticiones,
          descanso: ejercicio.descanso
        }))
      }))
    });

    const rutinaGuardada = await nuevaRutina.save();
    res.status(201).json(rutinaGuardada);
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
    res.status(500).json({ error: "Error al obtener rutinas" });
  }
});

// 📌 Obtener solo rutinas públicas
router.get("/publicas", async (req, res) => {
  try {
    const rutinas = await Rutina.find({ publica: true }).populate("dias.ejercicios.ejercicio");
    res.json(rutinas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener rutinas públicas" });
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
      return res.status(403).json({ error: "No puedes modificar una rutina pública" });
    }

    const rutinaActualizada = await Rutina.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(rutinaActualizada);
  } catch (error) {
    res.status(500).json({ error: "Error al modificar la rutina" });
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
      return res.status(403).json({ error: "No puedes eliminar una rutina pública" });
    }

    await Rutina.findByIdAndDelete(req.params.id);
    res.json({ message: "Rutina eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la rutina" });
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
      return res.status(403).json({ error: "Solo se pueden asignar rutinas públicas" });
    }

    if (!usuario.rutinas) {
      usuario.rutinas = [];
    }

    // Evitar duplicados
    if (!usuario.rutinas.includes(rutinaId)) {
      usuario.rutinas.push(rutinaId);
      await usuario.save();
    }

    res.json({ message: "Rutina asignada correctamente", rutinas: usuario.rutinas });
  } catch (error) {
    res.status(500).json({ error: "Error al asignar la rutina" });
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

    usuario.rutinas = usuario.rutinas.filter(id => id.toString() !== rutinaId);
    await usuario.save();

    res.json({ message: "Rutina desasignada correctamente", rutinas: usuario.rutinas });
  } catch (error) {
    res.status(500).json({ error: "Error al desasignar la rutina" });
  }
});

router.get("/usuario/:uid", async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ uid: req.params.uid }).populate("rutinas");

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario.rutinas );
  } catch (error) {
    console.error("❌ Error al obtener las rutinas del usuario:", error);
    res.status(500).json({ error: "Error al obtener las rutinas del usuario" });
  }
});

module.exports = router;