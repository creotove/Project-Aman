import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {unLinkFile} from "../utils/unLinkFile.js";
import UserModel from "../models/UserModel.js";
import HelperModel from "../models/HelperModel.js";
import CuttingMasterModel from "../models/CuttingMasterModel.js";
import ClothingModel from "../models/ClothingModel.js";
import TailorModel from "../models/TailorModel.js";
import MeasurementModel from "../models/MeasurementModel.js";
import CustomerModel from "../models/CustomerModel.js";
import SoldBillModel from "../models/SoldBillModel.js";
import StitchBillModel from "../models/StitchBillModel.js";
import mongoose from "mongoose";
import WorkModel from "../models/WorkModel.js";
import {analyticsHelper, billType, cookieOptions, customerType, pipeline} from "../constants/index.js";
import MoneyDistributionModel from "../models/MoneyDistributionModel.js";
import FabricModel from "../models/FabricModel.js";
import WholeSalerModel from "../models/WholeSaler.js";
import WholeSaleBillModel from "../models/WholeSaleBillModel.js";
import {generateOTP, sendOTPEmail} from "../utils/passwordResetMail.js";
import {dateHelperForAnalytics, analyticsAdd} from "../utils/analyticsAdd.js";
import generateAccessAndRefreshToken from "../utils/generateAccessAndRefreshToke.js";
import {createCustomer} from "./sales.controller.js";

// Utility function for pagination
function paginatedData(Model) {
  return async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {};
    try {
      const resultsCount = await Model.countDocuments().exec();
      if (resultsCount <= 0) {
        throw new ApiError(404, "No data found");
      }
      if (endIndex < resultsCount) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }
      console.log(resultsCount, limit, startIndex, endIndex);
      if (resultsCount <= limit) {
        results.totalPages = {
          page: 1,
          limit: limit,
        };
      }
      results.results = await Model.find()
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip(startIndex)
        .exec();
      res.paginatedResults = results;
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}

// Utility function for creatingCustomer


// Utility function for regenerating the access token if it is expired - Middleware (May not be used)
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;
  if (!incomingRefreshToken)
    throw new ApiError(401, "Unauthorized, Refresh token is required");

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await UserModel.findById(decodedToken._id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.refreshToken !== incomingRefreshToken)
    throw new ApiError(401, "Refresh token is not valid");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      refreshToken,
    })
  );
});

const addEmployee = asyncHandler(async (req, res) => {
  // Step 1
  const { name, phoneNumber, role, aadharnumber, monthly } = req.body;

  // Step 2
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (role === undefined) {
    throw new ApiError(400, "Role is Required");
  } else if (aadharnumber === undefined) {
    throw new ApiError(400, "Aadhar number is Required");
  } else if (role === "HELPER" && monthly === undefined) {
    throw new ApiError(400, "Monthly income is Required");
  }

  // Step 3
  const existedUser = await UserModel.findOne({
    phoneNumber,
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  // Step 4
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(phoneNumber.toString(), salt);

  let avatar;
  if (req.file && req.file.fieldname === "avatar") {
    console.log("Uploading Avatar on Cloudinary");
    // Step 5
    const localpath = req.file.path;
    if (!localpath) throw new ApiError(400, "Avatar is required");
    avatar = await uploadOnCloudinary(localpath);
    if (!avatar) throw new ApiError(400, "Avatar is required");
    // Step 6
    unLinkFile(localpath)
      .then((result) => {
        console.log("Deletion result:", result);
      })
      .catch((error) => {
        console.error("Deletion error:", error);
      });
  }

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url,
    role,
  });

  // Step 8
  if (!newUser)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.1
  if (role === "HELPER") {
    const newHelper = await HelperModel.create({
      name,
      phoneNumber,
      monthly,
      user_id: newUser._id,
      aadharnumber,
    });
    if (!newHelper)
      throw new ApiError(500, "Something went wrong while creating the user");
    await newHelper.save();
  } else if (role === "CM") {
    const newCuttingMaster = await CuttingMasterModel.create({
      name,
      phoneNumber,
      user_id: newUser._id,
      cuttingAmounts: new Map(),
      aadharnumber,
    });
    if (!newCuttingMaster)
      throw new ApiError(500, "Something went wrong while creating the user");
    const clothingItems = await ClothingModel.find();
    if (clothingItems.length === 0) {
      console.log("Currently No clothing items are there");
    } else {
      for (const clothingItem of clothingItems) {
        newCuttingMaster.cuttingAmounts.set(
          clothingItem.name,
          clothingItem.cuttingAmt
        );
      }
    }
    await newCuttingMaster.save();
  } else if (role === "TAILOR") {
    const newTailor = await TailorModel.create({
      name,
      phoneNumber,
      user_id: newUser._id,
      stitchingAmounts: new Map(),
      aadharnumber,
    });
    if (!newTailor)
      throw new ApiError(500, "Something went wrong while creating the user");
    const clothingItems = await ClothingModel.find();
    if (clothingItems.length === 0) {
      console.log("Currently No clothing items are there");
    } else {
      for (const clothingItem of clothingItems) {
        newTailor.stitchingAmounts.set(
          clothingItem.name,
          clothingItem.stitchingAmtTailor
        );
      }
    }
    await newTailor.save();
  } else {
    throw new ApiError(400, "Role is not valid");
  }

  // Step 10
  await newUser.save();

  // Step 11
  return res
    .status(201)
    .json(new ApiResponse(200, {}, "New employee registered successfully"));
});

const addWorkForEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id

  if (id === undefined) throw new ApiError(400, "User Id is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  const { work, totalAmount } = req.body;

  if (work === undefined) {
    throw new ApiError(400, "Cloth is Required");
  } else if (totalAmount === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  }
  let employee;
  if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Tailor not found");
    employee.earned += totalAmount;
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Cutting Master not found");
    employee.earned += totalAmount;
  }

  const newWork = await WorkModel.create({
    employeeId: employee._id,
    work,
    totalAmount,
  });
  if (!newWork)
    throw new ApiError(500, "Something went wrong while creating the user");

  employee.work.push(newWork._id);
  await newWork.save();
  await employee.save();
  if (!newWork)
    throw new ApiError(500, "Something went wrong while creating the user");
  await newWork.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Work added successfully"));
});

const addAdvanceForEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  if (id === undefined) throw new ApiError(400, "User Id is Required");

  const { advance } = req.body;
  if (advance === undefined) throw new ApiError(400, "Advance is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "HELPER") {
    employee = await HelperModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Helper not found");
  }

  employee.advance += advance;
  await employee.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Advance added successfully"));
});


const addMeasurement = asyncHandler(async (req, res) => {
  const { id } = req.params; // customer id
  let { measurements, name } = req.body;
  if (measurements === undefined) {
    throw new ApiError(400, "Measurements are Required");
  } else if (id === undefined) {
    throw new ApiError(400, "Customer Id is Required");
  } else if (name.trim() === undefined) {
    throw new ApiError(400, "Name is Required");
  }
  const customer = await CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, "Customer not found");

  const existedMeasurement = await MeasurementModel.findOne({
    customer_id: id,
    name,
  });
  if (!existedMeasurement) {
    const newMeasurement = await MeasurementModel.create({
      customer_id: id,
      measurements,
      name,
    });
    if (!newMeasurement)
      throw new ApiError(500, "Something went wrong while creating the user");
    customer.measurements.push(newMeasurement._id);
    await customer.save();
    await newMeasurement.save();
  } else {
    existedMeasurement.measurements = measurements;
    await existedMeasurement.save();
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, `Add Measurement for ${customer?.name} successfully`)
    );
});

// const checkMeasurements = asyncHandler(async (req, res) => {
//   const { name, phoneNumber, clothingItems } = req.body;

//   let user = await UserModel.findOne({ phoneNumber });
//   const measurmentsOccurred = new Map();
//   const measurements = [];
//   if (!user) {
//     const newCustomer = await createCustomer(name, phoneNumber);
//     if (!newCustomer)
//       throw new ApiError(500, "Something went wrong while creating customer");
//     for (const clothingItem of clothingItems) {
//       measurmentsOccurred.set(clothingItem, false);
//     }
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           customer_id: newCustomer._id,
//           ...Object.fromEntries(measurmentsOccurred),
//           measurements,
//         },
//         "Measurements data found"
//       )
//     );
//   } else {
//     const customer = await CustomerModel.findOne({ user_id: user._id });
//     for (const clothingItem of clothingItems) {
//       const measurement = await MeasurementModel.findOne({
//         customer_id: customer._id,
//         name: clothingItem,
//       }).select(
//         "-_id -customer_id -createdAt -updatedAt -__v -customer_id -customerRequirements"
//       );
//       if (!measurement) {
//         measurmentsOccurred.set(clothingItem, false);
//         const clothingItemDetails = await ClothingModel.findOne({
//           name: clothingItem,
//         });
//         if (!clothingItemDetails)
//           throw new ApiError(404, "Clothing Item not found");
//         measurements.push({
//           name: clothingItem,
//           measurements: clothingItemDetails.measurements,
//         });
//       } else {
//         measurements.push(measurement);
//         measurmentsOccurred.set(clothingItem, true);
//       }
//     }
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           customer_id: customer._id,
//           ...Object.fromEntries(measurmentsOccurred),
//           measurements,
//         },
//         "Measurements data found"
//       )
//     );
//   }
// });

