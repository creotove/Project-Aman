import bcryptjs from "bcryptjs";

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
import MeasurementHistoryModel from "../models/MeasurementHistoryModel.js";
import SoldBillModel from "../models/SoldBillModel.js";
import StitchBillModel from "../models/StitchBillModel.js";
import { analyticsAdd } from "../utils/analyticsAdd.js";
import BillNumberCounter from "../models/BillNumberCounter.js";

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
  const unlinked = unLinkFile(localpath);
  if (unlinked) {
    console.log("File deleted successfully");
  } else {
    throw new ApiError(400, "Error in deleting the file");
  }

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

const addHelper = asyncHandler(async (req, res) => {
  // Step 1
  const { name, phoneNumber, monthly } = req.body;
  console.log(req.body);

  // Step 2
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (monthly === undefined) {
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
  const localpath = req.files.avatar[0]?.path;
  if (!localpath) throw new ApiError(400, "Avatar is required in local path");
  const avatar = await uploadOnCloudinary(localpath);
  if (!avatar) throw new ApiError(400, "Avatar is required in cloudinary url");

  // Step 6
  const unlinked = unLinkFile(localpath);
  if (unlinked) {
    console.log("File deleted successfully");
  } else {
    throw new ApiError(400, "Error in deleting the file");
  }

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url,
    role: "HELPER",
  });
  // Step 8
  if (!newUser)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.1
  const newHelper = HelperModel.create({
    name,
    phoneNumber,
    monthly,
    userDocument: newUser._id,
  });

  // Step 8.2
  if (!newHelper)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.3
  (await newHelper).save();

  // Step 9
  const createdHelper = await UserModel.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdHelper) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  // Step 10
  await newUser.save();

  // Step 11
  return res
    .status(201)
    .json(new ApiResponse(200, createdHelper, "User registered successfully"));
});

const addCM = asyncHandler(async (req, res) => {
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

  // Step 6
  const unlinked = unLinkFile(localpath);
  if (unlinked) {
    console.log("File deleted successfully");
  } else {
    throw new ApiError(400, "Error in deleting the file");
  }

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url,
    role: "CUTTING MASTER",
  });

  // Step 8
  if (!newUser)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.1
  const newCuttingMaster = CuttingMasterModel.create({
    name,
    phoneNumber,
    userDocument: newUser._id,
    cuttingAmounts: new Map(),
  });

  // Step 8.2
  if (!newCuttingMaster)
    throw new ApiError(500, "Something went wrong while creating the user");
  const clothingItems = await ClothingModel.find();
  if (clothingItems.length === 0) {
    console.log("Currently No clothing items are there");
  } else {
    for (const clothingItem of clothingItems) {
      newCuttingMaster.cuttingAmounts.set(
        clothingItem.name,
        clothingItem.defaultCuttingAmt
      );
    }
  }
  // Step 8.3
  (await newCuttingMaster).save();

  // Step 9
  const createdCuttingMaster = await UserModel.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdCuttingMaster) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  // Step 10
  await newUser.save();

  // Step 11
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdCuttingMaster, "User registered successfully")
    );
});

const addTailor = asyncHandler(async (req, res) => {
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

  // Step 6
  const unlinked = unLinkFile(localpath);
  if (unlinked) {
    console.log("File deleted successfully");
  } else {
    throw new ApiError(400, "Error in deleting the file");
  }

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url,
    role: "CUTTING MASTER",
  });

  // Step 8
  if (!newUser)
    throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.1
  const newTailor = TailorModel.create({
    name,
    phoneNumber,
    userDocument: newUser._id,
  });

  // Step 8.2
  if (!newTailor)
    throw new ApiError(500, "Something went wrong while creating the user");
  const clothingItems = await ClothingModel.find();
  if (clothingItems.length === 0) {
    console.log("Currently No clothing items are there");
  } else {
    for (const clothingItem of clothingItems) {
      (await newTailor).stitchingAmounts.set(
        clothingItem.name,
        clothingItem.defaultStitchingAmt
      );
    }
  }
  // Step 8.3
  (await newCuttingMaster).save();

  // Step 9
  const createdCuttingMaster = await UserModel.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdCuttingMaster) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  // Step 10
  await newUser.save();

  // Step 11
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdCuttingMaster, "User registered successfully")
    );
});

