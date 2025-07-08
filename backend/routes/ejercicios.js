const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const pLimit = require("p-limit").default;
const Ejercicio = require("../models/Ejercicios.js");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Límite de concurrencia para evitar sobrecarga en Cloudinary
const limit = pLimit(5);

// Función para descargar una imagen localmente antes de subirla
const descargarImagen = async (url, filename) => {
  const filePath = path.join(__dirname, filename);
  const writer = fs.createWriteStream(filePath);

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      timeout: 10000, // Evita que una imagen bloqueada cuelgue el proceso
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(`⚠️ Error descargando imagen ${url}:`, error.message);
    return null;
  }
};

// Subir imágenes a Cloudinary con control de concurrencia
const subirImagenACloudinary = async (imagenUrl, nombreEjercicio, indice) => {
  try {
    console.log(`📥 Descargando imagen: ${imagenUrl}`);
    const tempPath = await descargarImagen(imagenUrl, `temp_${indice}.jpg`);

    if (!tempPath) {
      console.error(`❌ No se pudo descargar la imagen: ${imagenUrl}`);
      return null;
    }

    console.log(`📤 Subiendo imagen a Cloudinary: ${tempPath}`);

    const result = await cloudinary.uploader.upload(tempPath, {
      folder: `ejercicios/${nombreEjercicio.replace(/[^a-zA-Z0-9_-]/g, "_")}`, // Reemplaza caracteres inválidos
      use_filename: true,
      unique_filename: false, // Permite sobrescribir si ya existe
    });

    // Eliminar el archivo temporal después de subirlo
    await fs.promises.unlink(tempPath);

    return result.secure_url;
  } catch (error) {
    console.error(
      `❌ Error subiendo imagen a Cloudinary (${imagenUrl}):`,
      error.message
    );
    return null;
  }
};

router.get("/importar", async (req, res) => {
  try {
    const url =
      "https://raw.githubusercontent.com/0x10-z/free-exercise-db-es/refs/heads/main/dist/exercises_es.json";

    const response = await axios.get(url);
    const ejercicios = response.data;

    for (const ejercicio of ejercicios) {
      if (!ejercicio.id || !ejercicio.name) {
        console.log("⚠️ Ejercicio sin ID o nombre:", ejercicio);
        continue;
      }

      const ejercicioExistente = await Ejercicio.findOne({ id: ejercicio.id });

      let imagenesCloudinary = [];

      if (ejercicioExistente && ejercicioExistente.imagenes.length > 0) {
        console.log(
          `🔄 Ejercicio ${ejercicio.id} ya tiene imágenes, saltando subida.`
        );
        imagenesCloudinary = ejercicioExistente.imagenes;
      } else {
        const promesasImagenes = (ejercicio.images || []).map((imagen, i) =>
          limit(() =>
            subirImagenACloudinary(
              `https://raw.githubusercontent.com/0x10-z/free-exercise-db-es/main/exercises/${imagen}`,
              ejercicio.name,
              i
            )
          )
        );

        imagenesCloudinary = (await Promise.all(promesasImagenes)).filter(
          Boolean
        );
      }

      if (imagenesCloudinary.length === 0) {
        console.log(
          `🚫 Ejercicio ${ejercicio.id} no tiene imágenes. Será ignorado.`
        );
        if (ejercicioExistente) {
          console.log(
            `🗑️ Eliminando ejercicio ${ejercicio.id} de la base de datos.`
          );
          await Ejercicio.deleteOne({ id: ejercicio.id });
        }
        continue; // No guardar si no hay imágenes
      }

      const ejercicioData = {
        id: ejercicio.id,
        nombre: ejercicio.name,
        fuerza: ejercicio.force,
        nivel: ejercicio.level,
        mecanica: ejercicio.mechanic,
        equipo: ejercicio.equipment,
        musculosPrimarios: ejercicio.primaryMuscles,
        musculosSecundarios: ejercicio.secondaryMuscles,
        instrucciones: ejercicio.instructions,
        categoria: ejercicio.category,
        imagenes: imagenesCloudinary,
      };

      if (ejercicioExistente) {
        console.log(`🔄 Actualizando ejercicio con ID ${ejercicioData.id}`);
        await Ejercicio.updateOne({ id: ejercicioData.id }, ejercicioData);
      } else {
        console.log(`✅ Insertando nuevo ejercicio con ID ${ejercicioData.id}`);
        await new Ejercicio(ejercicioData).save();
      }
    }

    res.status(200).json({ message: "Ejercicios importados correctamente." });
  } catch (error) {
    console.error("❌ Error al importar ejercicios:", error);
    res.status(500).json({ error: "Error al importar ejercicios." });
  }
});

// Obtener todos los ejercicios
router.get("/", async (req, res) => {
  try {
    const ejercicios = await Ejercicio.find();
    res.json(ejercicios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ejercicios." });
  }
});

// Nueva ruta: Obtener un ejercicio por ID
// Ruta para obtener ejercicios por IDs (para DetalleRutina)
const mongoose = require("mongoose");

router.get("/porIds", async (req, res) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : [];

    if (ids.length === 0) {
      return res
        .status(400)
        .json({ error: "Se requiere al menos un ID de ejercicio." });
    }

    console.log("📌 Buscando ejercicios con IDs:", ids);

    // Solo ids válidos para _id
    const objectIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    // Armamos el filtro dinámicamente
    const orConditions = [];

    if (ids.length > 0) {
      orConditions.push({ id: { $in: ids } });
    }

    if (objectIds.length > 0) {
      orConditions.push({ _id: { $in: objectIds } });
    }

    if (orConditions.length === 0) {
      // No hay ningún filtro posible
      return res.json([]);
    }

    const ejercicios = await Ejercicio.find({
      $or: orConditions,
    });

    res.json(ejercicios);
  } catch (error) {
    console.error("❌ Error al obtener ejercicios por IDs:", error);
    res.status(500).json({ error: "Error al obtener ejercicios." });
  }
});

// Ruta para obtener un ejercicio por ID
router.get("/:id", async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findOne({ id: req.params.id });

    if (!ejercicio) {
      return res.status(404).json({ error: "Ejercicio no encontrado." });
    }

    res.json(ejercicio);
  } catch (error) {
    console.error("Error al obtener ejercicio por ID:", error);
    res.status(500).json({ error: "Error al obtener ejercicio." });
  }
});

// Nueva ruta: Obtener ejercicios filtrados por categoría
router.get("/categoria/:categoria", async (req, res) => {
  try {
    const ejercicios = await Ejercicio.find({
      categoria: { $regex: req.params.categoria, $options: "i" },
    });

    res.json(ejercicios);
  } catch (error) {
    console.error("Error al obtener ejercicios por categoría:", error);
    res.status(500).json({ error: "Error al obtener ejercicios." });
  }
});

// Nueva ruta: Obtener ejercicios filtrados por músculo
router.get("/musculo/:musculo", async (req, res) => {
  try {
    const musculo = req.params.musculo;
    const ejercicios = await Ejercicio.find({
      $or: [
        { musculosPrimarios: { $regex: musculo, $options: "i" } },
        { musculosSecundarios: { $regex: musculo, $options: "i" } },
      ],
    });

    res.json(ejercicios);
  } catch (error) {
    console.error("Error al obtener ejercicios por músculo:", error);
    res.status(500).json({ error: "Error al obtener ejercicios por músculo." });
  }
});

module.exports = router;
