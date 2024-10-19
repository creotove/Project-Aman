import mongoose from "mongoose";
const moneyDistributionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId, // user id of the employee
      ref: "user",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId, // employee id
      ref: "employee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    isAdvance: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
    },
  },
  { timestamps: true }
);
const MoneyDistributionModel = mongoose.model(
  "moneyDistribution",
  moneyDistributionSchema
);
export default MoneyDistributionModel;
