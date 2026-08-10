import path from "node:path";

const MEDIA_BY_EXTENSION = {
  ".gif": { type: "photo", mime: "image/gif" },
  ".jpeg": { type: "photo", mime: "image/jpeg" },
  ".jpg": { type: "photo", mime: "image/jpeg" },
  ".png": { type: "photo", mime: "image/png" },
  ".webp": { type: "photo", mime: "image/webp" },
  ".mp4": { type: "video", mime: "video/mp4" },
  ".mov": { type: "video", mime: "video/quicktime" },
  ".webm": { type: "video", mime: "video/webm" },
};

const OCTET_STREAM = "application/octet-stream";

export const documentationMediaMetadata = (file = {}) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const media = MEDIA_BY_EXTENSION[extension];
  const mime = String(file.mimetype || "").toLowerCase();
  if (!media || ![media.mime, OCTET_STREAM].includes(mime)) return null;
  return media;
};

export const validateDocumentationContent = (file = {}) => {
  const media = documentationMediaMetadata(file);
  const buffer = file.buffer;
  if (!media || !Buffer.isBuffer(buffer)) {
    throw new Error("File dokumentasi tidak valid");
  }

  const header = buffer.subarray(0, 16);
  const ascii = header.toString("ascii");
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isGif = ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a");
  const isWebp = ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
  const isMp4OrMov = ascii.slice(4, 8) === "ftyp";
  const isWebm = header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const valid = {
    ".jpg": isJpeg,
    ".jpeg": isJpeg,
    ".png": isPng,
    ".gif": isGif,
    ".webp": isWebp,
    ".mp4": isMp4OrMov,
    ".mov": isMp4OrMov,
    ".webm": isWebm,
  }[path.extname(file.originalname || "").toLowerCase()];

  if (!valid) throw new Error("Isi file tidak sesuai dengan format foto atau video");
  return media;
};

export const safeDocumentationName = (value = "") =>
  path.basename(value).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-180) || "media";
