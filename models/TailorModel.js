import mongoose from "mongoose";

const tailorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  phoneNumber: {
    type: Number,
    required: [true, "Phone number is required"],
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  advance: {
    type: Number,
    default: 0,
  },
  earned: {
    type: Number,
    default: 0,
  },
  stitchingAmounts: {
    type: Map,
    of: Number,
    default: {},
  },
  work: [
    {
      cloth: {
        type: String,
        required: [true, "Cloth stitched work name is required"],
      },
      quantity: {
        type: Number,
        required: [true, "Cloth stitched quantity is required"],
      },
      perPiece: {
        type: Number,
        required: [true, "Per piece amt is required"],
      },
      totalAmount: {
        type: Number,
        required: [true, "Cloth stitched total amount is required"],
      },
    },
  ],
});

const TailorModel = mongoose.model("tailor", tailorSchema);
export default TailorModel;
