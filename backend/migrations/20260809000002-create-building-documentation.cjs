"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("building_documentation", {
      id_documentation: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      kode_3d: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: { model: "aset_3d_catalog", key: "kode_3d" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      media_type: { type: Sequelize.STRING(10), allowNull: false },
      title: { type: Sequelize.STRING(160), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      original_name: { type: Sequelize.STRING(255), allowNull: false },
      storage_path: { type: Sequelize.TEXT, allowNull: false },
      public_url: { type: Sequelize.TEXT, allowNull: false },
      mime_type: { type: Sequelize.STRING(100), allowNull: false },
      file_size_bytes: { type: Sequelize.BIGINT, allowNull: false },
      captured_at: { type: Sequelize.DATEONLY, allowNull: true },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id_user" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
    await queryInterface.addIndex("building_documentation", ["kode_3d"]);
    await queryInterface.addIndex("building_documentation", ["media_type"]);
    await queryInterface.addIndex("building_documentation", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("building_documentation");
  },
};
