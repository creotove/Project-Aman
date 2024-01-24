import AnalyticsModel from "../models/AnalyticsModel.js";
import { ApiError } from "./ApiError.js";

export const analyticsAdd = async (totalAmt, billType, customerType) => {
  try {
    const amountToadd = parseInt(totalAmt);
    const analytics = await AnalyticsModel.findOne({
      year: new Date().getFullYear(),
    });
    if (!analytics) {
      const newAnalytics = new AnalyticsModel({
        year: new Date().getFullYear(),
        income: amountToadd,
        salary: 0,
        profit: amountToadd,
        customers: customerType === "NEW" ? 1 : 0,
        newCustomers: customerType === "NEW" ? 1 : 0,
        sales: billType === "STITCHED" ? 0 : amountToadd,
        salesBillCount: billType === "STITCHED" ? 0 : 1,
        stitch: billType === "STITCHED" ? amountToadd : 0,
        stitchBillCount: billType === "STITCHED" ? 1 : 0,
        monthlyData: [
          {
            month: new Date()
              .toLocaleString("default", { month: "long" })
              .slice(0, 3),
            income: amountToadd,
            salary: 0,
            profit: amountToadd,
            customers: customerType === "NEW" ? 1 : 0,
            newCustomers: customerType === "NEW" ? 1 : 0,
            sales: billType === "STITCHED" ? 0 : amountToadd,
            salesBillCount: billType === "STITCHED" ? 0 : 1,
            stitch: billType === "STITCHED" ? amountToadd : 0,
            stitchBillCount: billType === "STITCHED" ? 1 : 0,
          },
        ],
        dailyData: [
          {
            date: new Date().toLocaleString("default", {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
            income: amountToadd,
            salary: 0,
            profit: amountToadd,
            customers: customerType === "NEW" ? 1 : 0,
            newCustomers: customerType === "NEW" ? 1 : 0,
            sales: billType === "STITCHED" ? 0 : amountToadd,
            salesBillCount: billType === "STITCHED" ? 0 : 1,
            stitch: billType === "STITCHED" ? amountToadd : 0,
            stitchBillCount: billType === "STITCHED" ? 1 : 0,
          },
        ],
      });
      await newAnalytics.save();
    } else {
      analytics.income += amountToadd;
      analytics.profit += amountToadd;
      analytics.customers += customerType === "NEW" ? 1 : 0;
      analytics.newCustomers += customerType === "NEW" ? 1 : 0;
      const month = new Date()
        .toLocaleString("default", { month: "long" })
        .slice(0, 3);
      const day = new Date().toLocaleString("default", { day: "numeric" });
      const date = `${month}-${day}`;
      const monthIndex = analytics.monthlyData.findIndex(
        (item) => item.month === month
      );
      const dayIndex = analytics.dailyData.findIndex(
        (item) => item.date === date
      );
      if (monthIndex !== -1) {
        analytics.monthlyData[monthIndex].income += amountToadd;
        analytics.monthlyData[monthIndex].profit += amountToadd;
        analytics.monthlyData[monthIndex].customers +=
          customerType === "NEW" ? 1 : 0;
        analytics.monthlyData[monthIndex].newCustomers +=
          customerType === "NEW" ? 1 : 0;
      } else {
        analytics.monthlyData.push({
          month: month,
          income: amountToadd,
          profit: amountToadd,
          customers: customerType === "NEW" ? 1 : 0,
          newCustomers: customerType === "NEW" ? 1 : 0,
          sales: 0,
          salesBillCount: 0,
          stitch: 0,
          stitchBillCount: 0,
        });
      }
      if (dayIndex !== -1) {
        analytics.dailyData[dayIndex].income += amountToadd;
        analytics.dailyData[dayIndex].profit += amountToadd;
        analytics.dailyData[dayIndex].customers +=
          customerType === "NEW" ? 1 : 0;
        analytics.dailyData[dayIndex].newCustomers +=
          customerType === "NEW" ? 1 : 0;
      } else {
        analytics.dailyData.push({
          date: date,
          income: amountToadd,
          profit: amountToadd,
          customers: customerType === "NEW" ? 1 : 0,
          newCustomers: customerType === "NEW" ? 1 : 0,
          sales: 0,
          salesBillCount: 0,
          stitch: 0,
          stitchBillCount: 0,
        });
      }
      await analytics.save();
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

/* 
try {
    const totalAmount = parseInt(totalAmt);
    const analytics = await AnalyticsModel.findOne({
      year: new Date().getFullYear(),
    });
    if (!analytics) {
      if (billType === "SOLD") {
        const analytics = new AnalyticsModel({
          year: new Date().getFullYear(),
          totalCustomers: 1,
          totalSales: totalAmount,
          yearlySoldQty: 1,
          yearlyStitchQty: 0,
          monthlyData: [
            {
              month: new Date()
                .toLocaleString("default", { month: "long" })
                .slice(0, 3),
              monthlyCustomersCount: 1,
              monthlySoldQty: 1,
              monthlyStitchQty: 0,
              monthlySalesIncome: totalAmount,
              monthlyStitchIncome: 0,
            },
          ],
          dailyData: [
            {
              date: `${new Date()
                .toLocaleString("default", {
                  month: "long",
                })
                .slice(0, 3)} ${new Date().toLocaleString("default", {
                day: "numeric",
              })}`,
              dailyCustomersCount: 1,
              dailySoldQty: 1,
              dailyStitchQty: 0,
              dailySalesIncome: totalAmount,
              dailyStitchIncome: 0,
            },
          ],
        });
        await analytics.save();
      } else if (billType === "STITCH") {
        const analytics = new AnalyticsModel({
          year: new Date().getFullYear(),
          totalCustomers: 1,
          totalSales: totalAmount,
          yearlySoldQty: 0,
          yearlyStitchQty: 1,
          monthlyData: [
            {
              month: new Date()
                .toLocaleString("default", { month: "long" })
                .slice(0, 3),
              monthlyCustomersCount: 1,
              monthlySoldQty: 0,
              monthlyStitchQty: 1,
              monthlySalesIncome: 0,
              monthlyStitchIncome: totalAmount,
            },
          ],
          dailyData: [
            {
              date: `${new Date()
                .toLocaleString("default", {
                  month: "long",
                })
                .slice(0, 3)} ${new Date().toLocaleString("default", {
                day: "numeric",
              })}`,
              dailyCustomersCount: 1,
              dailySoldQty: 0,
              dailyStitchQty: 1,
              dailySalesIncome: 0,
              dailyStitchIncome: totalAmount,
            },
          ],
        });
        await analytics.save();
      }
      console.log("analytics created");
      return;
    }
    analytics.totalCustomers = analytics.totalCustomers + 1;
    analytics.totalSales = analytics.totalSales + totalAmount;
    if (billType === "STITCH")
      analytics.yearlyStitchQty = analytics.yearlyStitchQty + 1;
    else if (billType === "SOLD")
      analytics.yearlySoldQty = analytics.yearlySoldQty + 1;
    const month = new Date()
      .toLocaleString("default", { month: "long" })
      .slice(0, 3);
    const day = new Date().toLocaleString("default", { day: "numeric" });
    const date = `${month} ${day}`;
  
    const monthIndex = analytics.monthlyData.findIndex(
      (item) => item.month === month
    );
    const dayIndex = analytics.dailyData.findIndex(
      (item) => item.date === date
    );
    if (monthIndex !== -1) {
      analytics.monthlyData[monthIndex].monthlyCustomersCount += 1;
      analytics.monthlyData[monthIndex].monthlySalesIncome += totalAmount;
      if (billType === "STITCH") {
        analytics.monthlyData[monthIndex].monthlyStitchQty += 1;
        analytics.monthlyData[monthIndex].monthlyStitchIncome += totalAmount;
      } else if (billType === "SOLD") {
        analytics.monthlyData[monthIndex].monthlySoldQty += 1;
      }
    } else {
      if (billType === "STITCH") {
        analytics.monthlyData.push({
          month: month,
          monthlyCustomersCount: 1,
          monthlySoldQty: 0,
          monthlyStitchQty: 1,
          monthlySalesIncome: 0,
          monthlyStitchIncome: totalAmount,
        });
      } else if (billType === "SOLD") {
        analytics.monthlyData.push({
          month: month,
          monthlyCustomersCount: 1,
          monthlySoldQty: 1,
          monthlyStitchQty: 0,
          monthlySalesIncome: totalAmount,
          monthlyStitchIncome: 0,
        });
      }
    }
    if (dayIndex !== -1) {
      analytics.dailyData[dayIndex].dailyCustomersCount += 1;
      analytics.dailyData[dayIndex].dailySalesIncome += totalAmount;
      if (billType === "STITCH") {
        analytics.dailyData[dayIndex].dailyStitchQty += 1;
        analytics.dailyData[dayIndex].dailyStitchIncome += totalAmount;
      } else if (billType === "SOLD") {
        analytics.dailyData[dayIndex].dailySoldQty += 1;
      }
    }else{
      if (billType === "STITCH") {
        analytics.dailyData.push({
          date: date,
          dailyCustomersCount: 1,
          dailySoldQty: 0,
          dailyStitchQty: 1,
          dailySalesIncome: 0,
          dailyStitchIncome: totalAmount,
        });
      } else if (billType === "SOLD") {
        analytics.dailyData.push({
          date: date,
          dailyCustomersCount: 1,
          dailySoldQty: 1,
          dailyStitchQty: 0,
          dailySalesIncome: totalAmount,
          dailyStitchIncome: 0,
        });
      }
    }
    await analytics.save();
  } 
*/
