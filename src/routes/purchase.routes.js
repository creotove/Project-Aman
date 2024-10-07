import {Router} from "express";
import * as purchaseController from "../controllers/purchase.controller.js";
const router = Router();

router.get("/purchases/wholeSalers", purchaseController.getWholeSalers); // -> /api/v1/admin/wholeSalers
router.get("/purchases/wholeSaler/:id", purchaseController.getWholeSaler); // -> /api/v1/admin/wholeSaler/:id
router.get("/purchases/wholeSaleBills", purchaseController.getWholeSaleBills); // -> /api/v1/admin/wholeSaleBills
router.get("/purchases/wholeSaleBill/:id", purchaseController.getWholeSaleBill); // -> /api/v1/admin/wholeSaleBill/:id
router.get("/purchases/wholeSalerIdName", purchaseController.getWholeSalerIdName); // -> /api/v1/admin/wholeSalerIdName
router.post("/purchases/wholeSaler", purchaseController.addWholeSaler); // -> /api/v1/admin/wholeSaler
router.post("/purchases/wholeSaleBill", purchaseController.addWholeSaleBill); // -> /api/v1/admin/wholeSaleBill

export default router;
