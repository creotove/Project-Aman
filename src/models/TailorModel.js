import mongoose from "mongoose";

const tailorSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "employee",
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
      type: mongoose.SchemaTypes.ObjectId,
      ref: "work",
    },
  ],
});

const TailorModel = mongoose.model("tailor", tailorSchema);
export default TailorModel;
