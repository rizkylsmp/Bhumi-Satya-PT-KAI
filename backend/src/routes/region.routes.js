import { Router } from "express";
import {
  getDistrictOptions,
  getProvinceOptions,
  getRegencyOptions,
  getVillageOptions,
} from "../controllers/region.controller.js";

const router = Router();

router.get("/provinces", getProvinceOptions);
router.get("/regencies/:provinceCode", getRegencyOptions);
router.get("/districts/:regencyCode", getDistrictOptions);
router.get("/villages/:districtCode", getVillageOptions);

export default router;
