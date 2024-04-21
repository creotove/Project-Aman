import mongoose from "mongoose";
const fabricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  purchasedPerMtrPrice: {
    type: Number,
    required: [true, "Purchased per mtrs. price is required"],
  },
  sellingPerMtrPrice: {
    type: Number,
    required: [true, "Selling per mtrs. price is required"],
  },
  wholeSalerName: {
    type: String,
    required: [true, "WholeSaler name is required"],
  },
  purchasedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "wholeSaler",
  },
  image: {
    type: String,
    default: "https://www.w3schools.com/howto/img_avatar.png",
  },
  description: {
    type: String,
    required: [true, "Fabric description is required"],
  },
  patternName: {
    type: String,
    required: [true, "Pattern name is required"],
  },
  stock: {
    type: Number,
    required: [true, "Stock is required"],
  },
  totalMtrsWhenBought: {
    type: Number,
    required: [true, "Meters remaining is required"],
  },
  totalMtrsRemaining: {
    type: Number,
    required: [true, "Meters remaining is required"],
  },
}, { timestamps: true });

const FabricModel = mongoose.model("fabric", fabricSchema);

export default FabricModel;
