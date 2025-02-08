import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import UserModel from "../models/UserModel.js";
import ClothingModel from "../models/ClothingModel.js";
import MeasurementModel from "../models/MeasurementModel.js";
import CustomerModel from "../models/CustomerModel.js";
import {createCustomer} from "./sales.controller.js";
export const addMeasurement = asyncHandler(async (req, res) => {
  const {id} = req.params; // customer id
  let {measurements, name} = req.body;
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
    if (!newMeasurement) throw new ApiError(500, "Something went wrong while creating the user");
    customer.measurements.push(newMeasurement._id);
    await customer.save();
    await newMeasurement.save();
  } else {
    existedMeasurement.measurements = measurements;
    await existedMeasurement.save();
  }

  return res.status(201).json(new ApiResponse(201, `Add Measurement for ${customer?.name} successfully`));
});

// export const checkMeasurements = asyncHandler(async (req, res) => {
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

export const checkMeasurements = asyncHandler(async (req, res) => {
  const {name, phoneNumber, clothingItems} = req.body;

  let user = await UserModel.findOne({phoneNumber});
  const measurmentsOccurred = new Map();
  const measurements = [];

  if (!user) {
    const {newCustomer, newUser} = await createCustomer(name, phoneNumber);
    if (!newCustomer && !newUser) throw new ApiError(500, "User is already registered");
    for (const clothingItem of clothingItems) {
      measurmentsOccurred.set(clothingItem, false);
      const clothingItemDetails = await ClothingModel.findOne({
        name: clothingItem,
      });
      if (!clothingItemDetails) throw new ApiError(404, "Clothing Item not found");
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
    const customer = await CustomerModel.findOne({user_id: user._id});
    for (const clothingItem of clothingItems) {
      const measurement = await MeasurementModel.findOne({
        customer_id: customer._id,
        name: clothingItem,
      }).select("-_id -customer_id -createdAt -updatedAt -__v -customer_id -customerRequirements");
      if (!measurement) {
        measurmentsOccurred.set(clothingItem, false);
        const clothingItemDetails = await ClothingModel.findOne({
          name: clothingItem,
        });
        if (!clothingItemDetails) throw new ApiError(404, "Clothing Item not found");
        measurements.push({
          name: clothingItem,
          measurements: getDefaultMeasurements(clothingItemDetails.measurements),
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

export const getClothingItemMeasurementNames = asyncHandler(async (req, res) => {
  const {name} = req.params;
  if (name.trim() === undefined) throw new ApiError(400, "Clothing Item name is required");

  const clothingItem = await ClothingModel.findOne({name});
  if (!clothingItem) throw new ApiError(404, "Clothing Item not found");

  return res.status(200).json(new ApiResponse(200, clothingItem.measurements, "Clothing Item measurement names fetched successfully"));
});

// Function to get default measurements object with values set to 0
const getDefaultMeasurements = (measurementNames) => {
  const defaultMeasurements = {};
  measurementNames.forEach((name) => {
    defaultMeasurements[name] = 0;
  });
  return defaultMeasurements;
};
