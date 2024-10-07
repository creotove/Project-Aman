import bcryptjs from "bcryptjs";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {unLinkFile} from "../utils/unLinkFile.js";
import UserModel from "../models/UserModel.js";
import CustomerModel from "../models/CustomerModel.js";
import SoldBillModel from "../models/SoldBillModel.js";
import StitchBillModel from "../models/StitchBillModel.js";
import mongoose from "mongoose";
import {pipeline} from "../constants/index.js";

export const getAllCustomersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // pageNumber
  const limit = parseInt(req.query.limit) || 10; // limit

  const totalResultsPipeline = [...pipeline, {$count: "results"}];
  const [totalResultsCount] = await CustomerModel.aggregate(totalResultsPipeline);

  const resultPipeline = [
    ...pipeline,
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ];

  const customerList = await CustomerModel.aggregate(resultPipeline);

  const result = {
    results: totalResultsCount ? totalResultsCount.results : 0,
    page,
    limit: limit,
    data: customerList,
  };

  if (!result) throw new ApiError(404, "Customer not found");
  return res.status(200).json(new ApiResponse(200, result, "Customers Retrived Successfully"));
});

export const searchCustomerBasedOnPhoneNumber = asyncHandler(async (req, res) => {
  const {phoneNumber} = req.params;

  if (phoneNumber === undefined) throw new ApiError(400, "Phone Number is required");
  if (phoneNumber.trim().length !== 10) throw new ApiError(400, "Phone Number is not valid");
  const customer = await UserModel.aggregate([
    {
      $match: {
        phoneNumber: Number(phoneNumber),
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
  return res.status(200).json(new ApiResponse(200, customer[0], "Customers Retrived Successfully"));
});

export const searchCustomerBasedOnName = asyncHandler(async (req, res) => {
  const {name} = req.params;
  if (name === undefined) throw new ApiError(400, "Name is required");
  if (name.trim() === "") throw new ApiError(400, "Name is required");
  if (name.length < 3) throw new ApiError(400, "Name should be atleast 3 characters long");

  const customer = await UserModel.aggregate([
    {
      $match: {
        role: "CUSTOMER",
        name: {$regex: name, $options: "i"},
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
  return res.status(200).json(new ApiResponse(200, customer, "Customers Retrived Successfully"));
});

export const getCustomerProfile = asyncHandler(async (req, res) => {
  const {id} = req.params;
  const limit = Number(req.query.limit) || 10; // limit
  const page = Number(req.query.page) || 1; // pageNumber
  if (!id) throw new ApiError(400, "Id is required to fetch the customer");
  const customer = await CustomerModel.aggregate([
    // Match customer by ID
    {
      $match: {_id: new mongoose.Types.ObjectId(id)},
    },
    // Lookup avatar and phoneNumber from user collection
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
    {
      $addFields: {
        avatar: {$arrayElemAt: ["$userDetails.avatar", 0]},
        phoneNumber: {$arrayElemAt: ["$userDetails.phoneNumber", 0]},
      },
    },
    {
      $project: {userDetails: 0},
    },
    // Fetching stitched bills and limiting the results
    {
      $lookup: {
        from: "stitchbills",
        localField: "stitchedBill",
        foreignField: "_id",
        as: "stitchedBillDetails",
        pipeline: [
          {
            $addFields: {billType: "Stitched"},
          },
          {
            $project: {
              finalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
          {$sort: {createdAt: -1}},
          {$limit: limit * page},
        ],
      },
    },
    // Fetching purchased bills and limiting the results
    {
      $lookup: {
        from: "soldbills",
        localField: "purchasedBill",
        foreignField: "_id",
        as: "purchasedBillDetails",
        pipeline: [
          {
            $addFields: {billType: "Purchased"},
          },
          {
            $project: {
              totalAmt: 1,
              createdAt: 1,
              billType: 1,
            },
          },
          {$sort: {createdAt: -1}},
          {$limit: limit * page},
        ],
      },
    },
    // Combine stitched and purchased bills, sort, and limit the result
    {
      $addFields: {
        recentBill: {
          $concatArrays: ["$stitchedBillDetails", "$purchasedBillDetails"],
        },
      },
    },
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
        name: {$first: "$name"},
        user_id: {$first: "$user_id"},
        stitchedBillCount: {$first: {$size: "$stitchedBill"}},
        purchasedBillCount: {$first: {$size: "$purchasedBill"}},
        avatar: {$first: "$avatar"},
        phoneNumber: {$first: "$phoneNumber"},
        measurements: {$first: "$measurements"},
        recentBill: {$push: "$recentBill"},
      },
    },
    // Only keep the required bills for the current page
    {
      $addFields: {
        recentBill: {
          $slice: ["$recentBill", (page - 1) * limit, limit],
        },
      },
    },
    // Lookup measurements
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
    // Cleanup the final response
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
    // Add pagination info
    {
      $addFields: {
        total: {$size: "$recentBill"},
        page,
        limit,
      },
    },
  ]);

  if (!customer[0]) throw new ApiError(404, "Customer not found");
  return res.status(200).json(new ApiResponse(200, customer[0], "Customer fetched successfully"));
});

export const getCustomerBills = asyncHandler(async (req, res) => {
  const {id} = req.params;
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
              $gt: ["$stitchedBillDetails.createdAt", "$purchasedBillDetails.createdAt"],
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
        total: {$size: "$recentBill"},
        page,
        limit,
        recentBill: {
          $slice: ["$recentBill", {$add: [{$multiply: [page, limit]}, -limit]}, limit],
        },
      },
    },
  ]);
  if (!customer) throw new ApiError(404, "Customer not found");
  return res.status(200).json(new ApiResponse(200, customer[0], "Customer bills fetched successfull"));
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const {id} = req.params; // customer id
  if (!id) throw new ApiError(400, "Customer Id is Required");
  const {name, phoneNumber, password, isActive} = req.body;

  const customer = await CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, "Customer not found");
  const user = await UserModel.findById(customer.user_id);
  if (!user) throw new ApiError(404, "User not found");
  const updateFields = {};

  if (Number(phoneNumber) && Number(phoneNumber) !== Number(user.phoneNumber)) {
    const number = Number(phoneNumber);
    const existedCustomer = await UserModel.findOne({
      phoneNumber: number,
    });
    if (existedCustomer) throw new ApiError(409, "Phone Number already exists");
    user.phoneNumber = number;
    updateFields.phoneNumber = number;
  }

  if (req.file?.fieldname === "avatar") {
    const localpath = req.file?.path;
    if (!localpath) throw new ApiError(400, "Avatar is required");
    const newAvatar = await uploadOnCloudinary(localpath);
    if (!newAvatar) throw new ApiError(400, "Avatar is required");
    user.avatar = newAvatar.url;
    unLinkFile(localpath)
      .then((result) => {
        console.log("Deletion result:", result);
      })
      .catch((error) => {
        console.error("Deletion error:", error);
      });
  }

  if (password) {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(password.toString(), salt);
  }

  const updateBills = async (model, updateFields) => {
    await model.updateMany({user_id: user._id}, {$set: updateFields});
  };

  if (name) {
    customer.name = name;
    user.name = name;
    updateFields.name = name;
  }

  if (Object.keys(updateFields).length > 0) {
    await Promise.all([updateBills(SoldBillModel, updateFields), updateBills(StitchBillModel, updateFields)]);
  }

  if (isActive !== undefined) {
    user.isActive = isActive;
    customer.isActive = isActive;
  }

  await Promise.all([customer.save(), user.save()]);
  return res.status(200).json(new ApiResponse(200, {}, "Customer Updated Successfully"));
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const {id} = req.params; // Customer Id
  if (!id) throw new ApiError(400, "Id is required to delete the customer");

  const customer = await CustomerModel.findByIdAndUpdate(id, {
    isActive: false,
  });

  const user = await UserModel.findByIdAndUpdate(customer.user_id, {
    isActive: false,
  });

  if (!customer || !user) throw new ApiError(404, "Customer not found");
  return res.status(200).json(new ApiResponse(200, {}, "Customer Inactived successfully"));
});
