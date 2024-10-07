import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import WholeSalerModel from "../models/WholeSaler.js";
import WholeSaleBillModel from "../models/WholeSaleBillModel.js";
export const getWholeSalers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  const wholeSalers = await WholeSalerModel.find()
    .select("name email phone address")
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit);
  if (!wholeSalers) res.status(404).json(new ApiResponse(404, {}, "Not Found"));
  return res.status(200).json(new ApiResponse(200, wholeSalers, "Whole Salers fetched successfully"));
});

export const getWholeSaleBills = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  const wholeSaleBills = await WholeSaleBillModel.find()
    .select("totalAmount wholeSalerName paymentStatus payabeledAmount")
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit);
  if (!wholeSaleBills) res.status(404).json(new ApiResponse(404, {}, "Not Found"));
  return res.status(200).json(new ApiResponse(200, wholeSaleBills, "Whole Sale Bills fetched successfully"));
});

export const getWholeSaler = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required to fetch the whole saler");
  const wholeSaler = await WholeSalerModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "wholeSaleBill",
        localField: "wholeSaleBill",
        foreignField: "_id",
        as: "wholeSaleBillDetails",
        pipeline: [
          {
            $project: {
              totalAmount: 1,
              paymentStatus: 1,
              payabeledAmount: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]);
  if (!wholeSaler[0]) throw new ApiError(404, "Whole Saler not found");

  return res.status(200).json(new ApiResponse(200, wholeSaler[0], "Whole Saler fetched successfully"));
});

export const getWholeSaleBill = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required to fetch the whole sale bill");
  const wholeSaleBill = await WholeSaleBillModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "wholeSaler",
        localField: "wholeSaler",
        foreignField: "_id",
        as: "wholeSalerDetails",
        pipeline: [
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              phone: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        wholeSalerDetails: {
          $arrayElemAt: ["$wholeSalerDetails", 0],
        },
      },
    },
    {
      $project: {
        wholeSaler: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  if (!wholeSaleBill[0]) throw new ApiError(404, "Whole Sale Bill not found");

  return res.status(200).json(new ApiResponse(200, wholeSaleBill[0], "Whole Sale Bill fetched successfully"));
});

export const getWholeSalerIdName = asyncHandler(async (req, res) => {
  const wholeSalers = await WholeSalerModel.find().select("name");
  if (!wholeSalers) throw new ApiError(404, "Whole Salers not found");
  return res.status(200).json(new ApiResponse(200, wholeSalers, "Whole Salers fetched successfully"));
});

export const addWholeSaler = asyncHandler(async (req, res) => {
  const {name, email, phone, address} = req.body;
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
    $or: [{email}, {phone}],
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
  if (!newWholeSaler) throw new ApiError(500, "Something went wrong while creating the user");

  await newWholeSaler.save();

  return res.status(201).json(new ApiResponse(201, {}, "Whole Saler created successfully"));
});

export const addWholeSaleBill = asyncHandler(async (req, res) => {
  const {billNo, totalAmount, wholeSaler, paymentStatus, paymentDate, payabeledAmount, paidAmount} = req.body;

  if (billNo === undefined) throw new ApiError(400, "Bill Number is Required");
  else if (totalAmount === undefined) throw new ApiError(400, "Total Amount is Required");
  else if (wholeSaler === undefined) throw new ApiError(400, "Whole Saler is Required");
  else if (paymentStatus === undefined) throw new ApiError(400, "Payment Status is Required");
  else if (paymentDate === undefined) throw new ApiError(400, "Payment Date is Required");
  else if (payabeledAmount === undefined) throw new ApiError(400, "Payabeled Amount is Required");
  else if (paidAmount === undefined) throw new ApiError(400, "Paid Amount is Required");

  const localpath = req.files?.image[0]?.path;
  if (!localpath) throw new ApiError(400, "Receipt image is required");
  const receiptImage = await uploadOnCloudinary(localpath);
  if (!receiptImage) throw new ApiError(400, "Failed to uplaod image on cloudinary");

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
  if (!newWholeSaleBill) throw new ApiError(500, "Something went wrong while creating the user");

  await newWholeSaleBill.save();

  return res.status(201).json(new ApiResponse(201, {}, "Whole Sale Bill created successfully"));
});