// const addCustomer = asyncHandler(async (req, res) => {
//   // Step 1
//   const { name, phoneNumber } = req.body;

//   // Step 2
//   if (name.trim() === "") {
//     throw new ApiError(400, "Name is Required");
//   } else if (phoneNumber === undefined) {
//     throw new ApiError(400, "Phone number is Required");
//   }
//   // Step 2 try
//   [name, phoneNumber].some((field) => {
//     if (field.trim() === "") {
//       throw new ApiError(400, `${field} is Required`);
//     }
//   });

//   // Step 3
//   const existedUser = await UserModel.findOne({
//     $or: [{ phoneNumber }, { name }],
//   });
//   if (existedUser) {
//     throw new ApiError(409, "User already exists");
//   }

//   // Step 4
//   const salt = await bcryptjs.genSalt(10);
//   const hashedPassword = await bcryptjs.hash(phoneNumber, salt);

//   // Step 5
//   const localpath = req.files?.avatar[0]?.path;
//   if (!localpath) throw new ApiError(400, "Avatar is required");
//   const avatar = await uploadOnCloudinary(localpath);
//   if (!avatar) throw new ApiError(400, "Avatar is required");

//   // Step 6
//   const unlinked = unLinkFile(localpath);
//   if (unlinked) {
//     console.log("File deleted successfully");
//   } else {
//     throw new ApiError(400, "Error in deleting the file");
//   }

//   // Step 7
//   const newUser = await UserModel.create({
//     name,
//     password: hashedPassword,
//     phoneNumber,
//     avatar: avatar.url,
//     role: "CUSTOMER",
//   });

//   // Step 8
//   if (!newUser)
//     throw new ApiError(500, "Something went wrong while creating the user");

//   // Step 8.1
//   const newCustomer = CustomerModel.create({
//     name,
//     user_id: newUser._id,
//   });

//   // Step 8.2
//   if (!newCustomer)
//     throw new ApiError(500, "Something went wrong while creating the user");

//   // Step 8.3
//   (await newCustomer).save();

//   // Step 9
//   const createdUser = await UserModel.findById(newUser._id).select(
//     "-password -refreshToken"
//   );
//   if (!createdUser) {
//     throw new ApiError(500, "Something went wrong while fetching the user");
//   }

//   // Step 10
//   await newUser.save();

//   // Step 11
//   return res
//     .status(201)
//     .json(new ApiResponse(201, createdUser, "User registered successfully"));
// });

const addClothingItem = asyncHandler(async (req, res) => {
  const { name, stitchingAmt, defaultStitchingAmt, defaultCuttingAmt } =
    req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (stitchingAmt === undefined) {
    throw new ApiError(400, "Stitching is Required");
  } else if (defaultStitchingAmt === undefined) {
    throw new ApiError(400, "Default Stitching Amount is Required");
  } else if (defaultCuttingAmt === undefined) {
    throw new ApiError(400, "Default Cutting Amount is Required");
  }

  const existedClothingItem = await ClothingModel.findOne({
    name,
  });
  if (existedClothingItem) {
    throw new ApiError(409, "Clothing Item already exists");
  }
  let imageUrl;
  if (req.files?.image) {
    console.log("in image upload");
    const localpath = req.files?.image[0]?.path;
    if (!localpath) throw new ApiError(400, "Image is required");
    const image = await uploadOnCloudinary(localpath);
    imageUrl = image.url;
    if (!image) throw new ApiError(400, "Image is required");

    const unlinked = unLinkFile(localpath);
    if (unlinked) {
      console.log("File deleted successfully");
    } else {
      throw new ApiError(400, "Error in deleting the file");
    }
  }

  const newClothingItem = await ClothingModel.create({
    name,
    stitchingAmt,
    defaultStitchingAmt,
    defaultCuttingAmt,
    image: imageUrl ? imageUrl : "N/A",
  });
  if (!newClothingItem)
    throw new ApiError(500, "Something went wrong while creating the user");
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
  const { measurements, customerRequirements, name } = req.body;
  if (measurements === undefined) {
    throw new ApiError(400, "Measurements are Required");
  } else if (id === undefined) {
    throw new ApiError(400, "Customer Id is Required");
  }
  const newMeasurements = await MeasurementModel.create({
    name,
    customer_id: id,
    measurements,
    customerRequirements: customerRequirements
      ? customerRequirements
      : [{ name: "No Req.", value: "", description: "" }],
  });
  if (!newMeasurements)
    throw new ApiError(500, "Something went wrong while creating the user");
  const newMeasurementHistory = await MeasurementHistoryModel.create({
    measurement_id: newMeasurements._id,
    customer_id: id,
  });
  if (!newMeasurementHistory)
    throw new ApiError(500, "Something went wrong while creating the user");
  await newMeasurementHistory.save();
  await newMeasurements.save();

  return res
    .status(201)
    .json(new ApiResponse(201, "Add Measurement for customer successfully"));
});

