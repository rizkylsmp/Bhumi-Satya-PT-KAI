const firstValue = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== "" &&
      String(value).trim() !== "-",
  ) ?? null;

export const hasPopupValue = (value) =>
  firstValue(value) !== null;

const buildPopupRows = (rows) =>
  rows.map(([label, value, format, extra]) => ({
    label,
    value: hasPopupValue(value) ? value : "-",
    ...(format ? { format } : {}),
    ...(extra || {}),
  }));

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const born = new Date(`${String(birthDate).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (
    today.getMonth() < born.getMonth()
    || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
  ) age -= 1;
  return age >= 0 ? `${age} tahun` : null;
};

const formatLeasePeriod = (start, end) => {
  if (!start && !end) return null;
  return [start, end].filter(Boolean).join(" s.d. ");
};

export const resolvePopupModel = (asset = {}, modelOverride = null) =>
  modelOverride ||
  asset.active_model_3d ||
  asset.active_models_3d?.find((model) => model?.is_active) ||
  asset.active_models_3d?.[0] ||
  null;

export const buildAssetPopupData = (asset = {}, modelOverride = null) => {
  const model = resolvePopupModel(asset, modelOverride);
  const context = ["2d", "3d"].includes(asset.popup_context)
    ? asset.popup_context
    : null;
  const assetName = firstValue(asset.nama_aset, asset.nama);
  const assetCode = firstValue(asset.kode_aset, asset.kode);
  const parcelCode = firstValue(asset.kode_2d, asset.catalog2d?.kode_2d);
  const catalogCode = firstValue(
    model?.kode_3d,
    asset.kode_3d,
    asset.catalog3d?.kode_3d,
  );
  const buildingName = firstValue(
    model?.building_name,
    asset.building_name_3d,
    asset.catalog3d?.building_name,
  );
  const inferredBuildingCount = new Set([
    ...(Array.isArray(asset.kode_3d_list) ? asset.kode_3d_list : []),
    ...(Array.isArray(asset.active_models_3d)
      ? asset.active_models_3d.map((item) => item?.kode_3d)
      : []),
  ].filter(hasPopupValue)).size;
  const buildingCount = Number.isFinite(Number(asset.building_count_3d))
    ? Number(asset.building_count_3d)
    : inferredBuildingCount;
  const isBuildingContext = context === "3d";
  const occupant = model?.occupants?.[0] || asset.penghuni_aktif || null;
  const leaseStatus = firstValue(model?.status_sewa, asset.status_sewa);
  const photoUrl = firstValue(asset.foto_aset, asset.foto);
  const mapAttributes = buildPopupRows([
    ["FID", firstValue(asset.fid, asset.pajak_fid)],
    ["Lintas", asset.lintas],
    ["KM_HM", asset.km_hm],
    ["Dusun", asset.dusun],
    ["Kelurahan", asset.desa_kelurahan],
    ["Kecamatan", asset.kecamatan],
    ["Kabupaten/Kota", asset.kabupaten_kota],
    ["Provinsi", asset.provinsi],
    ["Batas Utara", asset.batas_utara],
    ["Batas Selatan", asset.batas_selatan],
    ["Batas Barat", asset.batas_barat],
    ["Batas Timur", asset.batas_timur],
    ["Easting", asset.easting, "coordinate"],
    ["Northing", asset.northing, "coordinate"],
    ["Jenis Hak", asset.jenis_hak],
    ["Persewaan", leaseStatus],
    ["No. Kontrak", firstValue(model?.nomor_kontrak, asset.nomor_kontrak)],
    ["Masa Sewa", formatLeasePeriod(
      firstValue(model?.tanggal_mulai_sewa, asset.tanggal_mulai_sewa),
      firstValue(model?.tanggal_berakhir_sewa, asset.tanggal_berakhir_sewa),
    )],
    ["Status", asset.status],
    ["Jenis Aset", firstValue(asset.jenis_aset, asset.jenis)],
    ["Jenis Bangunan", firstValue(model?.jenis_bangunan, asset.jenis_bangunan)],
    ["Dinding", firstValue(model?.material_dinding, asset.material_dinding)],
    ["Lantai", firstValue(model?.material_lantai, asset.material_lantai)],
    ["Atap", firstValue(model?.material_atap, asset.material_atap)],
    ["Luas Tanah", firstValue(asset.luas_lapangan, asset.luas), "area"],
    ["Pemanfaatan", asset.penggunaan_saat_ini],
    ["NJOP_Tahun", asset.njop_tahun],
    ["NJOP_Tanah", asset.njop_bumi_pemetaan, "currency"],
    ["NJOP_Bangunan", asset.njop_bangunan_pemetaan, "currency"],
    ["Estimasi", firstValue(model?.estimasi_sewa, asset.estimasi_sewa), "currency"],
    ["Penyewa", firstValue(model?.penyewa_aktif, asset.penyewa_aktif)],
    ["Penghuni", occupant?.nama_penghuni],
    ["Penguasaan", firstValue(occupant?.status_penguasaan, asset.penguasaan)],
    ["Alamat", firstValue(occupant?.alamat, asset.lokasi)],
    ["TTL", [occupant?.tempat_lahir, occupant?.tanggal_lahir].filter(Boolean).join(", ")],
    ["Usia", calculateAge(occupant?.tanggal_lahir)],
    ["Pekerjaan", occupant?.pekerjaan],
    ["No. KTP", occupant?.no_ktp],
    ["ID_Aset", firstValue(asset.id_aset, asset.id)],
    ["Foto", photoUrl ? "Lihat foto" : null, null, photoUrl ? { href: photoUrl } : null],
    ["Catatan", firstValue(asset.notes, asset.keterangan)],
  ]);
  const mapAttributeSections = [
    {
      id: "identityLocation",
      title: "Identitas & Lokasi",
      menu: "Pusat Data Tanah",
      labels: [
        "FID", "Lintas", "KM_HM", "Dusun", "Kelurahan", "Kecamatan",
        "Kabupaten/Kota", "Provinsi", "Status", "Jenis Aset", "ID_Aset",
      ],
    },
    {
      id: "physicalSpatial",
      title: "Fisik & Spasial",
      menu: "Pusat Data Tanah · Fisik/Spasial",
      labels: [
        "Batas Utara", "Batas Selatan", "Batas Barat", "Batas Timur",
        "Easting", "Northing", "Luas Tanah", "Pemanfaatan",
      ],
    },
    {
      id: "legal",
      title: "Legal & Penguasaan",
      menu: "Pusat Data Tanah · Legal",
      labels: ["Jenis Hak", "Penguasaan"],
    },
    {
      id: "building",
      title: "Data Bangunan",
      menu: "Pusat Data Bangunan",
      labels: ["Jenis Bangunan", "Dinding", "Lantai", "Atap"],
    },
    {
      id: "rental",
      title: "Data Penyewaan",
      menu: "Penyewaan",
      labels: ["Persewaan", "No. Kontrak", "Masa Sewa", "Estimasi", "Penyewa"],
    },
    {
      id: "tax",
      title: "Data Pajak",
      menu: "Pusat Data Tanah · Pajak",
      labels: ["NJOP_Tahun", "NJOP_Tanah", "NJOP_Bangunan"],
    },
    {
      id: "occupant",
      title: "Data Penghuni",
      menu: "Pusat Data Bangunan · Data Penghuni",
      labels: ["Penghuni", "Alamat", "TTL", "Usia", "Pekerjaan", "No. KTP"],
    },
    {
      id: "mediaNotes",
      title: "Media & Catatan",
      menu: "Pusat Data Tanah",
      labels: ["Foto", "Catatan"],
    },
  ].map((section) => ({
    ...section,
    rows: section.labels.map((label) =>
      mapAttributes.find((item) => item.label === label),
    ).filter(Boolean),
  }));
  const general = buildPopupRows(
    isBuildingContext
      ? [
          ["Kode Bangunan 3D", catalogCode],
          ["Nama Bangunan", buildingName],
          [
            "Kategori",
            firstValue(model?.category, asset.category, asset.catalog3d?.category, "Bangunan"),
          ],
          ["Jumlah Lantai", firstValue(model?.floors, asset.building_floors)],
          [
            "Tinggi Bangunan",
            firstValue(model?.height, asset.building_height_m),
            "height",
          ],
          [
            "Status Model",
            model ? (model.is_active === false ? "Belum aktif" : "Aktif") : null,
          ],
        ]
      : [
          ["Kode Bidang", parcelCode],
          ["Kode Tanah", assetCode],
          ["Nama Tanah", assetName],
          ["Jumlah Bangunan 3D", `${buildingCount} bangunan`],
          ["Jenis Tanah", firstValue(asset.jenis_aset, asset.jenis)],
          ["Luas Terdata", asset.luas, "area"],
          ["Tahun Perolehan", firstValue(asset.tahun_perolehan, asset.tahun)],
        ],
  );

  const landContext = buildPopupRows([
    ["Kode Bidang", parcelCode],
    ["Kode Tanah", assetCode],
    ["Nama Tanah", assetName],
    ["Lokasi", firstValue(asset.lokasi)],
    ["Luas Bidang", firstValue(asset.luas_lapangan, asset.luas), "area"],
  ]);

  const legal = buildPopupRows([
    ["Status Sertifikat", asset.status_sertifikat],
    ["Nomor Sertifikat", asset.nomor_sertifikat],
    ["Jenis Hak", asset.jenis_hak],
    ["Atas Nama", asset.atas_nama],
  ]);

  const physical = buildPopupRows([
    ["Kecamatan", asset.kecamatan],
    ["Desa/Kelurahan", asset.desa_kelurahan],
    ["Penggunaan Saat Ini", asset.penggunaan_saat_ini],
    ["Luas Lapangan", asset.luas_lapangan, "area"],
    ["Batas Utara", asset.batas_utara],
    ["Batas Selatan", asset.batas_selatan],
    ["Batas Timur", asset.batas_timur],
    ["Batas Barat", asset.batas_barat],
  ]);

  const kib = buildPopupRows([
    ["NIBAR", asset.nibar],
    ["ID Pemda", asset.id_pemda],
    ["Kode Barang", asset.kode_barang],
    ["Nomor Register", asset.no_register],
    ["Luas KIB", asset.luas_kib, "area"],
    ["Harga Perolehan", asset.harga_perolehan, "currency"],
    ["Penggunaan KIB", asset.penggunaan_kib],
    ["Tanggal Scan", asset.tanggal_scan],
  ]);

  const administrative = buildPopupRows([
    ["Kode BMD", asset.kode_bmd],
    ["OPD Pengguna", asset.opd_pengguna],
    ["Nilai Aset", asset.nilai_aset, "currency"],
    ["Nilai Buku", asset.nilai_buku, "currency"],
    ["Nilai NJOP", asset.nilai_njop, "currency"],
    ["SK Penetapan", asset.sk_penetapan],
  ]);

  const latitude = firstValue(asset.koordinat_lat, asset.latitude, asset.lat);
  const longitude = firstValue(
    asset.koordinat_long,
    asset.longitude,
    asset.lng,
  );
  const hasCoordinate =
    hasPopupValue(latitude) && hasPopupValue(longitude);
  const hasParcelPolygon = Boolean(asset.polygon_bidang || asset.polygon);
  const hasBuildingFootprint = Boolean(asset.building_footprint);
  const spatial = buildPopupRows([
    ["NIB", asset.nib],
    ["Kode Wilayah (KW)", asset.kw],
    ["Status Plotting", asset.plotting_status],
    ["Luas Bidang", firstValue(asset.luas_lapangan, asset.luas), "area"],
    ["Latitude", latitude, "coordinate"],
    ["Longitude", longitude, "coordinate"],
    ["CRS Koordinat", hasCoordinate ? "WGS 84 (EPSG:4326)" : null],
    ["Polygon Bidang", hasParcelPolygon ? "Tersedia" : null],
    ["Tapak Bangunan", hasBuildingFootprint ? "Tersedia" : null],
    ["Sumber Data", asset.sumber],
  ]);

  const tax = buildPopupRows([
    ["Status Objek Pajak", asset.pajak_status],
    ["FID Pajak", asset.pajak_fid],
    ["NOP", asset.nop],
    ["Nama Wajib Pajak", asset.nama_wajib_pajak],
    ["Nilai Bumi/m²", asset.nilai_bumi_per_m2, "currency"],
    ["Nilai Bangunan/m²", asset.nilai_bangunan_per_m2, "currency"],
    ["Luas Bumi Bapenda", asset.luas_bumi_bapenda, "area"],
    ["Luas Bangunan Bapenda", asset.luas_bangunan_bapenda, "area"],
    ["Luas Bumi Pemetaan", asset.luas_bumi_pemetaan, "area"],
    ["Luas Bangunan Pemetaan", asset.luas_bangunan_pemetaan, "area"],
    ["NJOP Bumi Pemetaan", asset.njop_bumi_pemetaan, "currency"],
    ["NJOP Bangunan Pemetaan", asset.njop_bangunan_pemetaan, "currency"],
    ["PBB Pemetaan", asset.pbb_pemetaan, "currency"],
  ]);

  return {
    context,
    title: isBuildingContext
      ? buildingName || "Bangunan tanpa nama"
      : assetName || "Tanah tanpa nama",
    assetCode,
    parcelCode,
    catalogCode,
    location: firstValue(asset.lokasi),
    description: firstValue(asset.keterangan),
    area: firstValue(asset.luas_lapangan, asset.luas),
    year: firstValue(asset.tahun_perolehan, asset.tahun),
    general,
    landContext,
    legal,
    physical,
    kib,
    administrative,
    spatial,
    tax,
    mapAttributes,
    mapAttributeSections,
    details: [...general, ...legal],
    model: {
      available: Boolean(
        model ||
        hasPopupValue(buildingName) ||
        hasPopupValue(asset.building_height_m) ||
        hasPopupValue(asset.building_floors),
      ),
      recordAvailable: Boolean(model),
      id: model?.id_model_3d || null,
      name: buildingName,
      version: firstValue(model?.version),
      format: firstValue(model?.format, model?.model_type),
      height: firstValue(asset.building_height_m),
      floors: firstValue(asset.building_floors),
      sourceCrs: firstValue(model?.source_crs, asset.model_3d_source_crs),
      active: model ? model.is_active !== false : null,
    },
  };
};
