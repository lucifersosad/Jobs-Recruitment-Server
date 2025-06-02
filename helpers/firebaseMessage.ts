const admin = require("firebase-admin");

// Khởi tạo Firebase Admin SDK với service account key
// const serviceAccount = require("../firebase-config.json");

const serviceAccount = {
  type: "service_account",
  project_id: "jobs-employment-utem",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: "firebase-adminsdk-fbsvc@jobs-employment-utem.iam.gserviceaccount.com",
  client_id: "104760828291472319741",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40jobs-employment-utem.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

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
