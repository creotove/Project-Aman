import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { unLinkFile } from "../utils/unLinkFile.js";

import UserModel from "../models/UserModel.js";
import HelperModel from "../models/HelperModel.js";
import CuttingMasterModel from "../models/CuttingMasterModel.js";
import ClothingModel from "../models/ClothingModel.js";
import TailorModel from "../models/TailorModel.js";
import MeasurementModel from "../models/MeasurementModel.js";
import CustomerModel from "../models/CustomerModel.js";
import SoldBillModel from "../models/SoldBillModel.js";
import StitchBillModel from "../models/StitchBillModel.js";
import { analyticsAdd } from "../utils/analyticsAdd.js";
import mongoose from "mongoose";
import AnalyticsModel from "../models/AnalyticsModel.js";
import WorkModel from "../models/WorkModel.js";
import { pipeline } from "../constants/index.js";

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
// Utility function for Access and Refresh Token
async function generateAccessAndRefreshToken(userId) {
  try {
    const user = await UserModel.findById(userId);
    if (!user)
      throw new ApiError(404, "User not found in access and refresh token");

    const accessToken = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "2d",
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
}
// Utility function for creatingCustomer
async function createCustomer(name, phoneNumber) {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(phoneNumber.toString(), salt);

    const newUser = await UserModel.create({
      name,
      phoneNumber,
      role: "CUSTOMER",
      password: hashedPassword,
    });
    if (!newUser)
      throw new ApiError(500, "Something went wrong while creating the user");
    const newCustomer = await CustomerModel.create({
      name,
      user_id: newUser._id,
    });
    if (!newCustomer)
      throw new ApiError(
        500,
        "Something went wrong while creating the customer"
      );
    await newUser.save();
    await newCustomer.save();
    return {
      newUser,
      newCustomer,
    };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating customer");
  }
}

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

// Steps to create Customer & Employee
// 1. Extract the values from the body
// 2. Check the fields if they are empty then throw error
// 3. Check if the user is already registered if yes then throw error
// 4. Hash the password
// 5. Upload the avatar on the cloudinary
// 6. Remove the avatar image from public/temp folder
// 7. Create a new User if all above thing goes well
// 8. Checking the user is created or not
// 8.1 - Creating a employee based on role
// 8.2 - Checking the employee is created or not if not then throw error
// 8.3 - Saving the new employee
// 9. Select the fields for sending the data to the frontend
// 10. Saving the new user
// 11. Sending the response to the frontend

// Add || POST
const addAdmin = asyncHandler(async (req, res) => {
  // Step 1
  const { name, phoneNumber } = req.body;

  // Step 2
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  }

  // Step 3
  const existedUser = await UserModel.findOne({
    $or: [{ phoneNumber }, { name }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }
  // Step 4
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(phoneNumber, salt);

  // Step 5
  const localpath = req.files?.avatar[0]?.path;
  if (!localpath) throw new ApiError(400, "Avatar is required");
  const avatar = await uploadOnCloudinary(localpath);
  if (!avatar) throw new ApiError(400, "Avatar is required");

  /// Step 6
  unLinkFile(localpath)
    .then((result) => {
      console.log("Deletion result:", result);
    })
    .catch((error) => {
      console.error("Deletion error:", error);
    });

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url,
    role: "ADMIN",
  });

  // Step 8
  if (!newUser)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 9
  const createdUser = await UserModel.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }
  // Step 10
  await newUser.save();

  // Step 11
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
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

  // Step 5
  const localpath = req.files?.avatar[0]?.path;
  if (!localpath) throw new ApiError(400, "Avatar is required");
  const avatar = await uploadOnCloudinary(localpath);
  if (!avatar) throw new ApiError(400, "Avatar is required");

  // Step 6
  // unLinkFile(localpath)
  //   .then((result) => {
  //     console.log("Deletion result:", result);
  //   })
  //   .catch((error) => {
  //     console.error("Deletion error:", error);
  //   });

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

