import bcryptjs from "bcryptjs";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {unLinkFile} from "../utils/unLinkFile.js";
import UserModel from "../models/UserModel.js";
import AnalyticsModel from "../models/AnalyticsModel.js";
import redisClient from "../config/redis.js";

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

export const addAdmin = asyncHandler(async (req, res) => {
  // Step 1
  const { name, phoneNumber, password } = req.body;

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
  const hashedPassword = await bcryptjs.hash(password, salt);

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
  if (!newUser) throw new ApiError(500, "Something went wrong while creating the user");

  // Step 9
  const createdUser = await UserModel.findById(newUser._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }
  // Step 10
  await newUser.save();

  // Step 11
  return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const client = await redisClient();
  const result = await client.get('analytics');
  if (result) {
    return res.status(200).json(new ApiResponse(200, JSON.parse(result), "Analytics fetched successfully"));
  }
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
  const monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
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
  await client.set('analytics', JSON.stringify(analytics[0]));

  res.status(200).json(new ApiResponse(200, analytics[0], "Analytics fetched successfull"));
});
