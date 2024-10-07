import mongoose from "mongoose";

const soldSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
    customer_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "customer",
    },
    billNumber: {
      type: Number,
      required: [true, "Bill number is required"],
    },
    phoneNumber: {
      type: Number,
      required: [true, "Phone number is required"],
    },
    totalAmt: {
      type: Number,
      required: [true, "Total amount is required"],
    },
  },
  { timestamps: true }
);

const SoldBillModel = mongoose.model("soldBill", soldSchema);
export default SoldBillModel;
