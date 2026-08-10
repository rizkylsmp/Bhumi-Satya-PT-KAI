import crypto from "node:crypto";
import { Op, Sequelize } from "sequelize";
import { Aset3dCatalog, BuildingDocumentation, User } from "../models/index.js";
import AuditService from "../services/audit.service.js";
import { deleteFromSupabase, uploadToSupabase } from "../utils/r2Storage.js";
import {
  safeDocumentationName,
  validateDocumentationContent,
} from "../utils/buildingDocumentation.js";

const include = [
  {
    model: Aset3dCatalog,
    as: "building",
    attributes: ["kode_3d", "kode_2d", "building_name"],
  },
  {
    model: User,
    as: "uploader",
    attributes: ["id_user", "nama_lengkap"],
    required: false,
  },
];

const positiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
};

export const serializeBuildingSummary = (record) => {
  const value = record?.get ? record.get({ plain: true }) : record;
  return {
    ...value,
    photo_count: Number(value?.photo_count || 0),
    video_count: Number(value?.video_count || 0),
    documentation_count: Number(value?.photo_count || 0) + Number(value?.video_count || 0),
  };
};

export const listBuildings = async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1, 100000);
    const limit = positiveInt(req.query.limit, 10, 100);
    const search = String(req.query.search || "").trim();
    const where = search ? {
      [Op.or]: [
        { kode_3d: { [Op.iLike]: `%${search}%` } },
        { kode_2d: { [Op.iLike]: `%${search}%` } },
        { building_name: { [Op.iLike]: `%${search}%` } },
      ],
    } : {};
    const { count, rows } = await Aset3dCatalog.findAndCountAll({
      where,
      attributes: {
        include: [
          [Sequelize.literal(`(
            SELECT COUNT(*)::integer
            FROM "building_documentation" photo_documentation
            WHERE photo_documentation."kode_3d" = "Aset3dCatalog"."kode_3d"
              AND photo_documentation."media_type" = 'photo'
          )`), "photo_count"],
          [Sequelize.literal(`(
            SELECT COUNT(*)::integer
            FROM "building_documentation" video_documentation
            WHERE video_documentation."kode_3d" = "Aset3dCatalog"."kode_3d"
              AND video_documentation."media_type" = 'video'
          )`), "video_count"],
        ],
      },
      limit,
      offset: (page - 1) * limit,
      order: [["kode_3d", "ASC"]],
    });
    return res.json({
      success: true,
      data: rows.map(serializeBuildingSummary),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const list = async (req, res) => {
  try {
    const page = positiveInt(req.query.page, 1, 100000);
    const limit = positiveInt(req.query.limit, 12, 100);
    const where = {};
    const kode3d = String(req.query.kode_3d || "").trim();
    const mediaType = String(req.query.media_type || "").trim();
    const search = String(req.query.search || "").trim();
    if (kode3d) where.kode_3d = kode3d;
    if (["photo", "video"].includes(mediaType)) where.media_type = mediaType;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { original_name: { [Op.iLike]: `%${search}%` } },
        { kode_3d: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const { count, rows } = await BuildingDocumentation.findAndCountAll({
      where,
      include,
      distinct: true,
      limit,
      offset: (page - 1) * limit,
      order: [["created_at", "DESC"]],
    });
    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const create = async (req, res) => {
  let storagePath;
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "Foto atau video wajib dipilih" });
    const kode3d = String(req.body?.kode_3d || "").trim();
    const building = await Aset3dCatalog.findByPk(kode3d);
    if (!building) return res.status(404).json({ success: false, error: "Kode bangunan tidak ditemukan" });

    const media = validateDocumentationContent(req.file);
    const title = String(req.body?.title || req.file.originalname || "").trim().slice(0, 160);
    const description = String(req.body?.description || "").trim().slice(0, 2000) || null;
    const capturedAt = String(req.body?.captured_at || "").trim() || null;
    if (capturedAt && !/^\d{4}-\d{2}-\d{2}$/.test(capturedAt)) {
      return res.status(400).json({ success: false, error: "Tanggal dokumentasi tidak valid" });
    }

    const id = crypto.randomUUID();
    const safeCode = kode3d.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeName = safeDocumentationName(req.file.originalname);
    storagePath = `building-documentation/${safeCode}/${id}-${safeName}`;
    const publicUrl = await uploadToSupabase(storagePath, req.file.buffer, media.mime);
    const record = await BuildingDocumentation.create({
      id_documentation: id,
      kode_3d: kode3d,
      media_type: media.type,
      title: title || safeName,
      description,
      original_name: req.file.originalname.slice(0, 255),
      storage_path: storagePath,
      public_url: publicUrl,
      mime_type: media.mime,
      file_size_bytes: req.file.size,
      captured_at: capturedAt,
      uploaded_by: req.user.id_user,
    });

    await AuditService.logCreate({
      tabel: "building_documentation",
      id_referensi: building.id_aset,
      data_baru: record.toJSON(),
      keterangan: `Mengunggah dokumentasi ${media.type === "photo" ? "foto" : "video"} untuk ${kode3d}`,
      user_id: req.user.id_user,
      req,
    });
    const created = await BuildingDocumentation.findByPk(id, { include });
    return res.status(201).json({ success: true, message: "Dokumentasi berhasil diunggah", data: created });
  } catch (error) {
    if (storagePath) await deleteFromSupabase(storagePath).catch(() => {});
    return res.status(error.status || 500).json({ success: false, error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const record = await BuildingDocumentation.findByPk(req.params.id);
    if (!record) return res.status(404).json({ success: false, error: "Dokumentasi tidak ditemukan" });
    const oldData = record.toJSON();
    await deleteFromSupabase(record.storage_path);
    await record.destroy();
    await AuditService.logDelete({
      tabel: "building_documentation",
      id_referensi: null,
      data_lama: oldData,
      keterangan: `Menghapus dokumentasi ${record.title} dari ${record.kode_3d}`,
      user_id: req.user.id_user,
      req,
    });
    return res.json({ success: true, message: "Dokumentasi berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