const checkMeasurements = asyncHandler(async (req, res) => {
  const { name, phoneNumber, clothingItems } = req.body;

  let user = await UserModel.findOne({ phoneNumber });
  const measurmentsOccurred = new Map();
  const measurements = [];

  if (!user) {
    const { newCustomer, newUser } = await createCustomer(name, phoneNumber);
    if (!newCustomer && !newUser)
      throw new ApiError(500, "User is already registered");
    for (const clothingItem of clothingItems) {
      measurmentsOccurred.set(clothingItem, false);
      const clothingItemDetails = await ClothingModel.findOne({
        name: clothingItem,
      });
      if (!clothingItemDetails)
        throw new ApiError(404, "Clothing Item not found");
      measurements.push({
        name: clothingItem,
        measurements: getDefaultMeasurements(clothingItemDetails.measurements),
      });
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          customer_id: newCustomer._id,
          ...Object.fromEntries(measurmentsOccurred),
          measurements,
        },
        "Measurements data found"
      )
    );
  } else {
    const customer = await CustomerModel.findOne({ user_id: user._id });
    for (const clothingItem of clothingItems) {
      const measurement = await MeasurementModel.findOne({
        customer_id: customer._id,
        name: clothingItem,
      }).select(
        "-_id -customer_id -createdAt -updatedAt -__v -customer_id -customerRequirements"
      );
      if (!measurement) {
        measurmentsOccurred.set(clothingItem, false);
        const clothingItemDetails = await ClothingModel.findOne({
          name: clothingItem,
        });
        if (!clothingItemDetails)
          throw new ApiError(404, "Clothing Item not found");
        measurements.push({
          name: clothingItem,
          measurements: getDefaultMeasurements(
            clothingItemDetails.measurements
          ),
        });
      } else {
        measurements.push(measurement);
        measurmentsOccurred.set(clothingItem, true);
      }
    }
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          customer_id: customer._id,
          ...Object.fromEntries(measurmentsOccurred),
          measurements,
        },
        "Measurements data found"
      )
    );
  }
});

// Function to get default measurements object with values set to 0
const getDefaultMeasurements = (measurementNames) => {
  const defaultMeasurements = {};
  measurementNames.forEach((name) => {
    defaultMeasurements[name] = 0;
  });
  return defaultMeasurements;
};

const addSoldBill = asyncHandler(async (req, res) => {
  const { name, phoneNumber, totalAmt, billNumber } = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (totalAmt === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  } else if (billNumber === undefined) {
    throw new ApiError(400, "Bill Number is Required");
  }

  const user = await UserModel.findOne({ phoneNumber });
  if (!user) {
    const { newCustomer, newUser } = await createCustomer(name, phoneNumber);
    const newSoldBill = await SoldBillModel.create({
      name,
      user_id: newUser._id,
      customer_id: newCustomer._id,
      phoneNumber,
      totalAmt,
      billNumber,
    });
    if (!newSoldBill)
      throw new ApiError(500, "Something went wrong while creating the user");
    newCustomer.purchasedBill.push(newSoldBill._id);
    await newCustomer.save();
    await newSoldBill.save();
  } else {
    const newSoldBill = await SoldBillModel.create({
      name,
      user_id: user.user_id,
      user_id: user._id,
      phoneNumber,
      totalAmt,
      billNumber,
    });
    if (!newSoldBill)
      throw new ApiError(500, "Something went wrong while creating the user");
    const customer = await CustomerModel.findOne({ user_id: user._id });
    if (!customer)
      throw new ApiError(500, "Something went wrong while creating the user");
    customer.purchasedBill.push(newSoldBill._id);

    await customer.save();
    await newSoldBill.save();
    await user.save();
  }

  // Analytics for Stitch Bill
  const { day, month } = dateHelperForAnalytics();
  if (!user) {
    analyticsAdd(
      totalAmt,
      billType.SOLD,
      customerType.NEW,
      analyticsHelper.ADD,
      false,
      month,
      day
    );
  } else {
    analyticsAdd(
      totalAmt,
      billType.SOLD,
      customerType.OLD,
      analyticsHelper.ADD,
      false,
      month,
      day
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Add Sold Bill for user successfully"));
});

const addStitchBill = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    totalAmt,
    clothes,
    deliveryDate,
    finalAmt,
    advanceAmt,
    billNumber,
  } = req.body;
  // Validation
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (totalAmt === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  } else if (clothes === undefined) {
    throw new ApiError(400, "Clothes are Required");
  } else if (deliveryDate === undefined) {
    throw new ApiError(400, "Delivery Date is Required");
  } else if (finalAmt === undefined) {
    throw new ApiError(400, "Final Amount is Required");
  } else if (advanceAmt === undefined) {
    throw new ApiError(400, "Advance Amount is Required");
  } else if (billNumber === undefined) {
    throw new ApiError(400, "Bill Number is Required");
  }

  // Check if the customer is already registered or not
  const user = await UserModel.findOne({ phoneNumber });

  // If not registered then create a new customer
  if (!user) {
    const { newCustomer, newUser } = await createCustomer(name, phoneNumber);

    const newStitchBill = await StitchBillModel.create({
      name,
      user_id: newUser._id,
      customer_id: newCustomer._id,
      phoneNumber,
      totalAmt,
      clothes,
      deliveryDate,
      finalAmt,
      advanceAmt,
      billNumber,
    });
    if (!newStitchBill) {
      throw new ApiError(500, "Something went wrong adding the stictch bill");
    }
    newCustomer.stitchedBill.push(newStitchBill._id);
    await newCustomer.save();
    await newStitchBill.save();
    await newUser.save();
  } else {
    const customer = await CustomerModel.findOne({ user_id: user._id });
    if (!customer) throw new ApiError(404, "Customer not found");

    const newStitchBill = await StitchBillModel.create({
      name,
      user_id: user._id,
      customer_id: customer._id,
      phoneNumber,
      totalAmt,
      clothes,
      deliveryDate,
      finalAmt,
      advanceAmt,
      billNumber,
    });
    if (!newStitchBill)
      throw new ApiError(500, "Something went wrong while creating the user");
    customer.stitchedBill.push(newStitchBill._id);

    await newStitchBill.save();
    await customer.save();
  }

  // Day and Month for Analytics
  const { day, month } = dateHelperForAnalytics();

  // Analytics for Stitch Bill
  if (!user) {
    await analyticsAdd(
      finalAmt,
      billType.STITCHED,
      customerType.NEW,
      analyticsHelper.ADD,
      false,
      month,
      day
    );
  } else {
    await analyticsAdd(
      finalAmt,
      billType.STITCHED,
      customerType.OLD,
      analyticsHelper.ADD,
      false,
      month,
      day
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, "Add Stitch Bill for customer successfully")
    );
});

const giveMoneyToEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const { amount } = req.body;

  if (id === undefined) throw new ApiError(400, "User Id is Required");
  if (amount === undefined) throw new ApiError(400, "Amount is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "HELPER") {
    employee = await HelperModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Helper not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else {
    throw new ApiError(400, "Role is not valid");
  }
  const moneyDistribution = await MoneyDistributionModel.create({
    user_id: id,
    name: employee.name,
    amount,
    message: "Salary/Fees",
  });
  if (!moneyDistribution)
    throw new ApiError(500, "Something went wrong while creating the user");

  if (employee.role !== "HELPER") {
    if (amount <= employee.earned) {
      employee.earned -= amount;
    } else {
      employee.advance = employee.advance + (amount - employee.earned);
      employee.earned = 0;
    }
  }

  await employee.save();
  await moneyDistribution.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Money given to employee successfully"));
});

const removeAdvanceFromEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const { amount } = req.body;

  if (id === undefined) throw new ApiError(400, "User Id is Required");
  if (amount === undefined) throw new ApiError(400, "Amount is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "HELPER") {
    employee = await HelperModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Helper not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({ user_id: id });
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else {
    throw new ApiError(400, "Role is not valid");
  }
  if (amount > employee.advance)
    throw new ApiError(400, "Amount is greater than advance");
  employee.advance -= amount;

  await employee.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Advance given money to employee received"));
});


const addWholeSaler = asyncHandler(async (req, res) => {
  const { name, email, phone, address } = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (email.trim() === "") {
    throw new ApiError(400, "Email is Required");
  } else if (phone === undefined) {
    throw new ApiError(400, "Phone is Required");
  } else if (address.trim() === "") {
    throw new ApiError(400, "Address is Required");
  }
  const existedWholeSaler = await WholeSalerModel.findOne({
    $or: [{ email }, { phone }],
  });
  if (existedWholeSaler) {
    throw new ApiError(409, "Whole Saler already exists");
  }

  const newWholeSaler = await WholeSalerModel.create({
    name,
    email,
    phone,
    address,
  });
  if (!newWholeSaler)
    throw new ApiError(500, "Something went wrong while creating the user");

  await newWholeSaler.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Whole Saler created successfully"));
});

