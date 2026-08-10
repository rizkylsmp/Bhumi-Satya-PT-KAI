import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AsetNjopHistory = sequelize.define(
  "AsetNjopHistory",
  {
    id_njop_history: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_aset: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "aset", key: "id_aset" },
    },
    tahun: { type: DataTypes.INTEGER, allowNull: false },
    njop_tanah: { type: DataTypes.DECIMAL(20, 2), allowNull: true },
    njop_bangunan: { type: DataTypes.DECIMAL(20, 2), allowNull: true },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id_user" },
    },
  },
  {
    tableName: "aset_njop_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ unique: true, fields: ["id_aset", "tahun"] }],
  },
);

export default AsetNjopHistory;
