const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function log(level, message) {
  if (level === "debug" && LOG_LEVEL !== "debug") {
    return;
  }
  console.log(JSON.stringify({ level, message, ts: new Date().toISOString() }));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function resolvePublicFile(urlPath) {
  const relative = urlPath === "/" ? "/index.html" : urlPath;
  const normalized = path.normalize(relative).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(PUBLIC_DIR, normalized);

  if (!fullPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return fullPath;
}

function serveStatic(urlPath, res) {
  const fullPath = resolvePublicFile(urlPath);

  if (!fullPath) {
    sendJson(res, 403, { error: "forbidden" });
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      log("error", `static file error: ${err.message}`);
      sendJson(res, 500, { error: "internal error" });
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function createServer() {
  const appVersion = process.env.APP_VERSION || "dev";
  const environment = process.env.ENVIRONMENT || "dev";

  return http.createServer((req, res) => {
    const urlPath = (req.url || "/").split("?")[0];

    if (urlPath === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    if (urlPath === "/version") {
      sendJson(res, 200, { version: appVersion, environment });
      return;
    }

    if (urlPath === "/" || urlPath.startsWith("/images/") || urlPath.endsWith(".css")) {
      serveStatic(urlPath, res);
      return;
    }

    sendJson(res, 404, { error: "not found" });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    log("info", `demo-app listening on port ${PORT}`);
  });
}

module.exports = { createServer, serveStatic, resolvePublicFile };
