import {
  Aset,
  Aset3dCatalog,
  AsetNjopHistory,
  BuildingOccupant,
} from "../models/index.js";
import AuditService from "../services/audit.service.js";

const textOrNull = (value, maximum = 500) => {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maximum) : null;
};

const normalizeOccupant = (body = {}) => ({
  nama_penghuni: textOrNull(body.nama_penghuni, 150),
  alamat: textOrNull(body.alamat, 2000),
  tempat_lahir: textOrNull(body.tempat_lahir, 100),
  tanggal_lahir: body.tanggal_lahir || null,
  pekerjaan: textOrNull(body.pekerjaan, 100),
  no_ktp: textOrNull(body.no_ktp, 20),
  status_penguasaan: textOrNull(body.status_penguasaan, 100),
  aktif: body.aktif !== false,
  catatan: textOrNull(body.catatan, 2000),
});

export const listOccupants = async (req, res) => {
  try {
    const building = await Aset3dCatalog.findByPk(req.params.kode3d, {
      attributes: ["kode_3d"],
    });
    if (!building) return res.status(404).json({ success: false, error: "Bangunan tidak ditemukan" });
    const occupants = await BuildingOccupant.findAll({
      where: { kode_3d: building.kode_3d },
      order: [["aktif", "DESC"], ["nama_penghuni", "ASC"]],
    });
    return res.json({ success: true, data: occupants });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createOccupant = async (req, res) => {
  try {
    const building = await Aset3dCatalog.findByPk(req.params.kode3d);
    if (!building) return res.status(404).json({ success: false, error: "Bangunan tidak ditemukan" });
    const payload = normalizeOccupant(req.body);
    if (!payload.nama_penghuni) {
      return res.status(400).json({ success: false, error: "Nama penghuni wajib diisi" });
    }
    const occupant = await BuildingOccupant.create({
      ...payload,
      kode_3d: building.kode_3d,
      created_by: req.user.id_user,
    });
    await AuditService.logCreate({
      tabel: "building_occupants",
      id_referensi: occupant.id_penghuni,
      data_baru: { ...occupant.toJSON(), no_ktp: occupant.no_ktp ? "[TERLINDUNGI]" : null },
      keterangan: `Menambahkan penghuni pada bangunan ${building.kode_3d}`,
      user_id: req.user.id_user,
      req,
    });
    return res.status(201).json({ success: true, message: "Penghuni berhasil ditambahkan", data: occupant });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateOccupant = async (req, res) => {
  try {
    const occupant = await BuildingOccupant.findOne({
      where: { id_penghuni: req.params.occupantId, kode_3d: req.params.kode3d },
    });
    if (!occupant) return res.status(404).json({ success: false, error: "Penghuni tidak ditemukan" });
    const payload = normalizeOccupant(req.body);
    if (!payload.nama_penghuni) {
      return res.status(400).json({ success: false, error: "Nama penghuni wajib diisi" });
    }
    await occupant.update(payload);
    return res.json({ success: true, message: "Data penghuni berhasil diperbarui", data: occupant });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const removeOccupant = async (req, res) => {
  try {
    const occupant = await BuildingOccupant.findOne({
      where: { id_penghuni: req.params.occupantId, kode_3d: req.params.kode3d },
    });
    if (!occupant) return res.status(404).json({ success: false, error: "Penghuni tidak ditemukan" });
    await occupant.destroy();
    return res.json({ success: true, message: "Data penghuni berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const listNjopHistory = async (req, res) => {
  try {
    const asset = await Aset.findByPk(req.params.id, { attributes: ["id_aset"] });
    if (!asset) return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    const history = await AsetNjopHistory.findAll({
      where: { id_aset: asset.id_aset },
      order: [["tahun", "DESC"]],
    });
    return res.json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const upsertNjopHistory = async (req, res) => {
  try {
    const asset = await Aset.findByPk(req.params.id);
    if (!asset) return res.status(404).json({ success: false, error: "Aset tidak ditemukan" });
    const tahun = Number.parseInt(req.body?.tahun, 10);
    if (!Number.isInteger(tahun) || tahun < 1900 || tahun > 2200) {
      return res.status(400).json({ success: false, error: "Tahun NJOP tidak valid" });
    }
    const values = {
      njop_tanah: req.body?.njop_tanah === "" ? null : req.body?.njop_tanah ?? null,
      njop_bangunan: req.body?.njop_bangunan === "" ? null : req.body?.njop_bangunan ?? null,
      created_by: req.user.id_user,
    };
    const [history, created] = await AsetNjopHistory.findOrCreate({
      where: { id_aset: asset.id_aset, tahun },
      defaults: { ...values, id_aset: asset.id_aset, tahun },
    });
    if (!created) await history.update(values);
    await asset.update({
      njop_tahun: tahun,
      njop_bumi_pemetaan: values.njop_tanah,
      njop_bangunan_pemetaan: values.njop_bangunan,
      updated_at: new Date(),
    });
    return res.json({ success: true, message: "Riwayat NJOP berhasil disimpan", data: history });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
