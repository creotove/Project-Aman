import mongoose from "mongoose";


const measurementHistorySchema = new mongoose.Schema({
  measurement_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "measurement",
  },
  customer_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "customer",
  },
});

const MeasurementHistoryModel = mongoose.model(
  "measurementHistory",
  measurementHistorySchema
);
export default MeasurementHistoryModel;
