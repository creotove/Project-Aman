import mongoose from "mongoose";
const wholeSaleBillSchema = new mongoose.Schema({
  billNo: {
    type: String,
    required: [true, "Bill No is required"],
  },
  totalAmount: {
    type: Number,
    required: [true, "Total Amount is required"],
  },
  wholeSalerName: {
    type: String,
    required: [true, "Whole Saler Name is required"],
  },
  wholeSaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "wholeSaler",
  },
  paymentStatus: {
    type: Boolean,
    default: false,
  },
  paymentDate: {
    type: Date,
  },
  payabeledAmount: {
    type: Number,
    required: [true, "Payable Amount is required"],
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  billRecieptImage: {
    type: String,
    required: [true, "Bill Reciept image is required"],
  },
});
const WholeSaleBillModel = mongoose.model("wholeSaleBill", wholeSaleBillSchema);
export default WholeSaleBillModel;