const addWholeSaleBill = asyncHandler(async (req, res) => {
  const {
    billNo,
    totalAmount,
    wholeSaler,
    paymentStatus,
    paymentDate,
    payabeledAmount,
    paidAmount,
  } = req.body;

  if (billNo === undefined) throw new ApiError(400, "Bill Number is Required");
  else if (totalAmount === undefined)
    throw new ApiError(400, "Total Amount is Required");
  else if (wholeSaler === undefined)
    throw new ApiError(400, "Whole Saler is Required");
  else if (paymentStatus === undefined)
    throw new ApiError(400, "Payment Status is Required");
  else if (paymentDate === undefined)
    throw new ApiError(400, "Payment Date is Required");
  else if (payabeledAmount === undefined)
    throw new ApiError(400, "Payabeled Amount is Required");
  else if (paidAmount === undefined)
    throw new ApiError(400, "Paid Amount is Required");

  const localpath = req.files?.image[0]?.path;
  if (!localpath) throw new ApiError(400, "Receipt image is required");
  const receiptImage = await uploadOnCloudinary(localpath);
  if (!receiptImage)
    throw new ApiError(400, "Failed to uplaod image on cloudinary");

  const wholeSalerName = await WholeSalerModel.findById(wholeSaler);

  const newWholeSaleBill = await WholeSaleBillModel.create({
    billNo,
    totalAmount,
    wholeSalerName: wholeSalerName.name,
    wholeSaler,
    paymentStatus,
    paymentDate,
    payabeledAmount,
    paidAmount,
    receiptImage: receiptImage.url,
  });
  if (!newWholeSaleBill)
    throw new ApiError(500, "Something went wrong while creating the user");

  await newWholeSaleBill.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Whole Sale Bill created successfully"));
});

// Update || PATCH
// Employee Details || AVATAR middleware needed
// *work and their amounts are not updated here
const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const {
    name,
    phoneNumber,
    avatar,
    role,
    password,
    advance,
    earned,
    monthly,
  } = req.body;
  if (role === "HELPER") {
    const helper = await HelperModel.findOne({ user_id: id });
    if (!helper) throw new ApiError(404, "Helper not found");
    if (name) helper.name = name;
    if (phoneNumber) helper.phoneNumber = phoneNumber;
    if (avatar) {
      const localpath = req.files?.avatar[0]?.path;
      if (!localpath) throw new ApiError(400, "Avatar is required");
      const newAvatar = await uploadOnCloudinary(localpath);
      if (!newAvatar) throw new ApiError(400, "Avatar is required");
      helper.avatar = newAvatar;
      const unlinked = unLinkFile(localpath);
      if (unlinked) {
        console.log("File deleted successfully");
      } else {
        throw new ApiError(400, "Error in deleting the file");
      }
    }
    if (password) helper.password = password;
    if (advance) helper.advance = advance;
    if (earned) helper.earned = earned;
    if (monthly) helper.monthly = monthly;

    await helper.save();
    return res
      .status(200)
      .json(new ApiResponse(200, helper, "Helper Updated Successfully"));
  }
  if (role === "CUTTING MASTER") {
    const cuttingMaster = await CuttingMasterModel.findOne({ user_id: id });
    if (!cuttingMaster) throw new ApiError(404, "Cutting Master not found");
    if (name) cuttingMaster.name = name;
    if (phoneNumber) cuttingMaster.phoneNumber = phoneNumber;
    if (avatar) {
      const localpath = req.files?.avatar[0]?.path;
      if (!localpath) throw new ApiError(400, "Avatar is required");
      const newAvatar = await uploadOnCloudinary(localpath);
      if (!newAvatar) throw new ApiError(400, "Avatar is required");
      cuttingMaster.avatar = newAvatar;
      unLinkFile(localpath)
        .then((result) => {
          console.log("Deletion result:", result);
        })
        .catch((error) => {
          console.error("Deletion error:", error);
        });
    }
    if (password) cuttingMaster.password = password;
    if (advance) cuttingMaster.advance = advance;
    if (earned) cuttingMaster.earned = earned;
    if (monthly) cuttingMaster.monthly = monthly;
    await cuttingMaster.save();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          cuttingMaster,
          "Cutting Master Updated Successfully"
        )
      );
  }
  if (role === "TAILOR") {
    const tailor = await TailorModel.findOne({ user_id: id });
    if (!tailor) throw new ApiError(404, "Tailor not found");
    if (name) tailor.name = name;
    if (phoneNumber) tailor.phoneNumber = phoneNumber;
    if (avatar) {
      const localpath = req.files?.avatar[0]?.path;
      if (!localpath) throw new ApiError(400, "Avatar is required");
      const newAvatar = await uploadOnCloudinary(localpath);
      if (!newAvatar) throw new ApiError(400, "Avatar is required");
      tailor.avatar = newAvatar;
      unLinkFile(localpath)
        .then((result) => {
          console.log("Deletion result:", result);
        })
        .catch((error) => {
          console.error("Deletion error:", error);
        });
    }
    if (password) tailor.password = password;
    if (advance) tailor.advance = advance;
    if (earned) tailor.earned = earned;
    if (monthly) tailor.monthly = monthly;
    await tailor.save();
    return res
      .status(200)
      .json(new ApiResponse(200, tailor, "Tailor Updated Successfully"));
  }
});

