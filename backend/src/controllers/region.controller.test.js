import assert from "node:assert/strict";
import test from "node:test";
import {
  getProvinceOptions,
  getRegencyOptions,
} from "./region.controller.js";

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  },
});

test("menyajikan 38 provinsi Indonesia", async () => {
  const res = createResponse();

  await getProvinceOptions({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(res.payload.data.length, 38);
  assert.ok(res.payload.data.some((item) => item.name === "PAPUA BARAT DAYA"));
});

test("memfilter kabupaten/kota berdasarkan kode provinsi", async () => {
  const res = createResponse();

  await getRegencyOptions({ params: { provinceCode: "13" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.ok(res.payload.data.some((item) => item.name === "KOTA PADANG"));
  assert.ok(res.payload.data.every((item) => item.id.startsWith("13.")));
});

test("menolak kode provinsi yang tidak valid", async () => {
  const res = createResponse();

  await getRegencyOptions({ params: { provinceCode: "13 OR 1=1" } }, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.success, false);
});
