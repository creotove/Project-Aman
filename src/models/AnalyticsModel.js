import mongoose from "mongoose";

const analyticsModelSchema = new mongoose.Schema(
  {
    year: Number, // 2021
    income: Number, // income
    salary: Number, // salary given to employees
    profit: Number, // total income - total salary
    customers: Number, // total customers
    newCustomers: Number, // new customers
    sales: Number, // total sales income
    salesBillCount: Number, // total sales BillCount
    stitch: Number, // total stitch income
    stitchBillCount: Number, // total stitch BillCount
    monthlyData: [
      {
        month: String, // Jan
        income: Number, // income
        salary: Number, // salary given to employees
        profit: Number, // total income - total salary
        customers: Number, // total customers
        newCustomers: Number, // new customers
        sales: Number, // total sales income
        salesBillCount: Number, // total sales BillCount
        stitch: Number, // total stitch income
        stitchBillCount: Number, // total stitch BillCount
      },
    ],
    dailyData: [
      {
        date: String, // Jan-16
        income: Number, // income
        salary: Number, // salary given to employees
        profit: Number, // total income - total salary
        customers: Number, // total customers
        newCustomers: Number, // new customers
        sales: Number, // total sales income
        salesBillCount: Number, // total sales BillCount
        stitch: Number, // total stitch income
        stitchBillCount: Number, // total stitch BillCount
      },
    ],
  },
  { timestamps: true }
);

const AnalyticsModel = mongoose.model("analytic", analyticsModelSchema);
export default AnalyticsModel;
