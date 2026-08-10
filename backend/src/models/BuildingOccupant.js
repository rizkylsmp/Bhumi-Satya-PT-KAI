import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BuildingOccupant = sequelize.define(
  "BuildingOccupant",
  {
    id_penghuni: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kode_3d: {
      type: DataTypes.STRING(40),
      allowNull: false,
      references: { model: "aset_3d_catalog", key: "kode_3d" },
    },
    nama_penghuni: { type: DataTypes.STRING(150), allowNull: false },
    alamat: { type: DataTypes.TEXT, allowNull: true },
    tempat_lahir: { type: DataTypes.STRING(100), allowNull: true },
    tanggal_lahir: { type: DataTypes.DATEONLY, allowNull: true },
    pekerjaan: { type: DataTypes.STRING(100), allowNull: true },
    no_ktp: { type: DataTypes.STRING(20), allowNull: true },
    status_penguasaan: { type: DataTypes.STRING(100), allowNull: true },
    aktif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    catatan: { type: DataTypes.TEXT, allowNull: true },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id_user" },
    },
  },
  {
    tableName: "building_occupants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default BuildingOccupant;
