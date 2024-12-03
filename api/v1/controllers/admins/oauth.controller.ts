import dotenv from "dotenv";
import { google } from "googleapis";

// Load environment variables
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Tạo URL xác thực cho người dùng
export const getAuthUrl = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", 
    scope: ["https://www.googleapis.com/auth/drive"],
  });

  res.redirect(authUrl);
};

// Xử lý callback từ Google và lấy token
export const getTokens = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    // Đổi authorization code lấy access_token và refresh_token
    const { tokens } = await oauth2Client.getToken(code);

    res.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    res.status(500).send("Error retrieving tokens.");
  }
};
