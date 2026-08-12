const path = require("path");
const { requireAdmin, sendJson } = require("../_auth");
const { readBinary, writeBinary } = require("../_storage");

function safeUploadName(value) {
  const extension = path.extname(String(value || "")).toLowerCase() || ".jpg";
  const base = path
    .basename(String(value || "upload"), extension)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${base || "upload"}-${Date.now()}${extension}`;
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;

      if (size > 8 * 1024 * 1024) {
        reject(new Error("Afbeelding is te groot."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function safeBlobPath(value) {
  const raw = String(value || "").trim();
  const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
  const clean = decoded.replace(/^\/+/, "");

  if (!/^uploads\/[a-z0-9][a-z0-9._-]*$/i.test(clean)) {
    return "";
  }

  return clean;
}

module.exports = async function handler(request, response) {
  if (request.method === "GET") {
    try {
      const requestUrl = new URL(request.url, "http://localhost");
      const blobPath = safeBlobPath(requestUrl.searchParams.get("path"));

      if (!blobPath) {
        sendJson(response, 400, { error: "Ongeldig afbeeldingspad." });
        return;
      }

      const blob = await readBinary(blobPath);

      if (!blob) {
        sendJson(response, 404, { error: "Afbeelding niet gevonden." });
        return;
      }

      response.statusCode = 200;
      response.setHeader("Content-Type", blob.metadata.contentType || "application/octet-stream");
      response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      response.end(blob.buffer);
    } catch (error) {
      sendJson(response, 404, { error: error.message || "Afbeelding niet gevonden." });
    }

    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Methode niet toegestaan." });
    return;
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    const payload = JSON.parse(await collectRequestBody(request));
    const match = String(payload.data || "").match(/^data:([^;]+);base64,(.+)$/);

    if (!match || !/^image\//.test(match[1])) {
      sendJson(response, 400, { error: "Upload een geldige afbeelding." });
      return;
    }

    const filename = safeUploadName(payload.filename);
    const buffer = Buffer.from(match[2], "base64");
    const blobPath = `uploads/${filename}`;
    await writeBinary(blobPath, buffer, { contentType: match[1] });

    sendJson(response, 201, { path: blobPath, url: `/api/uploads?path=${encodeURIComponent(blobPath)}` });
  } catch (error) {
    sendJson(response, 400, { error: error.message || "Upload mislukt." });
  }
};