const addClothingItem = asyncHandler(async (req, res) => {
  const {
    name,
    stitchingAmtCustomer,
    stitchingAmtTailor,
    cuttingAmt,
    measurements,
  } = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (stitchingAmtCustomer === undefined) {
    throw new ApiError(400, "Stitching is Required");
  } else if (stitchingAmtTailor === undefined) {
    throw new ApiError(400, "Default Stitching Amount is Required");
  } else if (cuttingAmt === undefined) {
    throw new ApiError(400, "Default Cutting Amount is Required");
  } else if (measurements === undefined) {
    throw new ApiError(400, "Measurement is Required");
  }

  const existedClothingItem = await ClothingModel.findOne({
    name,
  });
  if (existedClothingItem) {
    throw new ApiError(409, "Clothing Item already exists");
  }

  const newClothingItem = await ClothingModel.create({
    name,
    stitchingAmtCustomer,
    stitchingAmtTailor,
    cuttingAmt,
    measurements,
  });
  if (!newClothingItem)
    throw new ApiError(500, "Something went wrong while creating the user");

  const tailors = await TailorModel.find();
  if (tailors.length === 0) {
    console.log("Currently No tailors are there");
  } else {
    for (const tailor of tailors) {
      tailor.stitchingAmounts.set(name, stitchingAmtTailor);
      await tailor.save();
    }
  }

  const cuttingMasters = await CuttingMasterModel.find();
  if (cuttingMasters.length === 0) {
    console.log("Currently No cutting masters are there");
  } else {
    for (const cuttingMaster of cuttingMasters) {
      cuttingMaster.cuttingAmounts.set(name, cuttingAmt);
      await cuttingMaster.save();
    }
  }

  await newClothingItem.save();
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newClothingItem,
        "Clothing Item created successfully"
      )
    );
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
      throw new ApiError(500, "Something went wrong while creating customer");
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
  if (!user) {
    analyticsAdd(totalAmt, "SOLD", "NEW");
  } else {
    analyticsAdd(totalAmt, "SOLD", "RETURNING");
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

  // Analytics for Stitch Bill
  if (!user) {
    analyticsAdd(finalAmt, "STITCH", "NEW");
  } else {
    analyticsAdd(finalAmt, "STITCH", "RETURNING");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, {}, "Add Stitch Bill for customer successfully")
    );
});

const giveMoneyToEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params; // employee id
  const { role } = req.query;
  const { amount } = req.body;
  if (id === undefined) throw new ApiError(400, "User Id is Required");
  if (amount === undefined) throw new ApiError(400, "Amount is Required");

  let employee;
  if (role === "HELPER") {
    employee = await HelperModel.findById(id);
    if (!employee) throw new ApiError(404, "Helper not found");
  } else if (role === "CM") {
    employee = await CuttingMasterModel.findById(id);
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (role === "TAILOR") {
    employee = await TailorModel.findById(id);
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else {
    throw new ApiError(400, "Role is not valid");
  }
  const moneyDistribution = await MoneyDistributionModel.create({
    employee_id: employee._id,
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

const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params; // customer id
  const { name, phoneNumber, avatar, password } = req.body;
  const customer = await CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, "Customer not found");
  if (name) customer.name = name;
  if (phoneNumber) customer.phoneNumber = phoneNumber;
  if (avatar) {
    const localpath = req.files?.avatar[0]?.path;
    if (!localpath) throw new ApiError(400, "Avatar is required");
    const newAvatar = await uploadOnCloudinary(localpath);
    if (!newAvatar) throw new ApiError(400, "Avatar is required");
    const user = await UserModel.findById(customer.user_id);
    if (!user) throw new ApiError(404, "User not found");
    user.avatar = newAvatar;
    unLinkFile(localpath)
      .then((result) => {
        console.log("Deletion result:", result);
      })
      .catch((error) => {
        console.error("Deletion error:", error);
      });
  }
  if (password) customer.password = password;
  await customer.save();
  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer Updated Successfully"));
});

const updateClothingItem = asyncHandler(async (req, res) => {
  const { id } = req.params; // clothing item id
  const {
    name,
    stitchingAmtCustomer,
    stitchingAmtTailor,
    cuttingAmt,
    measurements,
  } = req.body;
  const clothingItem = await ClothingModel.findById(id);
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");
  clothingItem.name = name;
  clothingItem.stitchingAmtCustomer = stitchingAmtCustomer;
  clothingItem.stitchingAmtTailor = stitchingAmtTailor;
  clothingItem.cuttingAmt = cuttingAmt;
  clothingItem.measurements = measurements;
  await clothingItem.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, clothingItem, "Clothing Item Updated Successfully")
    );
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

// Retrive || GET
const searchCustomer = asyncHandler(async (req, res) => {
  const phoneNumber = Number(req.query.phoneNumber) || 0;

  if (phoneNumber === 0)
    throw new ApiError(400, "Name or Phone Number is required");

  const customer = await UserModel.aggregate([
    {
      $match: {
        role: "CUSTOMER",
        phoneNumber,
        // $or: [{ name }, { phoneNumber }],
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "user_id",
        as: "customerDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        customer_id: {
          $arrayElemAt: ["$customerDetails._id", 0],
        },
      },
    },
    {
      $project: {
        _id: 1,
        customer_id: 1,
        name: 1,
        phoneNumber: 1,
        avatar: 1,
      },
    },
  ]);
  if (!customer[0]) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, customer[0], "Customers Retrived Successfully"));
});

const getSoldCustomersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // pageNumber
  const limit = parseInt(req.query.limit) || 10; // limit

  const totalResultsPipeline = [...pipeline, { $count: "results" }];
  const [totalResultsCount] = await SoldBillModel.aggregate(
    totalResultsPipeline
  );

  const resultPipeline = [
    ...pipeline,
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ];

  const customerList = await SoldBillModel.aggregate(resultPipeline);

  const result = {
    results: totalResultsCount ? totalResultsCount.results : 0,
    page,
    limit: limit,
    data: customerList,
  };

  if (!result) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Customers Retrived Successfully"));
});
const getStitchCustomersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // pageNumber
  const limit = parseInt(req.query.limit) || 10; // limit

  const totalResultsPipeline = [...pipeline, { $count: "results" }];
  const [totalResultsCount] = await StitchBillModel.aggregate(
    totalResultsPipeline
  );

  const resultPipeline = [
    ...pipeline,
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ];

  const customerList = await StitchBillModel.aggregate(resultPipeline);

  const result = {
    results: totalResultsCount ? totalResultsCount.results : 0,
    page,
    limit: limit,
    data: customerList,
  };

  if (!result) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Customers Retrived Successfully"));
});

const getCustomerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  if (id === undefined) {
    throw new ApiError(404, "Id is required to fetch the customer");
  }
  const customer = await CustomerModel.aggregate([
    // Finding the customer
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    // Getting the customer avatar from user collection
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              phoneNumber: 1,
            },
          },
        ],
      },
    },
    // Adding new fields stitched bill, purchased bill count and the fetched avatar(So that frnt end dev can directly use it)
    {
      $addFields: {
        stitchedBillCount: {
          $size: "$stitchedBill",
        },
        purchasedBillCount: {
          $size: "$purchasedBill",
        },
        avatar: {
          $arrayElemAt: ["$userDetails.avatar", 0],
        },
        phoneNumber: {
          $arrayElemAt: ["$userDetails.phoneNumber", 0],
        },
      },
    },
    // Removing the user details from the response as the avatar was previously addedd to the response directly
    {
      $project: {
        userDetails: 0,
      },
    },
    // Fetching the customer stitched bill details
    {
      $lookup: {
        from: "stitchbills",
        localField: "stitchedBill",
        foreignField: "_id",
        as: "stitchedBillDetails",
        // Adding Extra field of bill type to differentiate between the stitched and purchased bill
        pipeline: [
          {
            $addFields: {
              billType: "Stitched",
            },
          },
          {
            $project: {
              finalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
        ],
      },
    },
    // Fetching the customer purchased bill details
    {
      $lookup: {
        from: "soldbills",
        localField: "purchasedBill",
        foreignField: "_id",
        as: "purchasedBillDetails",
        // Adding Extra field of bill type to differentiate between the stitched and purchased bill
        pipeline: [
          {
            $addFields: {
              billType: "Purchased",
            },
          },
          {
            $project: {
              totalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
        ],
      },
    },
    // Merging the stitched and purchased bill details into a single
    {
      $addFields: {
        recentBill: {
          $concatArrays: ["$stitchedBillDetails", "$purchasedBillDetails"],
        },
      },
    },
    // Sorting the recent bill by the createdAt field
    {
      $unwind: "$recentBill",
    },
    {
      $sort: {
        "recentBill.createdAt": -1,
      },
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
        user_id: { $first: "$user_id" },
        stitchedBillCount: { $first: "$stitchedBillCount" },
        purchasedBillCount: { $first: "$purchasedBillCount" },
        avatar: { $first: "$avatar" },
        phoneNumber: { $first: "$phoneNumber" },
        measurements: { $first: "$measurements" },
        recentBill: { $push: "$recentBill" }, // Push all sorted recentBill documents into an array
      },
    },
    // Fetching the customer measurements
    {
      $lookup: {
        from: "measurements",
        localField: "_id",
        foreignField: "customer_id",
        as: "measurements",
        pipeline: [
          {
            $project: {
              _id: 0,
              name: 1,
              measurements: 1,
            },
          },
        ],
      },
    },
    // Removing the unwanted fields from the final response
    {
      $project: {
        stitchedBill: 0,
        purchasedBill: 0,
        stitchedBillDetails: 0,
        purchasedBillDetails: 0,
        updatedAt: 0,
        createdAt: 0,
        __v: 0,
      },
    },
    // pagination
    {
      $addFields: {
        total: { $size: "$recentBill" },
        page,
        limit,
        recentBill: {
          $slice: [
            "$recentBill",
            { $add: [{ $multiply: [page, limit] }, -limit] },
            limit,
          ],
        },
      },
    },
  ]);
  if (!customer[0]) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(new ApiResponse(200, customer[0], "Customer fetched successfully"));
});

