const admin = require("firebase-admin");
const serviceAccount = require("./trainingtop-d3963-firebase-adminsdk-fbsvc-e9623cab7c.json");

// Verifica si ya existe una instancia inicializada de Firebase antes de volver a inicializar
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
