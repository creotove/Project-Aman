import AnalyticsModel from "../models/AnalyticsModel.js";
import { analyticsHelper, customerType, billType } from "../constants/index.js";
import { ApiError } from "./ApiError.js";

export const analyticsAdd = async (
  paramsAmt,
  paramsBillType,
  paramsCustomerType,
  paramsAction,
  paramsIsNegative,
  paramsMonth,
  paramsDay
) => {
  try {
    const amountToUpdate = parseInt(paramsAmt);
    const analytics = await AnalyticsModel.findOne({
      year: new Date().getFullYear(),
    });

    // Check if the action is valid Actions can be add update or delete for the analytics
    switch (paramsAction) {
      // Adding the analytics
      case analyticsHelper.ADD:
        // If the analytics of the current year is not present then create a new one
        if (!analytics) {
          const newAnalytics = new AnalyticsModel({
            year: new Date().getFullYear(),
            income: amountToUpdate,
            salary: 0,
            profit: amountToUpdate,
            customers: paramsCustomerType === customerType.NEW ? 1 : 0,
            newCustomers: paramsCustomerType === customerType.NEW ? 1 : 0,
            sales: paramsBillType === billType.STITCHED ? 0 : amountToUpdate,
            salesBillCount: paramsBillType === billType.STITCHED ? 0 : 1,
            stitch: paramsBillType === billType.STITCHED ? amountToUpdate : 0,
            stitchBillCount: paramsBillType === billType.STITCHED ? 1 : 0,
            monthlyData: [
              {
                month: paramsMonth.slice(0, 3),
                income: amountToUpdate,
                salary: 0,
                profit: amountToUpdate,
                customers: paramsCustomerType === customerType.NEW ? 1 : 0,
                newCustomers: paramsCustomerType === customerType.NEW ? 1 : 0,
                sales:
                  paramsBillType === billType.STITCHED ? 0 : amountToUpdate,
                salesBillCount: paramsBillType === billType.STITCHED ? 0 : 1,
                stitch:
                  paramsBillType === billType.STITCHED ? amountToUpdate : 0,
                stitchBillCount: paramsBillType === billType.STITCHED ? 1 : 0,
              },
            ],
            dailyData: [
              {
                date: paramsDay,
                income: amountToUpdate,
                salary: 0,
                profit: amountToUpdate,
                customers: paramsCustomerType === customerType.NEW ? 1 : 0,
                newCustomers: paramsCustomerType === customerType.NEW ? 1 : 0,
                sales:
                  paramsBillType === billType.STITCHED ? 0 : amountToUpdate,
                salesBillCount: paramsBillType === billType.STITCHED ? 0 : 1,
                stitch:
                  paramsBillType === billType.STITCHED ? amountToUpdate : 0,
                stitchBillCount: paramsBillType === billType.STITCHED ? 1 : 0,
              },
            ],
          });
          await newAnalytics.save();
        } else {
          analytics.income += amountToUpdate;
          analytics.profit += amountToUpdate;
          analytics.customers +=
            paramsCustomerType === customerType.NEW ? 1 : 0;
          analytics.newCustomers +=
            paramsCustomerType === customerType.NEW ? 1 : 0;
          analytics.sales +=
            paramsBillType === billType.stitch ? 0 : amountToUpdate;
          analytics.salesBillCount +=
            paramsBillType === billType.stitch ? 0 : 1;
          analytics.stitch +=
            paramsBillType === billType.stitch ? amountToUpdate : 0;
          analytics.stitchBillCount +=
            paramsBillType === billType.stitch ? 1 : 0;
          const month = paramsMonth.slice(0, 3);
          const day = paramsDay;
          const date = `${month}-${day}`;
          const monthIndex = analytics.monthlyData.findIndex(
            (item) => item.month === month
          );
          const dayIndex = analytics.dailyData.findIndex(
            (item) => item.date === date
          );
          if (monthIndex !== -1) {
            analytics.monthlyData[monthIndex].income += amountToUpdate;
            analytics.monthlyData[monthIndex].profit += amountToUpdate;
            analytics.monthlyData[monthIndex].customers +=
              paramsCustomerType === customerType.NEW ? 1 : 0;
            analytics.monthlyData[monthIndex].newCustomers +=
              paramsCustomerType === customerType.NEW ? 1 : 0;
          } else {
            analytics.monthlyData.push({
              month: month,
              income: amountToUpdate,
              profit: amountToUpdate,
              customers: paramsCustomerType === customerType.NEW ? 1 : 0,
              newCustomers: paramsCustomerType === customerType.NEW ? 1 : 0,
              sales: 0,
              salesBillCount: 0,
              stitch: 0,
              stitchBillCount: 0,
            });
          }
          if (dayIndex !== -1) {
            analytics.dailyData[dayIndex].income += amountToUpdate;
            analytics.dailyData[dayIndex].profit += amountToUpdate;
            analytics.dailyData[dayIndex].customers +=
              paramsCustomerType === customerType.NEW ? 1 : 0;
            analytics.dailyData[dayIndex].newCustomers +=
              paramsCustomerType === customerType.NEW ? 1 : 0;
          }
          await analytics.save();
        }
        break;
      // Updating the analytics
      case analyticsHelper.UPDATE:
        if (analytics) {
          analytics.income += paramsIsNegative
            ? -amountToUpdate
            : amountToUpdate;
          analytics.profit += paramsIsNegative
            ? -amountToUpdate
            : amountToUpdate;
          if (paramsBillType === billType.STITCHED) {
            analytics.stitch += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
          } else if (paramsBillType === billType.SOLD) {
            analytics.sales += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
          }
          analytics.customers +=
            paramsCustomerType === customerType.NEW
              ? paramsIsNegative
                ? -1
                : 1
              : 0;
          analytics.newCustomers +=
            paramsCustomerType === customerType.NEW
              ? paramsIsNegative
                ? -1
                : 1
              : 0;

          const month = paramsMonth.slice(0, 3);
          const date = paramsDay;
          const monthIndex = analytics.monthlyData.findIndex(
            (item) => item.month === month
          );
          const dayIndex = analytics.dailyData.findIndex(
            (item) => item.date === date
          );

          if (monthIndex !== -1) {
            analytics.monthlyData[monthIndex].income += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
            analytics.monthlyData[monthIndex].profit += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
            analytics.monthlyData[monthIndex].customers +=
              paramsCustomerType === customerType.NEW
                ? paramsIsNegative
                  ? -1
                  : 1
                : 0;
            analytics.monthlyData[monthIndex].newCustomers +=
              paramsCustomerType === customerType.NEW
                ? paramsIsNegative
                  ? -1
                  : 1
                : 0;

            if (paramsBillType === billType.STITCHED) {
              analytics.monthlyData[monthIndex].stitch += paramsIsNegative
                ? -amountToUpdate
                : amountToUpdate;
            } else if (paramsBillType === billType.SOLD) {
              analytics.monthlyData[monthIndex].sales += paramsIsNegative
                ? -amountToUpdate
                : amountToUpdate;
            }
          } else {
            analytics.monthlyData.push({
              month: month,
              income: paramsIsNegative ? -amountToUpdate : amountToUpdate,
              profit: paramsIsNegative ? -amountToUpdate : amountToUpdate,
              customers:
                paramsCustomerType === customerType.NEW
                  ? paramsIsNegative
                    ? -1
                    : 1
                  : 0,
              newCustomers:
                paramsCustomerType === customerType.NEW
                  ? paramsIsNegative
                    ? -1
                    : 1
                  : 0,
              sales: paramsBillType === billType.STITCHED ? 0 : amountToUpdate,
              salesBillCount: paramsBillType === billType.STITCHED ? 0 : 1,
              stitch: paramsBillType === billType.STITCHED ? amountToUpdate : 0,
              stitchBillCount: paramsBillType === billType.STITCHED ? 1 : 0,
            });
          }

          if (dayIndex !== -1) {
            analytics.dailyData[dayIndex].income += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
            analytics.dailyData[dayIndex].profit += paramsIsNegative
              ? -amountToUpdate
              : amountToUpdate;
            analytics.dailyData[dayIndex].customers +=
              paramsCustomerType === customerType.NEW
                ? paramsIsNegative
                  ? -1
                  : 1
                : 0;
            analytics.dailyData[dayIndex].newCustomers +=
              paramsCustomerType === customerType.NEW
                ? paramsIsNegative
                  ? -1
                  : 1
                : 0;
            if (paramsBillType === billType.STITCHED) {
              analytics.dailyData[dayIndex].stitch += paramsIsNegative
                ? -amountToUpdate
                : amountToUpdate;
              analytics.dailyData[dayIndex].stitchBillCount += paramsIsNegative
                ? -1
                : 1;
            } else if (paramsBillType === billType.SOLD) {
              analytics.dailyData[dayIndex].sales += paramsIsNegative
                ? -amountToUpdate
                : amountToUpdate;
              analytics.dailyData[dayIndex].salesBillCount += paramsIsNegative
                ? -1
                : 1;
            }
          } else {
            // If day does not exist, push a new entry
            analytics.dailyData.push({
              date: date,
              income: paramsIsNegative ? -amountToUpdate : amountToUpdate,
              profit: paramsIsNegative ? -amountToUpdate : amountToUpdate,
              customers:
                paramsCustomerType === customerType.NEW
                  ? paramsIsNegative
                    ? -1
                    : 1
                  : 0,
              newCustomers:
                paramsCustomerType === customerType.NEW
                  ? paramsIsNegative
                    ? -1
                    : 1
                  : 0,
              sales: paramsBillType === billType.stitch ? 0 : amountToUpdate,
              salesBillCount: paramsBillType === billType.stitch ? 0 : 1,
              stitch: paramsBillType === billType.stitch ? amountToUpdate : 0,
              stitchBillCount: paramsBillType === billType.stitch ? 1 : 0,
            });
          }

          await analytics.save();
        } else {
          console.log("No analytics found for the current year.");
        }
        break;
      // Deleting the analytics
      case analyticsHelper.DELETE:
        if (analytics) {
          analytics.income -= amountToUpdate;
          analytics.profit -= amountToUpdate;
          if (paramsBillType === billType.STITCHED) {
            analytics.stitch -= amountToUpdate;
            analytics.stitchBillCount -= 1;
          } else if (paramsBillType === billType.SOLD) {
            analytics.sales -= amountToUpdate;
            analytics.salesBillCount -= 1;
          }
          analytics.customers -= 1;

          const month = paramsMonth.slice(0, 3);
          const date = paramsDay;
          const monthIndex = analytics.monthlyData.findIndex(
            (item) => item.month === month
          );
          const dayIndex = analytics.dailyData.findIndex(
            (item) => item.date === date
          );

          if (monthIndex !== -1) {
            analytics.monthlyData[monthIndex].income -= amountToUpdate;
            analytics.monthlyData[monthIndex].profit -= amountToUpdate;
            analytics.monthlyData[monthIndex].customers -= 1;

            if (paramsBillType === billType.STITCHED) {
              analytics.monthlyData[monthIndex].stitch -= amountToUpdate;
              analytics.monthlyData[monthIndex].salesBillCount -= 1;
              analytics.monthlyData[monthIndex].stitchBillCount -= 1;
            } else if (paramsBillType === billType.SOLD) {
              analytics.monthlyData[monthIndex].sales -= amountToUpdate;
            }
          }

          if (dayIndex !== -1) {
            analytics.dailyData[dayIndex].income -= amountToUpdate;
            analytics.dailyData[dayIndex].profit -= amountToUpdate;
            analytics.dailyData[dayIndex].customers -= 1;

            if (paramsBillType === billType.STITCHED) {
              analytics.dailyData[dayIndex].stitch -= amountToUpdate;
              analytics.dailyData[dayIndex].stitchBillCount -= 1;
            }
            if (paramsBillType === billType.SOLD) {
              analytics.dailyData[dayIndex].sales -= amountToUpdate;
              analytics.dailyData[dayIndex].salesBillCount -= 1;
            }
          }
          await analytics.save();
        }
        break;
      // Default case
      default:
        console.log("Invalid action");
        break;
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

export const dateHelperForAnalytics = (date) => {
  if (!date) date = new Date();
  const currentDate = new Date(date);
  const month = currentDate.toLocaleString("default", { month: "long" });
  const day = currentDate.toLocaleString("default", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  return { month, day };
};
