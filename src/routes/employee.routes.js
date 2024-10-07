import {Router} from "express";
import * as employeeController from "../controllers/employee.controller.js";
import {upload} from "../middlewares/multer.js";
const router = Router();

router.post("/employees", upload.single("avatar"), employeeController.addEmployee); // -> /api/v1/admin/addEmployee
router.post("/employees/advanceToEmployee/:id", employeeController.addAdvanceForEmployee); // -> /api/v1/admin/advanceToEmployee
router.post("/employees/moneyToEmployee/:id", employeeController.giveMoneyToEmployee); // -> /api/v1/admin/moneyToEmployee/:id
router.post("/employees/takeMoneyThatWasGivenAdvanceToEmployee/:id", employeeController.removeAdvanceFromEmployee); // -> /api/v1/admin/takeMoneyThatWasGivenAdvanceToEmployee/:id
router.patch(
  "/employees/:id",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  employeeController.updateEmployeeProfile
); // -> /api/v1/admin/employees/:id
router.get("/employees", employeeController.getEmployees); // -> /api/v1/admin/employees
router.get("/employees/:id", employeeController.getEmployeeProfile); // -> /api/v1/admin/employees/:id
router.post("/employees/work/:id", employeeController.addWorkForEmployee); // -> /api/v1/admin/work
router.get("/employees/work/:id", employeeController.getWork); // -> /api/v1/admin/employees/:id
export default router;
