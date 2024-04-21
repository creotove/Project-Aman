import mongoose from "mongoose";
const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  amount: {
    type: Number,
    required: [true, "Amount is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
});

const ExpenseModel = mongoose.model("expense", expenseSchema);
export default ExpenseModel;