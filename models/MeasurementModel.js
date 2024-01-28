import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    name: {
      // Cloth Measurement Name
      type: String,
      required: [true, "Name is required"],
    },
    customer_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "customer",
    },
    measurements: {
      type: Map,
      of: {
        type: Number,
      },
      default: {},
    },
    customerRequirements: {
      type: [
        {
          name: String,
          value: String,
        },
      ],
      default: [{ name: "No Req.", value: "", description: "" }],
    },
  },
  { timestamps: true }
);

const MeasurementModel = mongoose.model("measurement", measurementSchema);
export default MeasurementModel;
// const measurement = [
//   {
//     name: "Shirt",
//     customer_id: "5f8d0f3a2f6c4d3e8c5f9d8b",
//     measurements: {
//       shoulder: 10,
//       chest: 10,
//       waist: 10,
//       hips: 10,
//       sleeve: 10,
//       length: 10,
//     },
//   },
//   {
//     name: "Pant",
//     customer_id: "5f8d0f3a2f6c4d3e8c5f9d8b",
//     measurements: {
//       waist: 10,
//       hips: 10,
//       length: 10,
//     },
//     customerRequirements: [
//       {
//         name: "Pant",
//         value: "Pant",
//         description: "Pant",
//       },
//     ],
//     drawing: "https://i.imgur.com/4Xg0Y5v.jpg",
//   },
//   {
//     name: "Blazer",
//     customer_id: "5f8d0f3a2f6c4d3e8c5f9d8b",
//     measurements: {
//       shoulder: 10,
//       chest: 10,
//       waist: 10,
//       hips: 10,
//       sleeve: 10,
//       length: 10,
//     },
//     customerRequirements: [
//       {
//         name: "Blazer",
//         value: "Blazer",
//         description: "Blazer",
//       },
//     ],
//     drawing: "https://i.imgur.com/4Xg0Y5v.jpg",
//   },
//   {
//     name: "Suit",
//     customer_id: "5f8d0f3a2f6c4d3e8c5f9d8b",
//     measurements: {
//       shoulder: 10,
//       chest: 10,
//       waist: 10,
//       hips: 10,
//       sleeve: 10,
//       length: 10,
//     },
//     customerRequirements: [
//       {
//         name: "Suit",
//         value: "Suit",
//         description: "Suit",
//       },
//     ],
//     drawing: "https://i.imgur.com/4Xg0Y5v.jpg",
//   },
// ];
