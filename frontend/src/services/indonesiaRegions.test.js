import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import {
  clearIndonesiaRegionCache,
  findIndonesiaRegionByName,
  getIndonesiaProvinces,
  normalizeIndonesiaRegionName,
} from "./indonesiaRegions";

vi.mock("./api", () => ({
  default: { get: vi.fn() },
}));

afterEach(() => {
  clearIndonesiaRegionCache();
  vi.clearAllMocks();
});

describe("indonesiaRegions", () => {
  it("menormalisasi dan mencocokkan nama wilayah tanpa membedakan kapitalisasi", () => {
    const regions = [{ id: "34", name: "DI YOGYAKARTA" }];

    expect(normalizeIndonesiaRegionName("  Di   Yogyakarta ")).toBe("DI YOGYAKARTA");
    expect(findIndonesiaRegionByName(regions, "Di Yogyakarta")).toEqual(regions[0]);
  });

  it("memuat dan menyimpan hasil provinsi di cache", async () => {
    api.get.mockResolvedValue({
      data: { data: [
        { id: "34", name: "DI YOGYAKARTA" },
        { id: "", name: "Tidak valid" },
      ] },
    });

    await expect(getIndonesiaProvinces()).resolves.toEqual([
      { id: "34", name: "DI YOGYAKARTA" },
    ]);
    await getIndonesiaProvinces();

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/regions/provinces");
  });

  it("menghapus cache permintaan yang gagal agar dapat dicoba kembali", async () => {
    api.get
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValueOnce({ data: { data: [] } });

    await expect(getIndonesiaProvinces()).rejects.toThrow("Service unavailable");
    await expect(getIndonesiaProvinces()).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
