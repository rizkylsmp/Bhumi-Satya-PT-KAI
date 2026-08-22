import { describe, expect, it } from "vitest";
import {
  buildAssetPopupData,
  resolvePopupModel,
} from "./assetPopupData";

describe("asset popup data", () => {
  it("builds the requested 41 map attributes in the required order", () => {
    const result = buildAssetPopupData({
      id_aset: 17,
      pajak_fid: 9,
      lintas: "Lintas Utara",
      njop_tahun: 2026,
      foto_aset: "https://example.test/foto.jpg",
      active_model_3d: {
        jenis_bangunan: "Stasiun",
        material_dinding: "Bata",
        material_lantai: "Granit",
        material_atap: "Genteng",
        occupants: [{ nama_penghuni: "Petugas A", no_ktp: "1234" }],
      },
    });

    expect(result.mapAttributes).toHaveLength(41);
    expect(result.mapAttributes.map((item) => item.label)).toEqual([
      "FID", "Lintas", "KM_HM", "Dusun", "Kelurahan", "Kecamatan",
      "Kabupaten/Kota", "Provinsi", "Batas Utara", "Batas Selatan",
      "Batas Barat", "Batas Timur", "Easting", "Northing", "Jenis Hak",
      "Persewaan", "No. Kontrak", "Masa Sewa", "Status", "Jenis Aset",
      "Jenis Bangunan", "Dinding", "Lantai", "Atap", "Luas Tanah",
      "Pemanfaatan", "NJOP_Tahun", "NJOP_Tanah", "NJOP_Bangunan",
      "Estimasi", "Penyewa", "Penghuni", "Penguasaan", "Alamat", "TTL",
      "Usia", "Pekerjaan", "No. KTP", "ID_Aset", "Foto", "Catatan",
    ]);
    expect(result.mapAttributes).toEqual(expect.arrayContaining([
      { label: "Jenis Bangunan", value: "Stasiun" },
      { label: "Penghuni", value: "Petugas A" },
      { label: "No. KTP", value: "1234" },
      {
        label: "Foto",
        value: "Lihat foto",
        href: "https://example.test/foto.jpg",
      },
    ]));
    expect(result.mapAttributeSections.map((section) => section.menu)).toEqual([
      "Pusat Data Tanah",
      "Pusat Data Tanah · Fisik/Spasial",
      "Pusat Data Tanah · Legal",
      "Pusat Data Bangunan",
      "Penyewaan",
      "Pusat Data Tanah · Pajak",
      "Pusat Data Bangunan · Data Penghuni",
      "Pusat Data Tanah",
    ]);
    expect(
      result.mapAttributeSections.flatMap((section) => section.rows),
    ).toHaveLength(41);
  });

  it("keeps popup fields visible and uses placeholders for empty values", () => {
    const result = buildAssetPopupData({
      id_aset: 17,
      kode_aset: "AST-001",
      nama_aset: "Gedung Utama",
      jenis_aset: "Bangunan",
      lokasi: "Jl. Tata Bumi",
      luas: "1250.5",
      nib: null,
      opd_pengguna: "Tidak ditampilkan",
    });

    expect(result.title).toBe("Gedung Utama");
    expect(result.assetCode).toBe("AST-001");
    expect(result.location).toBe("Jl. Tata Bumi");
    expect(result.area).toBe("1250.5");
    expect(result.general).toContainEqual({
      label: "Kode Tanah",
      value: "AST-001",
    });
    expect(result.general).toContainEqual({
      label: "Nama Tanah",
      value: "Gedung Utama",
    });
    expect(result.general).toContainEqual({
      label: "Kode Bidang",
      value: "-",
    });
    expect(result.details).toEqual(expect.arrayContaining([
      { label: "Jenis Tanah", value: "Bangunan" },
      { label: "Luas Terdata", value: "1250.5", format: "area" },
      { label: "Nomor Sertifikat", value: "-" },
    ]));
  });

  it("prioritizes the selected preview model over the published model", () => {
    const published = { id_model_3d: 1, lod: "LOD1", version: 1 };
    const selected = {
      id_model_3d: 2,
      version: 3,
      format: "GLB",
      is_active: false,
    };
    const asset = {
      active_model_3d: published,
      building_height_m: 18,
      building_floors: 5,
    };

    expect(resolvePopupModel(asset, selected)).toBe(selected);
    expect(buildAssetPopupData(asset, selected).model).toMatchObject({
      id: 2,
      version: 3,
      format: "GLB",
      height: 18,
      floors: 5,
      active: false,
    });
  });

  it("shows the shared building name in general and 3D data", () => {
    const result = buildAssetPopupData({
      kode_aset: "AST-001",
      nama_aset: "Aset Induk",
      kode_3d: "3D-001",
      building_name_3d: "Nama Bangunan Lama",
      popup_context: "3d",
      active_model_3d: {
        kode_3d: "3D-002",
        building_name: "Gedung Laboratorium",
        lod: "LOD2",
      },
    });

    expect(result.catalogCode).toBe("3D-002");
    expect(result.context).toBe("3d");
    expect(result.general).toContainEqual({
      label: "Nama Bangunan",
      value: "Gedung Laboratorium",
    });
    expect(result.general).toContainEqual({
      label: "Kode Bangunan 3D",
      value: "3D-002",
    });
    expect(result.general.some((item) => item.label === "Kode Tanah")).toBe(
      false,
    );
    expect(result.landContext).toContainEqual({
      label: "Kode Tanah",
      value: "AST-001",
    });
    expect(result.model).toMatchObject({
      name: "Gedung Laboratorium",
      available: true,
    });
  });

  it("shows the building count when a 2D parcel is selected", () => {
    const result = buildAssetPopupData({
      kode_aset: "AST-002",
      kode_2d: "2D-002",
      popup_context: "2d",
      building_count_3d: 4,
    });

    expect(result.parcelCode).toBe("2D-002");
    expect(result.general).toContainEqual({
      label: "Kode Bidang",
      value: "2D-002",
    });
    expect(result.general).toContainEqual({
      label: "Jumlah Bangunan 3D",
      value: "4 bangunan",
    });
  });

  it("keeps every tax field visible when some values are empty", () => {
    const result = buildAssetPopupData({
      pajak_status: "Terverifikasi",
      nop: "35.75.010.001.001-0001.0",
      nama_wajib_pajak: "",
      njop_bumi_pemetaan: "250000000",
      pbb_pemetaan: null,
    });

    expect(result.tax).toEqual(expect.arrayContaining([
      { label: "Status Objek Pajak", value: "Terverifikasi" },
      {
        label: "NOP",
        value: "35.75.010.001.001-0001.0",
      },
      {
        label: "NJOP Bumi Pemetaan",
        value: "250000000",
        format: "currency",
      },
      { label: "Nama Wajib Pajak", value: "-" },
      { label: "PBB Pemetaan", value: "-", format: "currency" },
    ]));
    expect(result.tax).toHaveLength(13);
  });

  it("groups physical, KIB, administrative, and spatial data", () => {
    const result = buildAssetPopupData({
      kecamatan: "Mantrijeron",
      batas_utara: "Jalan lingkungan",
      nibar: "NBR-12",
      harga_perolehan: "150000000",
      kode_bmd: "01.03.04",
      nilai_buku: "120000000",
      koordinat_lat: "-7.8101",
      koordinat_long: "110.3612",
      polygon_bidang: { type: "Polygon", coordinates: [] },
      kw: "KW1",
    });

    expect(result.physical).toEqual(expect.arrayContaining([
      { label: "Kecamatan", value: "Mantrijeron" },
      { label: "Batas Utara", value: "Jalan lingkungan" },
      { label: "Batas Selatan", value: "-" },
    ]));
    expect(result.kib).toEqual(expect.arrayContaining([
      { label: "NIBAR", value: "NBR-12" },
      {
        label: "Harga Perolehan",
        value: "150000000",
        format: "currency",
      },
    ]));
    expect(result.administrative).toEqual(expect.arrayContaining([
      { label: "Kode BMD", value: "01.03.04" },
      { label: "Nilai Buku", value: "120000000", format: "currency" },
    ]));
    expect(result.spatial).toEqual(expect.arrayContaining([
      { label: "Kode Wilayah (KW)", value: "KW1" },
      { label: "Latitude", value: "-7.8101", format: "coordinate" },
      { label: "Longitude", value: "110.3612", format: "coordinate" },
      { label: "CRS Koordinat", value: "WGS 84 (EPSG:4326)" },
      { label: "Polygon Bidang", value: "Tersedia" },
    ]));
  });

  it("includes supporting 2D spatial attributes when available", () => {
    const result = buildAssetPopupData({
      nib: "NIB-001",
      plotting_status: "Sudah diplot",
      luas: "875.25",
      building_footprint: {
        type: "Polygon",
        coordinates: [],
      },
      sumber: "Survei lapangan",
    });

    expect(result.spatial).toEqual(expect.arrayContaining([
      { label: "NIB", value: "NIB-001" },
      { label: "Status Plotting", value: "Sudah diplot" },
      { label: "Luas Bidang", value: "875.25", format: "area" },
      { label: "Tapak Bangunan", value: "Tersedia" },
      { label: "Sumber Data", value: "Survei lapangan" },
    ]));
  });

  it("returns every popup section for a completely empty record", () => {
    const result = buildAssetPopupData({});

    expect(result.general).toContainEqual({
      label: "Jumlah Bangunan 3D",
      value: "0 bangunan",
    });
    expect(
      result.general
        .filter((item) => item.label !== "Jumlah Bangunan 3D")
        .every((item) => item.value === "-"),
    ).toBe(true);
    expect(result.landContext.every((item) => item.value === "-")).toBe(true);
    expect(result.legal.every((item) => item.value === "-")).toBe(true);
    expect(result.physical.every((item) => item.value === "-")).toBe(true);
    expect(result.kib.every((item) => item.value === "-")).toBe(true);
    expect(result.administrative.every((item) => item.value === "-")).toBe(true);
    expect(result.spatial.every((item) => item.value === "-")).toBe(true);
    expect(result.tax.every((item) => item.value === "-")).toBe(true);
  });
});
