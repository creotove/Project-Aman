import mongoose from "mongoose";

const helperSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "employee",
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  monthly: {
    type: Number,
    required: [true, "Monthly income is required"],
  },
});

const HelperModel = mongoose.model("helper", helperSchema);
export default HelperModel;
