import mongoose from "mongoose";

const tailorSchema = new mongoose.Schema({
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
  aadharnumber: {
    type: Number,
    required: [true, "Aadhar number is required"],
  },
  stitchingAmounts: {
    type: Map,
    of: Number,
    default: {},
  },
  work: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "work",
    },
  ],
});

const TailorModel = mongoose.model("tailor", tailorSchema);
export default TailorModel;
