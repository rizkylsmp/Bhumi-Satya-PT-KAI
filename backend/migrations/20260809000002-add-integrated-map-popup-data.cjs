"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const assetColumns = {
      lintas: { type: Sequelize.STRING(100), allowNull: true },
      km_hm: { type: Sequelize.STRING(50), allowNull: true },
      dusun: { type: Sequelize.STRING(100), allowNull: true },
      kabupaten_kota: { type: Sequelize.STRING(100), allowNull: true },
      provinsi: { type: Sequelize.STRING(100), allowNull: true },
      easting: { type: Sequelize.DECIMAL(15, 3), allowNull: true },
      northing: { type: Sequelize.DECIMAL(15, 3), allowNull: true },
      coordinate_crs: { type: Sequelize.STRING(50), allowNull: true },
      penguasaan: { type: Sequelize.STRING(100), allowNull: true },
      njop_tahun: { type: Sequelize.INTEGER, allowNull: true },
    };
    for (const [name, definition] of Object.entries(assetColumns)) {
      await queryInterface.addColumn("aset", name, definition);
    }

    for (const name of ["jenis_bangunan", "material_dinding", "material_lantai", "material_atap"]) {
      await queryInterface.addColumn("aset_3d_catalog", name, {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
    await queryInterface.addColumn("sewa_aset", "nilai_estimasi", {
      type: Sequelize.DECIMAL(20, 2),
      allowNull: true,
    });

    await queryInterface.createTable("aset_njop_history", {
      id_njop_history: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      id_aset: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "aset", key: "id_aset" },
        onDelete: "CASCADE",
      },
      tahun: { type: Sequelize.INTEGER, allowNull: false },
      njop_tanah: { type: Sequelize.DECIMAL(20, 2), allowNull: true },
      njop_bangunan: { type: Sequelize.DECIMAL(20, 2), allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: "users", key: "id_user" } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("aset_njop_history", ["id_aset", "tahun"], {
      unique: true,
      name: "aset_njop_history_asset_year_unique",
    });

    await queryInterface.createTable("building_occupants", {
      id_penghuni: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      kode_3d: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "aset_3d_catalog", key: "kode_3d" },
        onDelete: "CASCADE",
      },
      nama_penghuni: { type: Sequelize.STRING(150), allowNull: false },
      alamat: { type: Sequelize.TEXT, allowNull: true },
      tempat_lahir: { type: Sequelize.STRING(100), allowNull: true },
      tanggal_lahir: { type: Sequelize.DATEONLY, allowNull: true },
      pekerjaan: { type: Sequelize.STRING(100), allowNull: true },
      no_ktp: { type: Sequelize.STRING(20), allowNull: true },
      status_penguasaan: { type: Sequelize.STRING(100), allowNull: true },
      aktif: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      catatan: { type: Sequelize.TEXT, allowNull: true },
      created_by: { type: Sequelize.INTEGER, allowNull: true, references: { model: "users", key: "id_user" } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });
    await queryInterface.addIndex("building_occupants", ["kode_3d", "aktif"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("building_occupants");
    await queryInterface.dropTable("aset_njop_history");
    await queryInterface.removeColumn("sewa_aset", "nilai_estimasi");
    for (const name of ["jenis_bangunan", "material_dinding", "material_lantai", "material_atap"]) {
      await queryInterface.removeColumn("aset_3d_catalog", name);
    }
    for (const name of ["lintas", "km_hm", "dusun", "kabupaten_kota", "provinsi", "easting", "northing", "coordinate_crs", "penguasaan", "njop_tahun"]) {
      await queryInterface.removeColumn("aset", name);
    }
  },
};
