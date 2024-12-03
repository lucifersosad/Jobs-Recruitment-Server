import { Router } from "express";
import * as controller from "../../controllers/admins/oauth.controller";

const router: Router = Router();

// Route để lấy URL xác thực
router.get('/', controller.getAuthUrl);

// Route để xử lý callback từ Google và lấy tokens
router.get('/callback', controller.getTokens);

export const oauthRoutes: Router = router