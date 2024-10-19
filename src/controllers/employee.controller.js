import bcryptjs from "bcryptjs";
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
import mongoose from "mongoose";
import WorkModel from "../models/WorkModel.js";
import MoneyDistributionModel from "../models/MoneyDistributionModel.js";

export const addEmployee = asyncHandler(async (req, res) => {
  // Step 1
  const {name, phoneNumber, role, aadharnumber, monthly} = req.body;

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
    unLinkFile(req.file.path)
      .then((result) => {
        console.log("Deletion result:", result);
      })
      .catch((error) => {
        console.error("Deletion error:", error);
      });
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
  }

  // Step 7
  const newUser = await UserModel.create({
    name,
    password: hashedPassword,
    phoneNumber,
    avatar: avatar.url || avatar.secure_url,
    role,
  });

  // Step 8
  if (!newUser) throw new ApiError(500, "Something went wrong while creating the user");

  // Step 8.1
  if (role === "HELPER") {
    const newHelper = await HelperModel.create({
      name,
      phoneNumber,
      monthly,
      user_id: newUser._id,
      aadharnumber,
    });
    if (!newHelper) throw new ApiError(500, "Something went wrong while creating the user");
    await newHelper.save();
  } else if (role === "CM") {
    const newCuttingMaster = await CuttingMasterModel.create({
      name,
      phoneNumber,
      user_id: newUser._id,
      cuttingAmounts: new Map(),
      aadharnumber,
    });
    if (!newCuttingMaster) throw new ApiError(500, "Something went wrong while creating the user");
    const clothingItems = await ClothingModel.find();
    if (clothingItems.length === 0) {
      console.log("Currently No clothing items are there");
    } else {
      for (const clothingItem of clothingItems) {
        newCuttingMaster.cuttingAmounts.set(clothingItem.name, clothingItem.cuttingAmt);
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
    if (!newTailor) throw new ApiError(500, "Something went wrong while creating the user");
    const clothingItems = await ClothingModel.find();
    if (clothingItems.length === 0) {
      console.log("Currently No clothing items are there");
    } else {
      for (const clothingItem of clothingItems) {
        newTailor.stitchingAmounts.set(clothingItem.name, clothingItem.stitchingAmtTailor);
      }
    }
    await newTailor.save();
  } else {
    throw new ApiError(400, "Role is not valid");
  }

  // Step 10
  await newUser.save();

  // Step 11
  return res.status(201).json(new ApiResponse(200, {}, "New employee registered successfully"));
});

export const addWorkForEmployee = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id

  if (id === undefined) throw new ApiError(400, "User Id is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  const {work, totalAmount} = req.body;

  if (work === undefined) {
    throw new ApiError(400, "Cloth is Required");
  } else if (totalAmount === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  }
  let employee;
  if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Tailor not found");
    employee.earned += totalAmount;
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Cutting Master not found");
    employee.earned += totalAmount;
  }

  const newWork = await WorkModel.create({
    employeeId: employee._id,
    work,
    totalAmount,
  });
  if (!newWork) throw new ApiError(500, "Something went wrong while creating the user");

  employee.work.push(newWork._id);
  await newWork.save();
  await employee.save();
  if (!newWork) throw new ApiError(500, "Something went wrong while creating the user");
  await newWork.save();

  return res.status(201).json(new ApiResponse(201, {}, "Work added successfully"));
});

export const addAdvanceForEmployee = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  if (id === undefined) throw new ApiError(400, "User Id is Required");

  const {advance} = req.body;
  if (advance === undefined) throw new ApiError(400, "Advance is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "HELPER") {
    employee = await HelperModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Helper not found");
  }

  employee.advance += advance;
  await employee.save();

  return res.status(201).json(new ApiResponse(201, {}, "Advance added successfully"));
});

export const giveMoneyToEmployee = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  const {amount} = req.body;

  if (id === undefined) throw new ApiError(400, "User Id is Required");
  if (amount === undefined) throw new ApiError(400, "Amount is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "HELPER") {
    employee = await HelperModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Helper not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({user_id: id});
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
  if (!moneyDistribution) throw new ApiError(500, "Something went wrong while creating the user");

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

  return res.status(201).json(new ApiResponse(201, {}, "Money given to employee successfully"));
});

