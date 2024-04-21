import mongoose from "mongoose";
const wholeSalerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  wholeSaleBill: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "wholeSaleBill",
  }],
}, { timestamps: true });
const WholeSalerModel = mongoose.model("wholeSaler", wholeSalerSchema);
export default WholeSalerModel;