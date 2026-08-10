import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeModelLod } from "./assetModel3d.controller.js";

describe("asset model 3D upload defaults", () => {
  it("uses the internal default when an upload does not include an LOD", () => {
    assert.equal(normalizeModelLod(undefined), "LOD1");
    assert.equal(normalizeModelLod(null), "LOD1");
    assert.equal(normalizeModelLod("   "), "LOD1");
  });

  it("keeps validating legacy uploads that explicitly include an LOD", () => {
    assert.equal(normalizeModelLod("lod2"), "LOD2");
    assert.throws(
      () => normalizeModelLod("unknown"),
      /Level of Detail model tidak valid/,
    );
  });
});
