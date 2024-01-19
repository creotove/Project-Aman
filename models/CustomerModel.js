import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "user",
    },
    purchasedBill: {
      type: [
        {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "soldBill",
        },
      ],
    },
    stitchedBill: {
      type: [
        {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "stitchBill",
        },
      ],
    },
    measurements: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "measurement",
    },
  },
  { timestamps: true }
);

const CustomerModel = mongoose.model("customer", customerSchema);
export default CustomerModel;
