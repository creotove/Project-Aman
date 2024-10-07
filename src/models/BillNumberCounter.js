import mongoose from "mongoose";
const billNumberSchema = new mongoose.Schema({
  billNumber: {
    type: Number,
    required: [true, "Bill number is required"],
  },
});
const BillNumberCounter = mongoose.model("billNumber", billNumberSchema);
export default BillNumberCounter;
