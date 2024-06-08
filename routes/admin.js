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
  "/addAdmin",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addAdmin
); // -> /api/admin/addAdmin

router.post(
  "/addEmployee",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  addEmployee
); // -> /api/admin/addEmployee

router.post("/addClothingItem", addClothingItem); // -> /api/admin/addClothingItem

router.post("/addMeasurement/:id", addMeasurement); // -> /api/admin/addMeasurement

router.post("/addStitchBill", addBillNumber, addStitchBill); // -> /api/admin/addStitchBill

router.post("/addSoldBill", addBillNumber, addSoldBill); // -> /api/admin/addSoldBill

router.post("/addWork/:id", addWorkForEmployee); // -> /api/admin/addWork

router.post("/addAdvance/:id", addAdvanceForEmployee); // -> /api/admin/addWork

router.post("/checkMeasurements", checkMeasurements); // -> /api/admin/checkMeasurements

router.post("/giveMoneyToEmployee/:id", giveMoneyToEmployee); // -> /api/admin/giveMoneyToEmployee/:id

router.post("/removeAdvance/:id", removeAdvanceFromEmployee); // -> /api/admin/removeAdvance/:id

router.post(
  "/addFabricItem",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addFabricItem
); // -> /api/admin/addFabricItem

router.post("/addWholeSaler", addWholeSaler); // -> /api/admin/addWholeSaler

router.post("/addWholeSaleBill", addWholeSaleBill); // -> /api/admin/addWholeSaleBill

// PATCH || Update
router.patch(
  "/updateEmployee/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateEmployeeProfile
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

router.patch("/changePassword", auth, changePassword); // -> /api/admin/changePassword
router.patch("/clothingItem/:id", updateClothingItem); // -> /api/admin/clothingItem/:id
router.patch("/soldBill/:id", updateSoldBill); // -> /api/admin/soldBill/:id

// GET || Read
router.get("/customer", searchCustomer); // -> /api/admin/customer?name=abc&phoneNumber=123
router.get("/stitchCustomerList", getStitchCustomersList); // -> /api/admin/customers
router.get("/soldCustomerList", getSoldCustomersList); // -> /api/admin/customers
router.get("/customer/:id", getCustomerProfile); // -> /api/admin/customer/:id
router.get("/bills/:id", getCustomerBills); // -> /api/admin/bills/:id
router.get("/employees", getEmployees); // -> /api/admin/employees
router.get("/employee/:id", getEmployeeProfile); // -> /api/admin/employees/:id
router.get("/work/:id", getWork); // -> /api/admin/employees/:id
router.get("/analytics", getAnalytics); // -> /api/admin/analytics
router.get("/clothingItems", getClothingItems); // -> /api/admin/clothingItem/:id
router.get(
  "/clothingItemMeasurementNames/:name",
  getClothingItemMeasurementNames
); // -> /api/admin/clothingItemMeasurementNames/:name
router.get("/fabricItems", getFabricItems); // -> /api/admin/fabricItems
router.get("/fabricItem/:id", getFabricItem); // -> /api/admin/fabricItem/:id
router.get("/wholeSalers", getWholeSalers); // -> /api/admin/wholeSalers
router.get("/wholeSaler/:id", getWholeSaler); // -> /api/admin/wholeSaler/:id
router.get("/wholeSaleBills", getWholeSaleBills); // -> /api/admin/wholeSaleBills
router.get("/wholeSaleBill/:id", getWholeSaleBill); // -> /api/admin/wholeSaleBill/:id
router.get("/wholeSalerIdName", getWholeSalerIdName); // -> /api/admin/wholeSalerIdName

// DELETE || Delete
router.delete("/deleteClothingItem/:id", deleteClothingItem); // -> /api/admin/deleteClothingItem/:id
router.delete("/soldBill/:id", deleteSoldBill); // -> /api/admin/deleteSoldBill/:id

// Authentication
router.post("/login", login); // -> /api/admin/login
router.post("/logout", auth, logout); // -> /api/admin/logout
router.post("/getAuthenticateUser", auth, getAuthUser); // -> /api/admin/getAuthenticateUser
router.post("/sendOTP", sendOTP); // -> /api/admin/sendOTP
router.post("/validateOTP", validateOTP); // -> /api/admin/sendOTP
export default router;
