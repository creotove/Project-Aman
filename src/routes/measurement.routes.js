import {Router} from "express";
import * as measurementController from "../controllers/measurement.controller.js";
const router = Router();

router.post("/measurements/checkMeasurements", measurementController.checkMeasurements); // -> /api/v1/admin/checkMeasurements
router.get("/measurements/clothingItemMeasurementNames/:name", measurementController.getClothingItemMeasurementNames); // -> /api/v1/admin/clothingItemMeasurementNames/:name
router.post("/measurements/:id", measurementController.addMeasurement); // -> /api/v1/admin/measurement

export default router;
