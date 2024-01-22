import mongoose from "mongoose";
const stitchBillSchema = new mongoose.Schema(
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
    deliveryDate: {
      type: Date,
      required: [true, "Delivery date is required"],
    },
    clothAmt: {
      type: Number,
      default: 0,
    },
    clothes: [
      {
        clothName: {
          type: String,
          required: [true, "Cloth name is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Cloth quantity is required"],
        },
        stitchingAmt: {
          type: Number,
          required: [true, "Stitching amt is required"],
        },
        totalStitchingAmt: {
          type: Number,
          required: [true, "Total stitching amt is required"],
        },
      },
    ],
    subTotal: {
      type: Number,
      required: [true, "Sub total amt is required"],
    },
    advanceAmt: {
      type: Number,
      required: [true, "Advance amt is required"],
    },
    finalAmt: {
      type: Number,
      required: [true, "Final amt is required"],
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    totalAmt: {
      type: Number,
      required: [true, "Phone number is required"],
    },
  },
  { timestamps: true }
);

const StitchBillModel = mongoose.model("stitchBill", stitchBillSchema);
export default StitchBillModel;
