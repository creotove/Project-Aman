import {Router} from "express";
import {auth} from "../middlewares/auth.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", authController.login); // -> /api/v1/auth/login
router.post("/logout", auth, authController.logout); // -> /api/v1/auth/logout
router.post("/getAuthenticateUser", auth, authController.getAuthUser); // -> /api/v1/auth/getAuthenticateUser
router.post("/sendOTP", authController.sendOTP); // -> /api/v1/auth/sendOTP
router.post("/validateOTP", authController.validateOTP); // -> /api/v1/auth/sendOTP
router.patch("/changePassword", auth, authController.changePassword); // -> /api/v1/auth/changePassword

export default router;
