import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BuildingDocumentation = sequelize.define(
  "BuildingDocumentation",
  {
    id_documentation: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    kode_3d: { type: DataTypes.STRING(40), allowNull: false },
    media_type: { type: DataTypes.STRING(10), allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    original_name: { type: DataTypes.STRING(255), allowNull: false },
    storage_path: { type: DataTypes.TEXT, allowNull: false },
    public_url: { type: DataTypes.TEXT, allowNull: false },
    mime_type: { type: DataTypes.STRING(100), allowNull: false },
    file_size_bytes: { type: DataTypes.BIGINT, allowNull: false },
    captured_at: { type: DataTypes.DATEONLY, allowNull: true },
    uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { tableName: "building_documentation", timestamps: false },
);

export default BuildingDocumentation;
