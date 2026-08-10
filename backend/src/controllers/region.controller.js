import {
  getDistricts,
  getProvinces,
  getRegencies,
  getVillages,
} from "idn-area-data";

const areaData = {
  provinces: null,
  regencies: null,
  districts: null,
  villages: null,
};

const loadArea = (area, loader) => {
  if (!areaData[area]) {
    areaData[area] = loader().catch((error) => {
      areaData[area] = null;
      throw error;
    });
  }
  return areaData[area];
};

const toRegionResponse = (items) => items.map((item) => ({
  id: item.code,
  name: item.name,
}));

const sendInvalidCode = (res, label) => res.status(400).json({
  success: false,
  message: `Kode ${label} tidak valid`,
});

const sendRegionError = (res, error) => {
  console.error("Gagal memuat data wilayah Indonesia:", error.message);
  return res.status(500).json({
    success: false,
    message: "Data wilayah Indonesia belum dapat dimuat",
  });
};

export const getProvinceOptions = async (_req, res) => {
  try {
    const provinces = await loadArea("provinces", getProvinces);
    return res.json({ success: true, data: toRegionResponse(provinces) });
  } catch (error) {
    return sendRegionError(res, error);
  }
};

export const getRegencyOptions = async (req, res) => {
  const provinceCode = String(req.params.provinceCode || "");
  if (!/^\d{2}$/.test(provinceCode)) return sendInvalidCode(res, "provinsi");

  try {
    const regencies = await loadArea("regencies", getRegencies);
    return res.json({
      success: true,
      data: toRegionResponse(
        regencies.filter((item) => item.province_code === provinceCode),
      ),
    });
  } catch (error) {
    return sendRegionError(res, error);
  }
};

export const getDistrictOptions = async (req, res) => {
  const regencyCode = String(req.params.regencyCode || "");
  if (!/^\d{2}\.\d{2}$/.test(regencyCode)) return sendInvalidCode(res, "kabupaten/kota");

  try {
    const districts = await loadArea("districts", getDistricts);
    return res.json({
      success: true,
      data: toRegionResponse(
        districts.filter((item) => item.regency_code === regencyCode),
      ),
    });
  } catch (error) {
    return sendRegionError(res, error);
  }
};

export const getVillageOptions = async (req, res) => {
  const districtCode = String(req.params.districtCode || "");
  if (!/^\d{2}\.\d{2}\.\d{2}$/.test(districtCode)) {
    return sendInvalidCode(res, "kecamatan");
  }

  try {
    const villages = await loadArea("villages", getVillages);
    return res.json({
      success: true,
      data: toRegionResponse(
        villages.filter((item) => item.district_code === districtCode),
      ),
    });
  } catch (error) {
    return sendRegionError(res, error);
  }
};
