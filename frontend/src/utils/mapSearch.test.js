import { describe, expect, it } from "vitest";
import {
  buildMapSearchEntries,
  getBhumiAtrSearchPayload,
  searchMapRecords,
  splitMapSearchHighlight,
} from "./mapSearch";

describe("map search", () => {
  const assets = [
    {
      id: 1,
      kode_2d: "2D-STPN-01",
      nama_aset: "Bidang Kampus",
      kecamatan: "Gamping",
      active_models_3d: [
        {
          id_model_3d: 11,
          kode_3d: "3D-AULA-01",
          building_name: "Gedung Aula Barat",
          lod: "LOD2",
        },
      ],
    },
    { id: 2, nama_aset: "Lapangan Upacara", kecamatan: "Kasihan" },
  ];

  it("indexes top-level and nested 3D attributes", () => {
    const entries = buildMapSearchEntries(assets[0]);
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Kode 2D", value: "2D-STPN-01" }),
      expect.objectContaining({ label: "Nama Bangunan", value: "Gedung Aula Barat" }),
    ]));
  });

  it("matches multiple words across different asset fields", () => {
    const results = searchMapRecords(assets, "aula gamping");
    expect(results).toHaveLength(1);
    expect(results[0].record.id).toBe(1);
    expect(results[0].matches.map((match) => match.value)).toContain("Gedung Aula Barat");
  });

  it("creates highlighted text segments", () => {
    expect(splitMapSearchHighlight("Gedung Aula Barat", "aula")).toEqual([
      { text: "Gedung ", highlighted: false },
      { text: "Aula", highlighted: true },
      { text: " Barat", highlighted: false },
    ]);
  });

  it("prioritizes NIB for the BHUMI ATR search", () => {
    expect(getBhumiAtrSearchPayload({
      nib: " 34040100001234 ",
      koordinat_lat: -7.8,
      koordinat_long: 110.3,
    })).toEqual({
      type: "NIB",
      value: "34040100001234",
    });
  });

  it("falls back to longitude and latitude for the BHUMI ATR search", () => {
    expect(getBhumiAtrSearchPayload({
      koordinat_lat: "-7.8101",
      koordinat_long: "110.3612",
    })).toEqual({
      type: "koordinat",
      value: "110.3612, -7.8101",
    });
  });

  it("uses model coordinates only when asset coordinates are unavailable", () => {
    expect(getBhumiAtrSearchPayload({
      koordinat_lat: "",
      koordinat_long: null,
      active_model_3d: {
        location_lat: -7.81,
        location_long: 110.36,
      },
    })).toEqual({
      type: "koordinat",
      value: "110.36, -7.81",
    });
  });

  it("returns no BHUMI ATR payload for invalid coordinates", () => {
    expect(getBhumiAtrSearchPayload({
      koordinat_lat: 95,
      koordinat_long: 110.36,
    })).toBeNull();
    expect(getBhumiAtrSearchPayload({})).toBeNull();
  });
});
