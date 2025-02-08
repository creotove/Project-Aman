import bcryptjs from "bcryptjs";
import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import UserModel from "../models/UserModel.js";
import CustomerModel from "../models/CustomerModel.js";
import SoldBillModel from "../models/SoldBillModel.js";
import StitchBillModel from "../models/StitchBillModel.js";
import {analyticsHelper, billType, cookieOptions, customerType, pipeline} from "../constants/index.js";
import {dateHelperForAnalytics, analyticsAdd} from "../utils/analyticsAdd.js";

export const createCustomer = async (name, phoneNumber) => {
  try {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(phoneNumber.toString(), salt);

    const newUser = await UserModel.create({
      name,
      phoneNumber,
      role: "CUSTOMER",
      password: hashedPassword,
    });
    if (!newUser) throw new ApiError(500, "Something went wrong while creating the user");
    const newCustomer = await CustomerModel.create({
      name,
      user_id: newUser._id,
    });
    if (!newCustomer) throw new ApiError(500, "Something went wrong while creating the customer");
    await newUser.save();
    await newCustomer.save();
    return {
      newUser,
      newCustomer,
    };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating customer");
  }
};

export const addSoldBill = asyncHandler(async (req, res) => {
  const {name, phoneNumber, totalAmt, billNumber} = req.body;
  if (name.trim() === "") {
    throw new ApiError(400, "Name is Required");
  } else if (phoneNumber === undefined) {
    throw new ApiError(400, "Phone number is Required");
  } else if (totalAmt === undefined) {
    throw new ApiError(400, "Total Amount is Required");
  } else if (billNumber === undefined) {
    throw new ApiError(400, "Bill Number is Required");
  }

  const user = await UserModel.findOne({phoneNumber});
  if (!user) {
    const {newCustomer, newUser} = await createCustomer(name, phoneNumber);
    const newSoldBill = await SoldBillModel.create({
      name,
      user_id: newUser._id,
      customer_id: newCustomer._id,
      phoneNumber,
      totalAmt,
      billNumber,
    });
    if (!newSoldBill) throw new ApiError(500, "Something went wrong while creating the user");
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
    if (!newSoldBill) throw new ApiError(500, "Something went wrong while creating the user");
    const customer = await CustomerModel.findOne({user_id: user._id});
    if (!customer) throw new ApiError(500, "Something went wrong while creating the user");
    customer.purchasedBill.push(newSoldBill._id);

    await customer.save();
    await newSoldBill.save();
    await user.save();
  }

  // Analytics for Stitch Bill
  const {day, month} = dateHelperForAnalytics();
  if (!user) {
    analyticsAdd(totalAmt, billType.SOLD, customerType.NEW, analyticsHelper.ADD, false, month, day);
  } else {
    analyticsAdd(totalAmt, billType.SOLD, customerType.OLD, analyticsHelper.ADD, false, month, day);
  }

  return res.status(201).json(new ApiResponse(201, {}, "Add Sold Bill for user successfully"));
});

export const addStitchBill = asyncHandler(async (req, res) => {
  const {name, phoneNumber, totalAmt, clothes, deliveryDate, finalAmt, advanceAmt, billNumber} = req.body;
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
  const user = await UserModel.findOne({phoneNumber});

  // If not registered then create a new customer
  if (!user) {
    const {newCustomer, newUser} = await createCustomer(name, phoneNumber);

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
    const customer = await CustomerModel.findOne({user_id: user._id});
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
    if (!newStitchBill) throw new ApiError(500, "Something went wrong while creating the user");
    customer.stitchedBill.push(newStitchBill._id);

    await newStitchBill.save();
    await customer.save();
  }

  // Day and Month for Analytics
  const {day, month} = dateHelperForAnalytics();

  // Analytics for Stitch Bill
  if (!user) {
    await analyticsAdd(finalAmt, billType.STITCHED, customerType.NEW, analyticsHelper.ADD, false, month, day);
  } else {
    await analyticsAdd(finalAmt, billType.STITCHED, customerType.OLD, analyticsHelper.ADD, false, month, day);
  }

  return res.status(201).json(new ApiResponse(201, {}, "Add Stitch Bill for customer successfully"));
});

export const updateSoldBill = asyncHandler(async (req, res) => {
  const {id} = req.params; // sold bill id
  if (id === undefined) throw new ApiError(400, "Id is required");
  const {totalAmt} = req.body;

  const soldBill = await SoldBillModel.findById(id);
  if (!soldBill) throw new ApiError(404, "Sold Bill not found");

  const {day, month} = dateHelperForAnalytics(soldBill.createdAt);
  const isNegative = totalAmt < soldBill.totalAmt;
  const amountToBeAdded = Math.abs(totalAmt - soldBill.totalAmt);
  await analyticsAdd(amountToBeAdded, billType.SOLD, customerType.OLD, analyticsHelper.UPDATE, isNegative, month, day);
  soldBill.totalAmt = totalAmt;
  await soldBill.save();
  return res.status(200).json(new ApiResponse(200, {}, "Sold Bill Updated Successfully"));
});