const updateEmployeeProfile = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  const { name, employeeDetails } = req.body;

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  if (name) user.name = name;

  if (user.role === "TAILOR") {
    const { employeeAmts: stitchingAmounts } = employeeDetails;
    const tailor = await TailorModel.findOne({ user_id: id });

    if (!tailor) throw new ApiError(404, "Tailor not found");
    if (employeeDetails) tailor.stitchingAmounts = stitchingAmounts;

    await tailor.save();
  } else if (user.role === "CM") {
    const { employeeAmts: cuttingAmounts } = employeeDetails;
    const cuttingMaster = await CuttingMasterModel.findOne({ user_id: id });

    if (!cuttingMaster) throw new ApiError(404, "Cutting Master not found");
    if (employeeDetails) cuttingMaster.cuttingAmounts = cuttingAmounts;

    await cuttingMaster.save();
  } else if (user.role === "HELPER") {
    const { employeeAmts: monthly } = employeeDetails;
    const helper = await HelperModel.findOne({ user_id: id });

    if (!helper) throw new ApiError(404, "Helper not found");
    if (employeeDetails) helper.monthly = monthly.monthly;

    await helper.save();
  }
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Employee Updated Successfully"));
});




const updateMeasurement = asyncHandler(async (req, res) => {
  const { measurement_id } = req.params;
  const { measurements, customerRequirements, drawing } = req.body;
  if (measurements === undefined) {
    throw new ApiError(400, "Measurements are Required");
  } else if (measurement_id === undefined) {
    throw new ApiError(400, "Measurement Id is Required");
  }
  const measurement = await MeasurementModel.findById(measurement_id);
  if (!measurement) throw new ApiError(404, "Measurement not found");
  if (measurements) measurement.measurements = measurements;
  if (customerRequirements)
    measurement.customerRequirements = customerRequirements;
  if (drawing) measurement.drawing = drawing;
  await measurement.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Measurement Updated Successfully"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  const user = await UserModel.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Password is invalid");

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword.toString(), salt);
  user.password = hashedPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateFabricItem = asyncHandler(async (req, res) => {
  const { id } = req.params; // fabric item id
  const {
    name,
    purchasedPerMtrPrice,
    sellingPerMtrPrice,
    purchasedFrom,
    description,
    patternName,
    stock,
    totalMtrsWhenBought,
  } = req.body;
  const fabricItem = await FabricModel.findById(id);
  if (!fabricItem) throw new ApiError(404, "Fabric Item not found");
  fabricItem.name = name;
  fabricItem.purchasedPerMtrPrice = purchasedPerMtrPrice;
  fabricItem.sellingPerMtrPrice = sellingPerMtrPrice;
  fabricItem.purchasedFrom = purchasedFrom;
  const wholeSaler = await WholeSalerModel.findById(purchasedFrom);
  fabricItem.wholeSalerName = wholeSaler.name;
  fabricItem.description = description;
  fabricItem.patternName = patternName;
  fabricItem.stock = stock;
  fabricItem.totalMtrsWhenBought = totalMtrsWhenBought;
  await fabricItem.save();
  return res
    .status(200)
    .json(new ApiResponse(200, fabricItem, "Fabric Item Updated Successfully"));
});

const updateWholeSaler = asyncHandler(async (req, res) => {
  const { id } = req.params; // whole saler id
  const { name, email, phone, address } = req.body;
  const wholeSaler = await WholeSalerModel.findById(id);
  if (!wholeSaler) throw new ApiError(404, "Whole Saler not found");
  wholeSaler.name = name;
  wholeSaler.email = email;
  wholeSaler.phone = phone;
  wholeSaler.address = address;
  await wholeSaler.save();
  return res
    .status(200)
    .json(new ApiResponse(200, wholeSaler, "Whole Saler Updated Successfully"));
});

const updateWholeSaleBill = asyncHandler(async (req, res) => {
  const { id } = req.params; // whole sale bill id
  const {
    billNo,
    totalAmount,
    paymentStatus,
    paymentDate,
    payabeledAmount,
    paidAmount,
  } = req.body;
  const wholeSaleBill = await WholeSaleBillModel.findById(id);
  if (!wholeSaleBill) throw new ApiError(404, "Whole Sale Bill not found");
  wholeSaleBill.billNo = billNo;
  wholeSaleBill.totalAmount = totalAmount;
  wholeSaleBill.paymentStatus = paymentStatus;
  wholeSaleBill.paymentDate = paymentDate;
  wholeSaleBill.payabeledAmount = payabeledAmount;
  wholeSaleBill.paidAmount = paidAmount;
  await wholeSaleBill.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        wholeSaleBill,
        "Whole Sale Bill Updated Successfully"
      )
    );
});

