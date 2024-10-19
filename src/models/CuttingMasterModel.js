import mongoose from "mongoose";

const cuttingMasterSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "user",
  },
  employee_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "employee",
  },
  earned: {
    type: Number,
    default: 0,
  },
  cuttingAmounts: {
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

const CuttingMasterModel = mongoose.model("cuttingMaster", cuttingMasterSchema);
export default CuttingMasterModel;
