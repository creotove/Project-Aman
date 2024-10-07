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
  aadharnumber: {
    type: Number,
    required: [true, "Aadhar number is required"],
  },
  work: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "work",
    },
  ],
});

const CuttingMasterModel = mongoose.model("cuttingMaster", cuttingMasterSchema);
export default CuttingMasterModel;
