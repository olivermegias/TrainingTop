const express = require("express");
const { connectDB } = require("./database.js");
const ejerciciosRoutes = require("./routes/ejercicios.js");
const usuariosRoutes = require("./routes/usuarios.js");
const rutinasRoutes = require("./routes/rutinas.js");
const entrenamientosRoutes = require("./routes/entrenamientos.js");
const progresoRoutes = require("./routes/progreso.js");
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeAI } = require("./services/ollama.service");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware para manejar CORS (si es necesario, puedes personalizarlo)
app.use(
  cors({
    origin: "*", // Permitir todas las conexiones o puedes definir un dominio específico
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Middleware para manejar JSON con UTF-8
app.use(express.json({ limit: "10mb", type: "application/json" }));
app.use(express.json({ charset: "utf-8" }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use("/ejercicios", ejerciciosRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/rutinas", rutinasRoutes);
app.use("/entrenamientos", entrenamientosRoutes);
app.use("/progreso", progresoRoutes);

//IA
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    model: process.env.OLLAMA_MODEL,
    memory: process.memoryUsage(),
  });
});

async function startServer() {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Iniciar el servidor
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    });

    // Verificar que Ollama esté funcionando
    await initializeAI();

    app.listen(PORT, () => {
      console.log(`🏃 Servidor Fitness AI ejecutándose en puerto ${PORT}`);
      console.log(`📊 Modelo activo: ${process.env.OLLAMA_MODEL}`);
      console.log(
        `💾 RAM disponible: ${(
          require("os").freemem() /
          1024 /
          1024 /
          1024
        ).toFixed(2)} GB`
      );
    });
  } catch (error) {
    console.error("Error iniciando servidor:", error);
    process.exit(1);
  }
}

startServer();
