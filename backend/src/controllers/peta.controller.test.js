import assert from "node:assert/strict";
import test from "node:test";
import { selectOneModelPerBuilding } from "./peta.controller.js";

test("digital twin selects one newest active model per building", () => {
  const selected = selectOneModelPerBuilding([
    { id_model_3d: 1, kode_3d: "3D-A", lod: "LOD1", version: 2 },
    { id_model_3d: 2, kode_3d: "3D-A", lod: "LOD2", version: 4 },
    { id_model_3d: 3, kode_3d: "3D-B", lod: "LOD1", version: 1 },
  ]);

  assert.deepEqual(
    selected.map((model) => model.id_model_3d),
    [2, 3],
  );
});