const getCustomerBills = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  if (id === undefined) {
    throw new ApiError(404, "Id is required to fetch the customer");
  }
  const customer = await CustomerModel.aggregate([
    // Finding the customer
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    // Getting the customer avatar from user collection
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              phoneNumber: 1,
            },
          },
        ],
      },
    },
    // Adding new field avatar(So that frnt end dev can directly use it)
    {
      $addFields: {
        avatar: {
          $arrayElemAt: ["$userDetails.avatar", 0],
        },
        phoneNumber: {
          $arrayElemAt: ["$userDetails.phoneNumber", 0],
        },
      },
    },
    // Removing the user details from the response as the avatar was previously addedd to the response directly
    {
      $project: {
        userDetails: 0,
      },
    },
    // Fetching the customer stitched bill details
    {
      $lookup: {
        from: "stitchbills",
        localField: "stitchedBill",
        foreignField: "_id",
        as: "stitchedBillDetails",
        // Adding Extra field of bill type to differentiate between the stitched and purchased bill
        pipeline: [
          {
            $addFields: {
              billType: "Stitched",
            },
          },
          {
            $project: {
              finalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
        ],
      },
    },
    // Fetching the customer purchased bill details
    {
      $lookup: {
        from: "soldbills",
        localField: "purchasedBill",
        foreignField: "_id",
        as: "purchasedBillDetails",
        // Adding Extra field of bill type to differentiate between the stitched and purchased bill
        pipeline: [
          {
            $addFields: {
              billType: "PURCHASED",
            },
          },
          {
            $project: {
              totalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
        ],
      },
    },
    // Merging the stitched and purchased bill details into a single array and sorting them by the createdAt field
    {
      $addFields: {
        recentBill: {
          $cond: {
            if: {
              $gt: [
                "$stitchedBillDetails.createdAt",
                "$purchasedBillDetails.createdAt",
              ],
            },
            then: "$stitchedBillDetails",
            else: "$purchasedBillDetails",
          },
        },
      },
    },
    // Projecting the required fields
    {
      $project: {
        stitchedBill: 0,
        purchasedBill: 0,
        stitchedBillDetails: 0,
        purchasedBillDetails: 0,
        updatedAt: 0,
        createdAt: 0,
        __v: 0,
      },
    },
    // pagination
    {
      $addFields: {
        total: { $size: "$recentBill" },
        page,
        limit,
        recentBill: {
          $slice: [
            "$recentBill",
            { $add: [{ $multiply: [page, limit] }, -limit] },
            limit,
          ],
        },
      },
    },
  ]);
  if (!customer) throw new ApiError(404, "Customer not found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, customer[0], "Customer bills fetched successfull")
    );
});

