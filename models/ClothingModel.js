import mongoose from "mongoose";

const clothingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  stitchingAmt: {
    // For customer
    type: Number,
    required: [true, "Default Stitching is required"],
  },
  defaultStitchingAmt: {
    // For Tailor
    type: Number,
    default: 0,
  },
  defaultCuttingAmt: {
    // For Cloth Cutter
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: "N/A",
  },
});

// clothingSchema.statics.isValidMeasurement = function (measurement) {
//   // Validate that the provided measurement matches the expected structure for the clothing item
//   // For simplicity, this example assumes the measurement object should have at least one property
//   return typeof measurement === 'object' && Object.keys(measurement).length > 0;
// };

clothingSchema.statics.isValidMeasurement = function (measurement) {
  // Validate that the provided measurement matches the expected structure for the clothing item
  // Adjust this logic based on your measurement requirements
  const expectedKeys = ["waist", "inseam"]; // Add more keys as needed

  if (typeof measurement === "object") {
    const keys = Object.keys(measurement);
    return expectedKeys.every((key) => keys.includes(key));
  }

  return false;
};

const ClothingModel = mongoose.model("clothing", clothingSchema);
export default ClothingModel;