const updateSoldBill = asyncHandler(async (req, res) => {
  const { id } = req.params; // sold bill id
  if (id === undefined) throw new ApiError(400, "Id is required");
  const { totalAmt } = req.body;

  const soldBill = await SoldBillModel.findById(id);
  if (!soldBill) throw new ApiError(404, "Sold Bill not found");

  const { day, month } = dateHelperForAnalytics(soldBill.createdAt);
  const isNegative = totalAmt < soldBill.totalAmt;
  const amountToBeAdded = Math.abs(totalAmt - soldBill.totalAmt);
  await analyticsAdd(
    amountToBeAdded,
    billType.SOLD,
    customerType.OLD,
    analyticsHelper.UPDATE,
    isNegative,
    month,
    day
  );
  soldBill.totalAmt = totalAmt;
  await soldBill.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Sold Bill Updated Successfully"));
});

const updateStitchedBill = asyncHandler(async (req, res) => {
  const { id } = req.params; // stitched bill id
  if (id === undefined) throw new ApiError(400, "Id is required");
  const { totalAmt, clothes, deliveryDate, finalAmt, advanceAmt } = req.body;

  const stitchedBill = await StitchBillModel.findById(id);
  if (!stitchedBill) throw new ApiError(404, "Stitched Bill not found");

  const { day, month } = dateHelperForAnalytics(stitchedBill.createdAt);
  const isNegative = finalAmt < stitchedBill.finalAmt;
  const amountToBeAdded = Math.abs(finalAmt - stitchedBill.finalAmt);
  await analyticsAdd(
    amountToBeAdded,
    billType.STITCHED,
    customerType.OLD,
    analyticsHelper.UPDATE,
    isNegative,
    month,
    day
  );
  if (clothes) stitchedBill.clothes = clothes;
  if (deliveryDate) stitchedBill.deliveryDate = deliveryDate;
  if (finalAmt) stitchedBill.finalAmt = finalAmt;
  if (advanceAmt) stitchedBill.advanceAmt = advanceAmt;
  if (totalAmt) stitchedBill.totalAmt = totalAmt;
  await stitchedBill.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Stitched Bill Updated Successfully"));
});

// Retrive || GET




const getEmployees = asyncHandler(async (req, res) => {
  const employees = await UserModel.aggregate([
    {
      $match: {
        role: {
          $nin: ["CUSTOMER", "ADMIN"],
        },
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        forgotPasswordToken: 0,
        phoneNumber: 0,
        forgotPasswordTokenExpiry: 0,
        verifyToken: 0,
        verifyTokenExpiry: 0,
        __v: 0,
      },
    },
  ]);
  if (employees?.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No Employees found"))
  }
  res
    .status(200)
    .json(new ApiResponse(200, employees, "Employees fetched successfull"));
});

const getEmployeeProfile = asyncHandler(async (req, res) => {
  const { id } = req.params; // user id
  let qrole = req.query.role;
  const limit = parseInt(req.query.limit) || 2; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  if (qrole === "CM") {
    qrole = "cuttingmaster";
  }
  if (!id) throw new ApiError(400, "Id is required to fetch the employee");
  if (!qrole) throw new ApiError(400, "Role is required to fetch the employee");
  const role = qrole.toLowerCase() + "s";
  console.log(role);
  const employee = await UserModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: role,
        localField: "_id",
        foreignField: "user_id",
        as: "employeeDetails",
      },
    },
    {
      $addFields: {
        employeeDetails: {
          $arrayElemAt: ["$employeeDetails", 0],
        },
      },
    },
    {
      $lookup: {
        from: "works",
        localField: "employeeDetails._id",
        foreignField: "employeeId",
        as: "workDetails",
        pipeline: [
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $project: {
              createdAt: 1,
              totalAmount: 1,
            },
          },
        ],
      },
    },
    // pagination
    {
      $addFields: {
        total: { $size: "$workDetails" },
        page,
        limit,
        workDetails: {
          $slice: [
            "$workDetails",
            { $add: [{ $multiply: [page, limit] }, -limit] },
            limit,
          ],
        },
      },
    },
    {
      $project: {
        forgotPasswordToken: 0,
        forgotPasswordTokenExpiry: 0,
        verifyToken: 0,
        verifyTokenExpiry: 0,
        password: 0,
        refreshToken: 0,
        __v: 0,
      },
    },
  ]);
  if (!employee[0]) throw new ApiError(404, "Employee not found");

  return res
    .status(200)
    .json(new ApiResponse(200, employee[0], "Employee fetched successfull"));
});



const getWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Id is required");
  const work = await WorkModel.findById(id);
  if (!work) throw new ApiError(404, "Work not found");

  return res
    .status(200)
    .json(new ApiResponse(200, work, "Work fetched successfully"));
});






// Delete || DELETE

const deleteClothingItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    throw new ApiError(400, "Id is required to delete the clothing item");

  const clothingItem = await ClothingModel.findByIdAndDelete(id);
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Clothing Item deleted successfully"));
});

const deleteSoldBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Id is required to delete the sold bill");

  const soldBill = await SoldBillModel.findById(id);
  if (!soldBill) throw new ApiError(404, "Sold Bill not found");

  const { month, day } = dateHelperForAnalytics(soldBill.createdAt);

  await analyticsAdd(
    soldBill.totalAmt,
    billType.SOLD,
    customerType.OLD,
    analyticsHelper.DELETE,
    true,
    month,
    day
  );

  const customerThatBillBelongsTo = await CustomerModel.findOne({
    purchasedBill: id,
  });

  if (customerThatBillBelongsTo) {
    customerThatBillBelongsTo.purchasedBill =
      customerThatBillBelongsTo.purchasedBill.filter(
        (bill) => bill.toString() !== id
      );
    await customerThatBillBelongsTo.save();
  }

  const deletedBill = await SoldBillModel.findByIdAndDelete(id);
  if (!deletedBill) throw new ApiError(404, "Error deleting the sold bill");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Sold Bill deleted successfully"));
});

const deleteStitchBill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Id is required to delete the stitch bill");

  const stitchBill = await StitchBillModel.findById(id);
  if (!stitchBill) throw new ApiError(404, "Stitch Bill not found");

  const { month, day } = dateHelperForAnalytics(stitchBill.createdAt);

  await analyticsAdd(
    stitchBill.finalAmt,
    billType.STITCHED,
    customerType.OLD,
    analyticsHelper.DELETE,
    true,
    month,
    day
  );

  const customerThatBillBelongsTo = await CustomerModel.findOne({
    stitchedBill: id,
  });

  if (customerThatBillBelongsTo) {
    customerThatBillBelongsTo.stitchedBill =
      customerThatBillBelongsTo.stitchedBill.filter(
        (bill) => bill.toString() !== id
      );
    await customerThatBillBelongsTo.save();
  }

  const deletedBill = await StitchBillModel.findByIdAndDelete(id);
  if (!deletedBill) throw new ApiError(404, "Error deleting the stitch bill");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Stitch Bill deleted successfully"));
});
// Auth || POST
const login = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber) throw new ApiError(400, "Phone number is required");
  if (!password) throw new ApiError(400, "Password is required");

  const user = await UserModel.findOne({ phoneNumber, role: "ADMIN" });
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) throw new ApiError(406, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry -__v"
  );

  loggedInUser.refreshToken = refreshToken;
  await loggedInUser.save();
  return res.status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, {
        accessToken,
        user: loggedInUser,
      })
    );
});

const logout = asyncHandler(async (req, res) => {
  await UserModel.findByIdAndUpdate(
    req.userId,
    {
      refreshToken: null,
    },
    { new: true }
  );
  return res
    .status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const sendOTP = asyncHandler(async (req, res) => {
  const otp = generateOTP();
  const sent = await sendOTPEmail(process.env.EMAIL, otp);
  const admin = await UserModel.findOne({ role: "ADMIN" });
  if (!admin) throw new ApiError(404, "Admin not found");
  admin.passwordResetOTP = otp;
  await admin.save();
  if (!sent)
    return res
      .status(200)
      .json(new ApiResponse(200, { otp }, "OTP sent successfully"));
  else
    return res.status(400).json(new ApiResponse(400, {}, "OTP sending failed"));
});



export {
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
  updateStitchedBill,
  changePassword,
  getCustomerProfile,
  getSoldCustomersList,
  getStitchCustomersList,
  getAllCustomersList,
  searchCustomerBasedOnPhoneNumber,
  searchCustomerBasedOnName,
  getEmployees,
  getCustomerBills,
  getAnalytics,
  getEmployeeProfile,
  getWork,
  getFabricItems,
  getWholeSalers,
  getWholeSaleBills,
  getWholeSalerIdName,
  getFabricItem,
  getWholeSaler,
  getWholeSaleBill,
  login,
  logout,
  getClothingItems,
  getClothingItemMeasurementNames,
  deleteCustomer,
  deleteClothingItem,
  deleteSoldBill,
  deleteStitchBill,
  sendOTP,
  validateOTP,
};
