import mongoose from "mongoose";

const clothingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  stitchingAmtCustomer: {
    // For customer
    type: Number,
    required: [true, "Default Stitching is required"],
  },
  stitchingAmtTailor: {
    // For Tailor
    type: Number,
    default: 0,
  },
  cuttingAmt: {
    // For Cloth Cutter
    type: Number,
    default: 0,
  },
  measurements: {
    type: Array,
    required: [true, "Measurements are required"],
  },
});

const ClothingModel = mongoose.model("clothing", clothingSchema);
export default ClothingModel;
