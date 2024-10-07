import {Router} from "express";

import * as salesController from "../controllers/sales.controller.js";
import {addBillNumber} from "../middlewares/billNumber.js";

const router = Router();
router.post("/sales/stitchBill", addBillNumber, salesController.addStitchBill); // -> /api/v1/admin/stitchBill
router.post("/sales/soldBill", addBillNumber, salesController.addSoldBill); // -> /api/v1/admin/soldBill
router.patch("/sales/soldBill/:id", salesController.updateSoldBill); // -> /api/v1/admin/soldBill/:id
router.patch("/sales/stitchBill/:id", salesController.updateStitchedBill); // -> /api/v1/admin/stitchBill/:id
router.delete("/sales/soldBill/:id", salesController.deleteSoldBill); // -> /api/v1/admin/deleteSoldBill/:id
router.delete("/sales/stitchBill/:id", salesController.deleteStitchBill); // -> /api/v1/admin/deleteSoldBill/:id
router.get("/sales/stitchCustomerList", salesController.getStitchCustomersList); // -> /api/v1/admin/stitchCustomerList
router.get("/sales/soldCustomerList", salesController.getSoldCustomersList); // -> /api/v1/admin/soldCustomerList
export default router;
