import mongoose from "mongoose";

const helperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  userDocument: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  phoneNumber: {
    type: Number,
    required: [true, "Phone number is required"],
  },
  monthly: {
    type: Number,
    required: [true, "Monthly income is required"],
  },
  advance: {
    type: Number,
    default: 0,
  },
});

const HelperModel = mongoose.model("helper", helperSchema);
export default HelperModel;
