import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  role: {
    type: String,
    enum: ["CM", "TAILOR", "HELPER"],
    required: [true, "Role is required"],
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

const EmployeeModel = mongoose.model("employee", employeeSchema);
export default EmployeeModel;
