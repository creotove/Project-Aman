import {Router} from "express";
import * as storeController from "../controllers/store.controller.js";
import {upload} from "../middlewares/multer.js";

const router = Router();
router.post("/store/clothingItems", storeController.addClothingItem); // -> /api/v1/admin/clothingItem
router.patch("/store/clothingItems/:id", storeController.updateClothingItem); // -> /api/v1/admin/clothingItem/:id
router.get("/store/clothingItems", storeController.getClothingItems); // -> /api/v1/admin/clothingItems
router.delete("/store/clothingItems/:id", storeController.deleteClothingItem); // -> /api/v1/admin/clothingItems
router.post(
  "/store/fabricItems",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  storeController.addFabricItem
); // -> /api/v1/admin/fabricItem
router.get("/store/fabrics", storeController.getFabricItems); // -> /api/v1/admin/fabricItems
router.get("/store/fabrics/:id", storeController.getFabricItem); // -> /api/v1/admin/fabricItem/:id
export default router;
