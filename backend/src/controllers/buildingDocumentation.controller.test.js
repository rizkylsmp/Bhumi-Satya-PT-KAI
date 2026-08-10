import assert from "node:assert/strict";
import test from "node:test";
import { serializeBuildingSummary } from "./buildingDocumentation.controller.js";

test("menyajikan jumlah foto dan video dokumentasi sebagai angka", () => {
  assert.deepEqual(serializeBuildingSummary({
    kode_3d: "3D-000001",
    building_name: "Gedung Utama",
    photo_count: "4",
    video_count: "2",
  }), {
    kode_3d: "3D-000001",
    building_name: "Gedung Utama",
    photo_count: 4,
    video_count: 2,
    documentation_count: 6,
  });
});
