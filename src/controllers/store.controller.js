
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {unLinkFile} from "../utils/unLinkFile.js";

import CuttingMasterModel from "../models/CuttingMasterModel.js";
import ClothingModel from "../models/ClothingModel.js";
import TailorModel from "../models/TailorModel.js";
import mongoose from "mongoose";
import FabricModel from "../models/FabricModel.js";
import WholeSalerModel from "../models/WholeSaler.js";

export const getClothingItems = asyncHandler(async (req, res) => {
  const clothingItems = await ClothingModel.find();
  if (!clothingItems) throw new ApiError(404, "Clothing Items not found");
  return res.status(200).json(new ApiResponse(200, clothingItems, "Clothing Items fetched successfully"));
});

export const updateClothingItem = asyncHandler(async (req, res) => {
  const {id} = req.params; // clothing item id
  const {name, stitchingAmtCustomer, stitchingAmtTailor, cuttingAmt, measurements} = req.body;
  const clothingItem = await ClothingModel.findById(id);
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");
  clothingItem.name = name;
  clothingItem.stitchingAmtCustomer = stitchingAmtCustomer;
  clothingItem.stitchingAmtTailor = stitchingAmtTailor;
  clothingItem.cuttingAmt = cuttingAmt;
  clothingItem.measurements = measurements;
  await clothingItem.save();
  return res.status(200).json(new ApiResponse(200, clothingItem, "Clothing Item Updated Successfully"));
});
export const addClothingItem = asyncHandler(async (req, res) => {
  const {name, stitchingAmtCustomer, stitchingAmtTailor, cuttingAmt, measurements} = req.body;
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
  if (!newClothingItem) throw new ApiError(500, "Something went wrong while creating the user");

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
  return res.status(201).json(new ApiResponse(201, newClothingItem, "Clothing Item created successfully"));
});

export const deleteClothingItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    throw new ApiError(400, "Id is required to delete the clothing item");

  const clothingItem = await ClothingModel.findByIdAndDelete(id);
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Clothing Item deleted successfully"));
});

export const addFabricItem = asyncHandler(async (req, res) => {
  const {name, purchasedPerMtrPrice, sellingPerMtrPrice, purchasedFrom, description, patternName, stock, totalMtrsWhenBought} = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (purchasedPerMtrPrice === undefined) {
    throw new ApiError(400, "Price Per Meter is Required");
  } else if (sellingPerMtrPrice === undefined) {
    throw new ApiError(400, "Price Per Meter is Required");
  } else if (purchasedFrom.trim() === "") {
    throw new ApiError(400, "Purchased From is Required");
  } else if (description.trim() === "") {
    throw new ApiError(400, "Description is Required");
  } else if (patternName.trim() === "") {
    throw new ApiError(400, "Pattern Name is Required");
  } else if (stock === undefined) {
    throw new ApiError(400, "Stock is Required");
  } else if (totalMtrsWhenBought === undefined) {
    throw new ApiError(400, "Total Meters When Bought is Required");
  }
  const existedFabricItem = await FabricModel.findOne({
    $or: [{name}, {patternName}],
  });
  if (existedFabricItem) {
    throw new ApiError(409, "Fabric Item already exists");
  }

  const localpath = req.files?.image[0]?.path;
  console.log("Localpath:", localpath);
  console.log("req.files:", req.body);
  if (!localpath) throw new ApiError(400, "Fabric image is required");
  const image = await uploadOnCloudinary(localpath);
  if (!image) throw new ApiError(400, "Failed to uplaod image on cloudinary");

  // Step 6
  unLinkFile(localpath)
    .then((result) => {
      console.log("Deletion result:", result);
    })
    .catch((error) => {
      console.error("Deletion error:", error);
    });

  const wholeSaler = await WholeSalerModel.findById(purchasedFrom);

  const newFabricItem = await FabricModel.create({
    name,
    purchasedPerMtrPrice,
    sellingPerMtrPrice,
    image: image.url,
    purchasedFrom,
    wholeSalerName: wholeSaler.name,
    description,
    patternName,
    stock,
    totalMtrsWhenBought,
    totalMtrsRemaining: totalMtrsWhenBought,
  });

  if (!newFabricItem) throw new ApiError(500, "Something went wrong while creating the user");

  await newFabricItem.save();

  return res.status(201).json(new ApiResponse(201, {}, "Fabric Item created successfully"));
});

export const getFabricItems = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // limit
  const page = parseInt(req.query.page) || 1; // pageNumber
  const fabricItems = await FabricModel.find()
    .select("name wholeSalerName purchasedFrom pricePerMeter sellingPerMtrPrice createdAt image totalMtrsRemaining")
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit);
  if (!fabricItems) res.status(404).json(new ApiResponse(404, {}, "Not Found"));
  return res.status(200).json(new ApiResponse(200, fabricItems, "Fabric Items fetched successfully"));
});
export const getFabricItem = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required to fetch the fabric item");
  const fabricItem = await FabricModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "wholeSaler",
        localField: "purchasedFrom",
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
        purchasedFrom: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);
  if (!fabricItem[0]) throw new ApiError(404, "Fabric Item not found");

  return res.status(200).json(new ApiResponse(200, fabricItem[0], "Fabric Item fetched successfully"));
});