const getAnalytics = asyncHandler(async (req, res) => {
  const qmonth = parseInt(req.query.month) || 1;
  const qyear = parseInt(req.query.year) || 2024;

  const fullDateArray = new Date()
    .toLocaleString("default", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
    .split("/");

  const month = qmonth || fullDateArray[0];
  const year = qyear || fullDateArray[2];
  const regexOP = `${month}\/\\d+/${year}`;
  const regex = new RegExp(regexOP);
  const monthArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const qMonthInString = monthArray[month - 1]; // 0 based indexing

  const analytics = await AnalyticsModel.aggregate([
    {
      $match: {
        year,
      },
    },
    {
      $addFields: {
        monthlyData: {
          $filter: {
            input: "$monthlyData",
            as: "monthly",
            cond: {
              $eq: ["$$monthly.month", qMonthInString],
            },
          },
        },
        dailyData: {
          $filter: {
            input: "$dailyData",
            as: "daily",
            cond: {
              $regexMatch: {
                input: "$$daily.date",
                regex,
              },
            },
          },
        },
      },
    },
  ]);
  if (!analytics[0]) throw new ApiError(404, "Analytics not found");
  res
    .status(200)
    .json(new ApiResponse(200, analytics[0], "Analytics fetched successfull"));
});

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
  if (!employees[0]) throw new ApiError(404, "Employees not found");
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

const getClothingItems = asyncHandler(async (req, res) => {
  const clothingItems = await ClothingModel.find();
  if (!clothingItems) throw new ApiError(404, "Clothing Items not found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, clothingItems, "Clothing Items fetched successfully")
    );
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

const getClothingItemMeasurementNames = asyncHandler(async (req, res) => {
  const { name } = req.params;
  if (name.trim() === undefined)
    throw new ApiError(400, "Clothing Item name is required");

  const clothingItem = await ClothingModel.findOne({ name });
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        clothingItem.measurements,
        "Clothing Item measurement names fetched successfully"
      )
    );
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

// Auth || POST
const login = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;
  if (!phoneNumber) throw new ApiError(400, "Phone number is required");
  if (!password) throw new ApiError(400, "Password is required");

  const user = await UserModel.findOne({ phoneNumber });
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcryptjs.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await UserModel.findById(user._id).select(
    "-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -verifyToken -verifyTokenExpiry -__v"
  );

  return res.status(200).json(
    new ApiResponse(200, {
      user: loggedInUser,
      accessToken,
      refreshToken,
    })
  );
});

const logout = asyncHandler(async (req, res) => {
  await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: null,
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
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
  giveMoneyToEmployee,
  updateEmployee,
  updateCustomer,
  updateClothingItem,
  updateMeasurement,
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
  login,
  logout,
  getClothingItems,
  getClothingItemMeasurementNames,
  deleteClothingItem,
};
