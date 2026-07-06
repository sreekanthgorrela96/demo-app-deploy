const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createServer } = require("../src/server");

function request(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    http
      .get({ hostname: "127.0.0.1", port, path }, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

test("GET /health returns 200", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  const response = await request(server, "/health");
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), { status: "ok" });

  server.close();
});

test("GET /version returns version payload", async () => {
  process.env.APP_VERSION = "1.0.0-test";
  process.env.ENVIRONMENT = "test";

  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  const response = await request(server, "/version");
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    version: "1.0.0-test",
    environment: "test",
  });

  server.close();
});

test("GET / returns HTML gallery page", async () => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));

  const response = await request(server, "/");
  assert.equal(response.status, 200);
  assert.match(response.body, /Cloud Native Demo Gallery/);
  assert.match(response.body, /images\/pipeline\.svg/);

  server.close();
});
