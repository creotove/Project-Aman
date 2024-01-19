import mongoose from "mongoose";

const analyticsModelSchema = new mongoose.Schema(
  {
    totalCustomersCount: {
      type: Number,
      default: 0,
    },
    yearlySoldQty: {
      type: Number,
      default: 0,
    },
    yearlyStitchQty: {
      type: Number,
      default: 0,
    },
    totalSalesIncome: {
      type: Number,
      default: 0,
    },
    totalStitchIncome: {
      type: Number,
      default: 0,
    },
    year: Number,
    monthlyData: [
      {
        month: String,
        monthlyCustomersCount: {
          type: Number,
          default: 0,
        },
        monthlySoldQty: {
          type: Number,
          default: 0,
        },
        monthlyStitchQty: {
          type: Number,
          default: 0,
        },
        monthlySalesIncome: {
          type: Number,
          default: 0,
        },
        monthlyStitchIncome: {
          type: Number,
          default: 0,
        },
      },
    ],
    dailyData: [
      {
        date: String,
        dailyCustomersCount: {
          type: Number,
          default: 0,
        },
        dailySoldQty: {
          type: Number,
          default: 0,
        },
        dailyStitchQty: {
          type: Number,
          default: 0,
        },
        dailySalesIncome: {
          type: Number,
          default: 0,
        },
        dailyStitchIncome: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

const AnalyticsModel = mongoose.model("analytic", analyticsModelSchema);
export default AnalyticsModel;
