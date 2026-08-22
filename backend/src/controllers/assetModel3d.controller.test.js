import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeModelLod } from "./assetModel3d.controller.js";

describe("asset model 3D upload defaults", () => {
  it("uses one internal compatibility value for every upload", () => {
    assert.equal(normalizeModelLod(undefined), "LOD1");
    assert.equal(normalizeModelLod(null), "LOD1");
    assert.equal(normalizeModelLod("   "), "LOD1");
    assert.equal(normalizeModelLod("LOD2"), "LOD1");
  });
});
