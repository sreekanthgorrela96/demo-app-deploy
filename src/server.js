const http = require("http");

const PORT = process.env.PORT || 8080;
const APP_VERSION = process.env.APP_VERSION || "dev";
const ENVIRONMENT = process.env.ENVIRONMENT || "dev";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

function log(level, message) {
  if (level === "debug" && LOG_LEVEL !== "debug") {
    return;
  }
  console.log(JSON.stringify({ level, message, ts: new Date().toISOString() }));
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (req.url === "/version") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          version: APP_VERSION,
          environment: ENVIRONMENT,
        })
      );
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    log("info", `demo-app listening on port ${PORT}`);
  });
}

module.exports = { createServer };
