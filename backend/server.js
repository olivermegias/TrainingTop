const express = require("express");
const connectDB = require("./database.js");
const ejerciciosRoutes = require("./routes/ejercicios.js");
const usuariosRoutes = require("./routes/usuarios.js");
const rutinasRoutes = require("./routes/rutinas.js");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Conectar a la base de datos
connectDB();

// Middleware para manejar CORS (si es necesario, puedes personalizarlo)
app.use(cors({
  origin: "*", // Permitir todas las conexiones o puedes definir un dominio específico
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// Middleware para manejar JSON con UTF-8
app.use(express.json({ limit: "10mb", type: "application/json" }));
app.use(express.json({ charset: 'utf-8' }));


// Rutas
app.use("/ejercicios", ejerciciosRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/rutinas", rutinasRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
