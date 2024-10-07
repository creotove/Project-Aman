import mongoose from "mongoose";

const helperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  monthly: {
    type: Number,
    required: [true, "Monthly income is required"],
  },
  aadharnumber: {
    type: Number,
    required: [true, "Aadhar number is required"],
  },
  advance: {
    type: Number,
    default: 0,
  },
});

const HelperModel = mongoose.model("helper", helperSchema);
export default HelperModel;
