import AnalyticsModel from "../models/AnalyticsModel.js";
import { ApiError } from "./ApiError.js";

export const analyticsAdd = async (totalAmt, billType) => {
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
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

// const totalAmount = parseInt(totalAmt);
//     console.log(totalAmount);
//     const analytics = await AnalyticsModel.findOne({
//       year: new Date().getFullYear(),
//     });
//     if (analytics) {
//       analytics.totalCustomers += 1;
//       analytics.totalSales += totalAmount;
//       if (billType === "STITCH") analytics.yearlyStitchQty += 1;
//       else if(billType === "SOLD")analytics.yearlySoldQty += 1;
//       const month = new Date().toLocaleString("default", { month: "long" });
//       const day = new Date().toLocaleString("default", { day: "numeric" });
//       const date = `${month} ${day}`;
//       const monthIndex = analytics.monthlyData.findIndex(
//         (item) => item.month === month
//       );
//       const dayIndex = analytics.dailyData.findIndex(
//         (item) => item.date === date
//       );
//       if (monthIndex !== -1) {
//         analytics.monthlyData[monthIndex].totalSales += totalAmount;
//         analytics.monthlyData[monthIndex].totalStitch += 1;
//       } else {
//         analytics.monthlyData.push({
//           month: month,
//           totalSales: totalAmount,
//           totalStitch: 1,
//         });
//       }
//       if (dayIndex !== -1) {
//         analytics.dailyData[dayIndex].totalSales += totalAmount;
//         analytics.dailyData[dayIndex].totalUnits += 1;
//       } else {
//         analytics.dailyData.push({
//           date: date,
//           totalSales: totalAmount,
//           totalStitch: 1,
//         });
//       }
//       await analytics.save();
//     }else{
//       const analytics = new AnalyticsModel({
//         year: new Date().getFullYear(),
//         totalCustomers: 1,
//         totalSales: totalAmount,
//         yearlyStitchTotal: billType === "STITCH" ? 1 : 0,
//         yearlySoldTotal: billType === "SOLD" ? 1 : 0,
//         monthlyData: [
//           {
//             month: new Date().toLocaleString("default", { month: "long" }),
//             totalSales: totalAmount,
//             totalUnits: 1,
//           },
//         ],
//         dailyData: [
//           {
//             date: `${new Date().toLocaleString("default", {
//               month: "long",
//             })} ${new Date().toLocaleString("default", { day: "numeric" })}`,
//             totalSales: totalAmount,
//             totalUnits: 1,
//           },
//         ],
//       });
//       await analytics.save();
//     }
