import BillNumberCounter from "../models/BillNumberCounter.js";
export async function addBillNumber(req, res, next) {
  try {
    const billNumber = await BillNumberCounter.findOne();
    if (!billNumber) {
      const newBillNumber = new BillNumberCounter({
        billNumber: 1,
      });
      await newBillNumber.save();
      req.body.billNumber = 1;
      next();
    } else {
      billNumber.billNumber += 1;
      await billNumber.save();
      req.body.billNumber = billNumber.billNumber;
      next();
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
