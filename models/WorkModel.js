import mongoose from "mongoose";
const workItemSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  perPiece: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

const workSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: [true, "Employee is required"],
    },
    work: {
      type: Map,
      of: workItemSchema,
      required: [true, "Work is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total Amount (final) is required"],
    },
  },
  { timestamps: true }
);

const WorkModel = mongoose.model("work", workSchema);
export default WorkModel;
