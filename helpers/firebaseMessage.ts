const admin = require("firebase-admin");

// Khởi tạo Firebase Admin SDK với service account key
const serviceAccount = require("../firebase-config.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const messaging = admin.messaging();

const sendSingleMessage = async (token, messageData) => {
  const { title, body, data } = messageData;

  try {
    const message = <any>{
      token,
      notification: { title, body },
    };

    if (data) {
      message.data = data;
    }

    const response = await messaging.send(message);
    console.log("🚀 ~ sendSingleMessage ~ success:", response)
  } catch (error) {
    console.log("🚀 ~ sendSingleMessage ~ error:", error)
  }
};

export { sendSingleMessage };
