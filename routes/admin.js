import express from "express";
import {
  addAdmin,
  addHelper,
  addCM,
  addTailor,
  // addCustomer,
  addClothingItem,
  addMeasurement,
  addSoldBill,
  addStitchBill,
  updateEmployee,
  updateCustomer,
  getCustomers,
  getCustomer,
  getEmployee,
  getEmployees,
  getCustomerProfile,
  getCustomerBills,
  getAnalytics,
} from "../controllers/adminCtrls.js";
import { upload } from "../middlewares/multer.js";
import { addBillNumber } from "../middlewares/billNumber.js";
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
); // -> /api/admin/addCM

router.post(
  "/addTailor",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addTailor
); // -> /api/admin/addTailor

router.post(
  "/addHelper",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addHelper
); // -> /api/admin/addHelper

// router.post(
//   "/addCustomer",
//   upload.fields([
//     {
//       name: "avatar",
//       maxCount: 1,
//     },
//   ]),
//   addCustomer
// ); // -> /api/admin/addCustomer

router.post(
  "/addCloth",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addClothingItem
); // -> /api/admin/addCloth

router.post(
  "/addMeasurement/:id",
  upload.fields([
    {
      name: "drawung",
      maxCount: 1,
    },
  ]),
  addMeasurement
); // -> /api/admin/addMeasurement

router.post("/addStitchBill", addBillNumber, addStitchBill); // -> /api/admin/addStitchBill

router.post("/addSoldBill", addBillNumber, addSoldBill); // -> /api/admin/addSoldBill

// PATCH || Update
router.patch(
  "/updateEmployee/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateEmployee
); // -> /api/admin/updateEmployee/:id

router.patch(
  "/updateCustomer/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateCustomer
); // -> /api/admin/updateCustomer/:id

// GET || Read
router.get("/customers", getCustomers); // -> /api/admin/customers
router.get("/customer/:id", getCustomerProfile); // -> /api/admin/customer/:id
router.get("/bills/:id", getCustomerBills); // -> /api/admin/bills/:id
router.get("/employees", getEmployees); // -> /api/admin/employees
router.get("/employee/:id", getEmployee); // -> /api/admin/employees/:id
router.get("/analytics", getAnalytics); // -> /api/admin/analytics

export default router;
