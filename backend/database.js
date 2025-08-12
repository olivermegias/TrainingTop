// database.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

let db = null;

const connectDB = async () => {
  try {
    // Conexión a MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    db = mongoose.connection.db;

    console.log("✅ Conectado a MongoDB Atlas");
    return db;
  } catch (error) {
    console.error("❌ Error al conectar a MongoDB:", error);
    process.exit(1);
  }
};

function getDB() {
  if (!db) {
    throw new Error("Database no inicializada");
  }
  return db;
}

module.exports = { connectDB, getDB };