export const removeAdvanceFromEmployee = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  const {amount} = req.body;

  if (id === undefined) throw new ApiError(400, "User Id is Required");
  if (amount === undefined) throw new ApiError(400, "Amount is Required");

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  let employee;
  if (user.role === "HELPER") {
    employee = await HelperModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Helper not found");
  } else if (user.role === "CM") {
    employee = await CuttingMasterModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Cutting Master not found");
  } else if (user.role === "TAILOR") {
    employee = await TailorModel.findOne({user_id: id});
    if (!employee) throw new ApiError(404, "Tailor not found");
  } else {
    throw new ApiError(400, "Role is not valid");
  }
  if (amount > employee.advance) throw new ApiError(400, "Amount is greater than advance");
  employee.advance -= amount;

  await employee.save();

  return res.status(201).json(new ApiResponse(201, {}, "Advance given money to employee received"));
});
// TODO: Not using the below function
export const updateEmployee = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  const {name, phoneNumber, avatar, role, password, advance, earned, monthly} = req.body;
  if (role === "HELPER") {
    const helper = await HelperModel.findOne({user_id: id});
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
    return res.status(200).json(new ApiResponse(200, helper, "Helper Updated Successfully"));
  }
  if (role === "CUTTING MASTER") {
    const cuttingMaster = await CuttingMasterModel.findOne({user_id: id});
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
    return res.status(200).json(new ApiResponse(200, cuttingMaster, "Cutting Master Updated Successfully"));
  }
  if (role === "TAILOR") {
    const tailor = await TailorModel.findOne({user_id: id});
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
    return res.status(200).json(new ApiResponse(200, tailor, "Tailor Updated Successfully"));
  }
});

export const updateEmployeeProfile = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  const {name, employeeDetails} = req.body;

  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  if (name) user.name = name;

  if (user.role === "TAILOR") {
    const {employeeAmts: stitchingAmounts} = employeeDetails;
    const tailor = await TailorModel.findOne({user_id: id});

    if (!tailor) throw new ApiError(404, "Tailor not found");
    if (employeeDetails) tailor.stitchingAmounts = stitchingAmounts;

    await tailor.save();
  } else if (user.role === "CM") {
    const {employeeAmts: cuttingAmounts} = employeeDetails;
    const cuttingMaster = await CuttingMasterModel.findOne({user_id: id});

    if (!cuttingMaster) throw new ApiError(404, "Cutting Master not found");
    if (employeeDetails) cuttingMaster.cuttingAmounts = cuttingAmounts;

    await cuttingMaster.save();
  } else if (user.role === "HELPER") {
    const {employeeAmts: monthly} = employeeDetails;
    const helper = await HelperModel.findOne({user_id: id});

    if (!helper) throw new ApiError(404, "Helper not found");
    if (employeeDetails) helper.monthly = monthly.monthly;

    await helper.save();
  }
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Employee Updated Successfully"));
});

export const getEmployees = asyncHandler(async (req, res) => {
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
    return res.status(200).json(new ApiResponse(200, [], "No Employees found"));
  }
  res.status(200).json(new ApiResponse(200, employees, "Employees fetched successfull"));
});

export const getEmployeeProfile = asyncHandler(async (req, res) => {
  const {id} = req.params; // user id
  let qrole = req.query.role;
  const limit = parseInt(req.query.limit) || 2; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  if (qrole === "CM") {
    qrole = "cuttingmaster";
  }
  if (!id) throw new ApiError(400, "Id is required to fetch the employee");
  if (!qrole) throw new ApiError(400, "Role is required to fetch the employee");
  const role = qrole.toLowerCase() + "s";
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
        total: {$size: "$workDetails"},
        page,
        limit,
        workDetails: {
          $slice: ["$workDetails", {$add: [{$multiply: [page, limit]}, -limit]}, limit],
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

  return res.status(200).json(new ApiResponse(200, employee[0], "Employee fetched successfull"));
});

export const getWork = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required");
  const work = await WorkModel.findById(id);
  if (!work) throw new ApiError(404, "Work not found");

  return res.status(200).json(new ApiResponse(200, work, "Work fetched successfully"));
});
