import api from "./api";

const regionCache = new Map();

const normalizeRegions = (items) => (Array.isArray(items) ? items : [])
  .map((item) => ({
    id: String(item?.id || "").trim(),
    name: String(item?.name || "").trim(),
  }))
  .filter((item) => item.id && item.name);

const fetchRegions = async (path) => {
  if (!regionCache.has(path)) {
    regionCache.set(path, api.get(`/regions/${path}`).then((response) => {
      return normalizeRegions(response.data?.data);
    }).catch((error) => {
      regionCache.delete(path);
      throw error;
    }));
  }

  return regionCache.get(path);
};

export const getIndonesiaProvinces = () => fetchRegions("provinces");

export const getIndonesiaRegencies = (provinceId) =>
  fetchRegions(`regencies/${encodeURIComponent(provinceId)}`);

export const getIndonesiaDistricts = (regencyId) =>
  fetchRegions(`districts/${encodeURIComponent(regencyId)}`);

export const getIndonesiaVillages = (districtId) =>
  fetchRegions(`villages/${encodeURIComponent(districtId)}`);

export const normalizeIndonesiaRegionName = (value) => String(value || "")
  .trim()
  .toLocaleUpperCase("id-ID")
  .replace(/\s+/g, " ");

export const findIndonesiaRegionByName = (regions, name) => {
  const normalizedName = normalizeIndonesiaRegionName(name);
  if (!normalizedName) return null;
  return regions.find(
    (region) => normalizeIndonesiaRegionName(region.name) === normalizedName,
  ) || null;
};

export const clearIndonesiaRegionCache = () => regionCache.clear();
