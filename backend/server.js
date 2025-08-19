const express = require("express");
const { connectDB } = require("./database.js");
const ejerciciosRoutes = require("./routes/ejercicios.js");
const usuariosRoutes = require("./routes/usuarios.js");
const rutinasRoutes = require("./routes/rutinas.js");
const entrenamientosRoutes = require("./routes/entrenamientos.js");
const progresoRoutes = require("./routes/progreso.js");
const iaRoutes = require("./routes/ia.js"); // AÑADIR ESTA LÍNEA
const cors = require("cors");
const dotenv = require("dotenv");
const { initializeAI } = require("./services/ollama.service");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware para manejar CORS
app.use(
  cors({
    origin: "*",
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
app.use("/ia", iaRoutes); // AÑADIR ESTA LÍNEA

// Health check para IA
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    model: process.env.OLLAMA_MODEL,
    memory: process.memoryUsage(),
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
      console.log(
        `📊 Modelo activo: ${process.env.OLLAMA_MODEL || "No configurado"}`
      );
      console.log(
        `💾 RAM disponible: ${(
          require("os").freemem() /
          1024 /
          1024 /
          1024
        ).toFixed(2)} GB`
      );
    });

    try {
      await initializeAI();
      console.log("✅ Servicio de IA inicializado correctamente");
    } catch (iaError) {
      console.log("⚠️ Servicio de IA no disponible:", iaError.message);
      console.log("   El servidor funcionará sin análisis de IA");
    }
  } catch (error) {
    console.error("Error iniciando servidor:", error);
    process.exit(1);
  }
}

startServer();
