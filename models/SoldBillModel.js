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
    customer_id :{
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
    clothAmt: {
      type: Number,
      required: [true, "Cloth amt is required"],
    },
    // clothes: [
    //   {
    //     clothName: {
    //       type: String,
    //       required: [true, "Cloth name is required"],
    //     },
    //     meter: {
    //       type: Number,
    //       required: [true, "Meter is required"],
    //     },
    //     perMtr: {
    //       type: Number,
    //       required: [true, "Per mtr amt is required"],
    //     },
    //     totalClothAmt: {
    //       type: Number,
    //       required: [true, "Total cloth amt is required"],
    //     },
    //   },
    // ],
    totalAmt: {
      type: Number,
      required: [true, "Phone number is required"],
    },
  },
  { timestamps: true }
);

const SoldBillModel = mongoose.model("soldBill", soldSchema);
export default SoldBillModel;
