const { google } = require('googleapis');
const readline = require('readline');

// Thông tin từ Google Developer Console
const CLIENT_ID = 'YOUR_CLIENT_ID';  // Thay bằng Client ID của bạn
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';  // Thay bằng Client Secret của bạn
const REDIRECT_URI = 'http://localhost';  // URI chuyển hướng của bạn

// Khởi tạo OAuth2 client
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Tạo URL xác thực để người dùng cấp quyền
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',  // Đảm bảo yêu cầu refresh token
  scope: ['https://www.googleapis.com/auth/drive'],  // Cung cấp quyền bạn cần
});

console.log('Authorize this app by visiting this URL:', authUrl);

// Sử dụng readline để nhận mã xác thực từ người dùng
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  try {
    // Đổi mã xác thực lấy access_token và refresh_token
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('Access Token:', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
    
    // Lưu refresh_token vào .env hoặc nơi khác bạn muốn
    process.env.REFRESH_TOKEN = tokens.refresh_token;
    console.log('Refresh token has been saved to .env');

    rl.close();
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    rl.close();
  }
});
