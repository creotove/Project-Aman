import mongoose from "mongoose";

const cuttingMasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  phoneNumber: {
    type: Number,
    required: [true, "Phone number is required"],
  },
  advance: {
    type: Number,
    default: 0,
  },
  earned: {
    type: Number,
    default: 0,
  },
  cuttingAmounts: {
    type: Map,
    of: Number,
    default: {},
  },
  work: [
    {
      cloth: {
        type: String,
        required: [true, "Cloth cutted work name is required"],
      },
      quantity: {
        type: Number,
        required: [true, "Cloth cutted quantity is required"],
      },
      perPiece: {
        type: Number,
        required: [true, "Per piece amt is required"],
      },
      totalAmount: {
        type: Number,
        required: [true, "Cloth cutted total amount is required"],
      },
    },
  ],
});

const CuttingMasterModel = mongoose.model("cuttingMaster", cuttingMasterSchema);
export default CuttingMasterModel;