const addSoldBill = asyncHandler(async (req, res) => {
  const { name, phoneNumber, totalAmt } = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (totalAmt === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  }

  const user = await UserModel.findOne({ phoneNumber });
  const billNumber = await BillNumberCounter.findOne();
  if (!billNumber) {
    const newBillNumber = await BillNumberCounter.create({
      billNumber: 1,
    });
    if (!newBillNumber)
      throw new ApiError(
        500,
        "Something went wrong while creating bill number"
      );
    await newBillNumber.save();
  }
  if (!user) {
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
    const newSoldBill = await SoldBillModel.create({
      name,
      user_id: newUser._id,
      customer_id: newCustomer._id,
      phoneNumber,
      totalAmt,
      billNumber: billNumber.billNumber + 1,
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
      billNumber: billNumber.billNumber + 1,
    });
    if (!newSoldBill)
      throw new ApiError(500, "Something went wrong while creating the user");
    billNumber.billNumber = billNumber.billNumber + 1;
    const customer = await CustomerModel.findOne({ user_id: user._id });
    if (!customer)
      throw new ApiError(500, "Something went wrong while creating the user");
    customer.purchasedBill.push(newSoldBill._id);

    await customer.save();
    await billNumber.save();
    await newSoldBill.save();
    await user.save();
  }

  // Analytics for Stitch Bill
  analyticsAdd(totalAmt, "SOLD");

  return res
    .status(201)
    .json(new ApiResponse(201, "Add Sold Bill for user successfully"));
});

