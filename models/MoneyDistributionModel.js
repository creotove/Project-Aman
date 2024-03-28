import mongoose from "mongoose";
const moneyDistributionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
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
