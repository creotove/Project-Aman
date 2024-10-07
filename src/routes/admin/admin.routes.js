import express from "express";
import * as adminController from "../../controllers/admin.controller.js";
import {upload} from "../../middlewares/multer.js";
const router = express.Router();

// POST || Creation
router.post(
  "/",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  adminController.addAdmin
); // -> /api/v1/admin/addAdmin

router.get("/analytics", adminController.getAnalytics); // -> /api/v1/admin/analytics

export default router;