const addStitchBill = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    totalAmt,
    clothes,
    clothAmt,
    deliveryDate,
    subTotal,
    finalAmt,
    advanceAmt,
  } = req.body;
  // Retrive the bill number
  const billNumber = await BillNumberCounter.findOne();
  if (!billNumber) {
    const newBillNumber = await BillNumberCounter.create({
      billNumber: 1,
    });
    if (!newBillNumber)
      throw new ApiError(
        500,
        "Something went wrong while creating bill number"
      );
  }

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
  } else if (subTotal === undefined) {
    throw new ApiError(400, "Sub Total is Required");
  } else if (finalAmt === undefined) {
    throw new ApiError(400, "Final Amount is Required");
  }

  // Check if the customer is already registered or not
  const user = await UserModel.findOne({ phoneNumber });

  // If not registered then create a new customer
  if (!user) {
    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(phoneNumber.toString(), salt);
    if (!hashedPassword)
      throw new ApiError(
        500,
        "Something went wrong while hashing the password"
      );

    // Create a new user
    const newUser = await UserModel.create({
      name,
      phoneNumber,
      role: "CUSTOMER",
      password: hashedPassword,
    });
    if (!newUser)
      throw new ApiError(500, "Something went wrong while creating the user");

    // Create a new customer
    const newCustomer = await CustomerModel.create({
      name,
      user_id: newUser._id,
    });
    if (!newCustomer) {
      throw new ApiError(
        500,
        "Something went wrong while creating the customer"
      );
    }

    const newStitchBill = await StitchBillModel.create({
      name,
      user_id: newUser._id,
      customer_id: newCustomer._id,
      phoneNumber,
      totalAmt,
      clothes,
      clothAmt,
      deliveryDate,
      subTotal,
      finalAmt,
      advanceAmt,
      billNumber: billNumber.billNumber + 1,
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
    if (!customer)
      throw new ApiError(500, "Something went wrong while creating the user");

    const newStitchBill = await StitchBillModel.create({
      name,
      user_id: user._id,
      customer_id: customer._id,
      phoneNumber,
      totalAmt,
      clothes,
      clothAmt,
      deliveryDate,
      subTotal,
      finalAmt,
      advanceAmt,
      billNumber: billNumber.billNumber + 1,
    });
    if (!newStitchBill)
      throw new ApiError(500, "Something went wrong while creating the user");
    customer.stitchedBill.push(newStitchBill._id);

    await newStitchBill.save();
    await customer.save();
  }

  // Analytics for Stitch Bill
  analyticsAdd(finalAmt, "STITCH");

  billNumber.billNumber = billNumber.billNumber + 1;
  await billNumber.save();

  return res
    .status(201)
    .json(new ApiResponse(201, "Add Stitch Bill for customer successfully"));
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
      const unlinked = unLinkFile(localpath);
      if (unlinked) {
        console.log("File deleted successfully");
      } else {
        throw new ApiError(400, "Error in deleting the file");
      }
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
      const unlinked = unLinkFile(localpath);
      if (unlinked) {
        console.log("File deleted successfully");
      } else {
        throw new ApiError(400, "Error in deleting the file");
      }
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
    const unlinked = unLinkFile(localpath);
    if (unlinked) {
      console.log("File deleted successfully");
    } else {
      throw new ApiError(400, "Error in deleting the file");
    }
  }
  if (password) customer.password = password;
  await customer.save();
  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer Updated Successfully"));
});

const updateClothingItem = asyncHandler(async (req, res) => {
  const { id } = req.params; // clothing item id
  const { name, stitching, defaultStitchingAmt, defaultCuttingAmt } = req.body;
  const clothingItem = await ClothingModel.findById(id);
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");
  if (name) clothingItem.name = name;
  if (stitching) clothingItem.defaultStitchingAmt = stitching;
  if (defaultStitchingAmt)
    clothingItem.defaultStitchingAmt = defaultStitchingAmt;
  if (defaultCuttingAmt) clothingItem.defaultCuttingAmt = defaultCuttingAmt;
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

// Retrive || GET
const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber } = req.params;
  const cust = await CustomerModel.findOne({
    $or: [{ _id: id }, { name }, { phoneNumber }],
  }).populate("stitchedBill purchasedBill");
  if (!cust) throw new ApiError(404, "Customer not found");
  const user = await UserModel.findById(cust.user_id)
    .select("avatar phoneNumber")
    .lean();
  if (!user) throw new ApiError(404, "User not found");
  const customer = {
    _id: cust._id,
    name: cust.name,
    phoneNumber: user.phoneNumber,
    avatar: user.avatar,
    stitchedBill: cust.stitchedBill,
    purchasedBill: cust.purchasedBill,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer Retrived Successfully"));
});

const getCustomers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const customers = await CustomerModel.find();
  const totalCustomers = customers.length;
  const startIndex = (page - 1) * limit ? limit : 10;
  const endIndex = page * limit ? limit : 10;
  const results = {};
  if (endIndex < totalCustomers) {
    results.next = {
      page: page + 1,
      limit: limit ? limit : 10,
    };
  }
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit ? limit : 10,
    };
  }
  results.totalCustomers = totalCustomers;
  results.results = await CustomerModel.find()
    .limit(limit ? limit : 10)
    .skip(startIndex);
  return res
    .status(200)
    .json(new ApiResponse(200, results, "Customers Retrived Successfully"));
});
export {
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
  updateClothingItem,
  updateMeasurement,
  getCustomer,
  getCustomers,
};
