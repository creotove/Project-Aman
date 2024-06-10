import express from "express";
import {
  addAdmin,
  addEmployee,
  addClothingItem,
  addMeasurement,
  checkMeasurements,
  addSoldBill,
  addStitchBill,
  addWorkForEmployee,
  addAdvanceForEmployee,
  addFabricItem,
  addWholeSaler,
  addWholeSaleBill,
  giveMoneyToEmployee,
  removeAdvanceFromEmployee,
  updateEmployee,
  updateEmployeeProfile,
  updateCustomer,
  updateClothingItem,
  updateMeasurement,
  updateFabricItem,
  updateWholeSaler,
  updateWholeSaleBill,
  updateSoldBill,
  changePassword,
  getCustomerProfile,
  getSoldCustomersList,
  getStitchCustomersList,
  searchCustomer,
  getEmployees,
  getCustomerBills,
  getAnalytics,
  getEmployeeProfile,
  getWork,
  getFabricItems,
  getWholeSalers,
  getWholeSaleBills,
  getFabricItem,
  getWholeSaler,
  getWholeSaleBill,
  login,
  logout,
  getClothingItems,
  getClothingItemMeasurementNames,
  deleteClothingItem,
  deleteSoldBill,
  getWholeSalerIdName,
  sendOTP,
  validateOTP,
} from "../controllers/adminCtrls.js";
import { upload } from "../middlewares/multer.js";
import { addBillNumber } from "../middlewares/billNumber.js";
import { auth } from "../middlewares/auth.js";
import { getAuthUser } from "../controllers/auth.js";
const router = express.Router();

// POST || Creation
router.post(
  "/admin",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addAdmin
); // -> /api/v1/admin/addAdmin

router.post(
  "/employee",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addEmployee
); // -> /api/v1/admin/addEmployee

router.post("/clothingItem", addClothingItem); // -> /api/v1/admin/clothingItem

router.post("/measurement/:id", addMeasurement); // -> /api/v1/admin/measurement

router.post("/stitchBill", addBillNumber, addStitchBill); // -> /api/v1/admin/stitchBill

router.post("/soldBill", addBillNumber, addSoldBill); // -> /api/v1/admin/soldBill

router.post("/work/:id", addWorkForEmployee); // -> /api/v1/admin/work

router.post("/advanceToEmployee/:id", addAdvanceForEmployee); // -> /api/v1/admin/advanceToEmployee

router.post("/checkMeasurements", checkMeasurements); // -> /api/v1/admin/checkMeasurements

router.post("/moneyToEmployee/:id", giveMoneyToEmployee); // -> /api/v1/admin/moneyToEmployee/:id

router.post(
  "/takeMoneyThatWasGivenAdvanceToEmployee/:id",
  removeAdvanceFromEmployee
); // -> /api/v1/admin/takeMoneyThatWasGivenAdvanceToEmployee/:id

router.post(
  "/fabricItem",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addFabricItem
); // -> /api/v1/admin/fabricItem

router.post("/wholeSaler", addWholeSaler); // -> /api/v1/admin/wholeSaler

router.post("/wholeSaleBill", addWholeSaleBill); // -> /api/v1/admin/wholeSaleBill

// PATCH || Update
router.patch(
  "/employee/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateEmployeeProfile
); // -> /api/v1/admin/employee/:id

router.patch(
  "/customer/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateCustomer
); // -> /api/v1/admin/customer/:id

router.patch("/changePassword", auth, changePassword); // -> /api/v1/admin/changePassword
router.patch("/clothingItem/:id", updateClothingItem); // -> /api/v1/admin/clothingItem/:id
router.patch("/soldBill/:id", updateSoldBill); // -> /api/v1/admin/soldBill/:id

// GET || Read
router.get("/customer", searchCustomer); // -> /api/v1/admin/customer?name=abc&phoneNumber=123
router.get("/stitchCustomerList", getStitchCustomersList); // -> /api/v1/admin/stitchCustomerList
router.get("/soldCustomerList", getSoldCustomersList); // -> /api/v1/admin/soldCustomerList
router.get("/customer/:id", getCustomerProfile); // -> /api/v1/admin/customer/:id
router.get("/bills/:id", getCustomerBills); // -> /api/v1/admin/bills/:id
router.get("/employees", getEmployees); // -> /api/v1/admin/employees
router.get("/employee/:id", getEmployeeProfile); // -> /api/v1/admin/employees/:id
router.get("/work/:id", getWork); // -> /api/v1/admin/employees/:id
router.get("/analytics", getAnalytics); // -> /api/v1/admin/analytics
router.get("/clothingItems", getClothingItems); // -> /api/v1/admin/clothingItems
router.get(
  "/clothingItemMeasurementNames/:name",
  getClothingItemMeasurementNames
); // -> /api/v1/admin/clothingItemMeasurementNames/:name
router.get("/fabricItems", getFabricItems); // -> /api/v1/admin/fabricItems
router.get("/fabricItem/:id", getFabricItem); // -> /api/v1/admin/fabricItem/:id
router.get("/wholeSalers", getWholeSalers); // -> /api/v1/admin/wholeSalers
router.get("/wholeSaler/:id", getWholeSaler); // -> /api/v1/admin/wholeSaler/:id
router.get("/wholeSaleBills", getWholeSaleBills); // -> /api/v1/admin/wholeSaleBills
router.get("/wholeSaleBill/:id", getWholeSaleBill); // -> /api/v1/admin/wholeSaleBill/:id
router.get("/wholeSalerIdName", getWholeSalerIdName); // -> /api/v1/admin/wholeSalerIdName

// DELETE || Delete
router.delete("/clothingItem/:id", deleteClothingItem); // -> /api/v1/admin/clothingItem/:id
router.delete("/soldBill/:id", deleteSoldBill); // -> /api/v1/admin/deleteSoldBill/:id

// Authentication
router.post("/login", login); // -> /api/v1/admin/login
router.post("/logout", auth, logout); // -> /api/v1/admin/logout
router.post("/getAuthenticateUser", auth, getAuthUser); // -> /api/v1/admin/getAuthenticateUser
router.post("/sendOTP", sendOTP); // -> /api/v1/admin/sendOTP
router.post("/validateOTP", validateOTP); // -> /api/v1/admin/sendOTP
export default router;
