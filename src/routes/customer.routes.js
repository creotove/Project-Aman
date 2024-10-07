import {Router} from "express";
import {upload} from "../middlewares/multer.js";
import * as customerController from "../controllers/customer.controller.js";
const router = Router();
router.patch("/customers/:id", upload.single("avatar"), customerController.updateCustomer); // -> /api/v1/admin/customer/:id
router.get("/customers/bills/:id", customerController.getCustomerBills); // -> /api/v1/admin/bills/:id
router.get("/customers/:id", customerController.getCustomerProfile); // -> /api/v1/admin/customer/:id
router.delete("/customers/:id", customerController.deleteCustomer); // -> /api/v1/admin/deleteCustomer/:id
router.get("/customers", customerController.getAllCustomersList); // -> /api/v1/admin/customers
router.get("/customers/searchCustomerBasedOnPhoneNumber/:phoneNumber", customerController.searchCustomerBasedOnPhoneNumber); // -> /api/v1/admin/searchCustomerBasedOnPhoneNumber/:phoneNumber
router.get("/customers/searchCustomersBasedOnName/:name", customerController.searchCustomerBasedOnName);

export default router;