export const updateStitchedBill = asyncHandler(async (req, res) => {
  const {id} = req.params; // stitched bill id
  if (id === undefined) throw new ApiError(400, "Id is required");
  const {totalAmt, clothes, deliveryDate, finalAmt, advanceAmt} = req.body;

  const stitchedBill = await StitchBillModel.findById(id);
  if (!stitchedBill) throw new ApiError(404, "Stitched Bill not found");

  const {day, month} = dateHelperForAnalytics(stitchedBill.createdAt);
  const isNegative = finalAmt < stitchedBill.finalAmt;
  const amountToBeAdded = Math.abs(finalAmt - stitchedBill.finalAmt);
  await analyticsAdd(amountToBeAdded, billType.STITCHED, customerType.OLD, analyticsHelper.UPDATE, isNegative, month, day);
  if (clothes) stitchedBill.clothes = clothes;
  if (deliveryDate) stitchedBill.deliveryDate = deliveryDate;
  if (finalAmt) stitchedBill.finalAmt = finalAmt;
  if (advanceAmt) stitchedBill.advanceAmt = advanceAmt;
  if (totalAmt) stitchedBill.totalAmt = totalAmt;
  await stitchedBill.save();
  return res.status(200).json(new ApiResponse(200, {}, "Stitched Bill Updated Successfully"));
});

export const deleteSoldBill = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required to delete the sold bill");

  const soldBill = await SoldBillModel.findById(id);
  if (!soldBill) throw new ApiError(404, "Sold Bill not found");

  const {month, day} = dateHelperForAnalytics(soldBill.createdAt);

  await analyticsAdd(soldBill.totalAmt, billType.SOLD, customerType.OLD, analyticsHelper.DELETE, true, month, day);

  const customerThatBillBelongsTo = await CustomerModel.findOne({
    purchasedBill: id,
  });

  if (customerThatBillBelongsTo) {
    customerThatBillBelongsTo.purchasedBill = customerThatBillBelongsTo.purchasedBill.filter((bill) => bill.toString() !== id);
    await customerThatBillBelongsTo.save();
  }

  const deletedBill = await SoldBillModel.findByIdAndDelete(id);
  if (!deletedBill) throw new ApiError(404, "Error deleting the sold bill");
  return res.status(200).json(new ApiResponse(200, {}, "Sold Bill deleted successfully"));
});

export const deleteStitchBill = asyncHandler(async (req, res) => {
  const {id} = req.params;
  if (!id) throw new ApiError(400, "Id is required to delete the stitch bill");

  const stitchBill = await StitchBillModel.findById(id);
  if (!stitchBill) throw new ApiError(404, "Stitch Bill not found");

  const {month, day} = dateHelperForAnalytics(stitchBill.createdAt);

  await analyticsAdd(stitchBill.finalAmt, billType.STITCHED, customerType.OLD, analyticsHelper.DELETE, true, month, day);

  const customerThatBillBelongsTo = await CustomerModel.findOne({
    stitchedBill: id,
  });

  if (customerThatBillBelongsTo) {
    customerThatBillBelongsTo.stitchedBill = customerThatBillBelongsTo.stitchedBill.filter((bill) => bill.toString() !== id);
    await customerThatBillBelongsTo.save();
  }

  const deletedBill = await StitchBillModel.findByIdAndDelete(id);
  if (!deletedBill) throw new ApiError(404, "Error deleting the stitch bill");
  return res.status(200).json(new ApiResponse(200, {}, "Stitch Bill deleted successfully"));
});

export const getStitchCustomersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // pageNumber
  const limit = parseInt(req.query.limit) || 10; // limit

  const totalResultsPipeline = [...pipeline, {$count: "results"}];
  const [totalResultsCount] = await StitchBillModel.aggregate(totalResultsPipeline);

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
  return res.status(200).json(new ApiResponse(200, result, "Customers Retrived Successfully"));
});

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

export const getSoldCustomersList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // pageNumber
  const limit = parseInt(req.query.limit) || 10; // limit

  const totalResultsPipeline = [...pipeline, {$count: "results"}];
  const [totalResultsCount] = await SoldBillModel.aggregate(totalResultsPipeline);

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
  return res.status(200).json(new ApiResponse(200, result, "Customers Retrived Successfully"));
});
