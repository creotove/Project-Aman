import express from "express";
import {
  addAdmin,
  addCM,
  addClothingItem,
  addCustomer,
  addHelper,
  addTailor,
  addMeasurement,
} from "../controllers/adminCtrls.js";
import { upload } from "../middlewares/multer.js";
const router = express.Router();

// POST || Creation
router.post(
  "/addAdmin",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addAdmin
);
router.post(
  "/addCM",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addCM
);
router.post(
  "/addTailor",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addTailor
);
router.post(
  "/addHelper",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addHelper
);
router.post(
  "/addCustomer",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addCustomer
);
router.post("/addCloth", addClothingItem);
router.post('/addMeasurement/:id', addMeasurement)
export default router;
