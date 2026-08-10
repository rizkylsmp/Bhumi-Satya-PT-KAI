import assert from "node:assert/strict";
import test from "node:test";
import {
  documentationMediaMetadata,
  safeDocumentationName,
  validateDocumentationContent,
} from "./buildingDocumentation.js";

test("menerima metadata foto dan video dokumentasi yang didukung", () => {
  assert.deepEqual(
    documentationMediaMetadata({ originalname: "kondisi.JPG", mimetype: "image/jpeg" }),
    { type: "photo", mime: "image/jpeg" },
  );
  assert.deepEqual(
    documentationMediaMetadata({ originalname: "inspeksi.mp4", mimetype: "video/mp4" }),
    { type: "video", mime: "video/mp4" },
  );
});

test("memvalidasi signature foto dan video", () => {
  assert.equal(validateDocumentationContent({
    originalname: "foto.jpg",
    mimetype: "image/jpeg",
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  }).type, "photo");
  assert.equal(validateDocumentationContent({
    originalname: "video.mp4",
    mimetype: "video/mp4",
    buffer: Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]),
  }).type, "video");
});

test("menolak ekstensi berbahaya dan isi yang tidak cocok", () => {
  assert.equal(documentationMediaMetadata({ originalname: "foto.jpg.exe", mimetype: "image/jpeg" }), null);
  assert.throws(() => validateDocumentationContent({
    originalname: "foto.png",
    mimetype: "image/png",
    buffer: Buffer.from("bukan gambar"),
  }), /Isi file/);
  assert.equal(safeDocumentationName("../foto kondisi.jpg"), "foto_kondisi.jpg");
});
