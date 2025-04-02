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
    const usuario = await Usuario.findOne({ uid });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(usuario);
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

module.exports = router;
