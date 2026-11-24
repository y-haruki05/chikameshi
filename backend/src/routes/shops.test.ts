import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "../app.js";

const app = createApp();
let server: ReturnType<typeof app.listen>;
let baseUrl: string;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

for (const [name, query] of [
  ["latitude", "lat=91&lng=139"],
  ["longitude", "lat=35&lng=181"],
  ["range", "lat=35&lng=139&range=6"],
  ["start", "lat=35&lng=139&start=0"],
  ["count", "lat=35&lng=139&count=101"],
] as const) {
  test(`rejects invalid ${name}`, async () => {
    const response = await fetch(`${baseUrl}/api/shops?${query}`);
    assert.equal(response.status, 400);
  });
}

test("rejects non-integer pagination values", async () => {
  const response = await fetch(`${baseUrl}/api/shops?lat=35&lng=139&start=1.5&count=2.5`);
  assert.equal(response.status, 400);
});

const originalFetch = globalThis.fetch;
async function withUpstream(payload: unknown, run: () => Promise<void>) {
  const previousKey = process.env.HOTPEPPER_API_KEY;
  process.env.HOTPEPPER_API_KEY = "server-only-test-key";
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname === "webservice.recruit.co.jp") {
      assert.equal(url.searchParams.get("key"), "server-only-test-key");
      if (url.searchParams.has("lat")) {
        assert.equal(url.searchParams.get("range"), "2");
        assert.equal(url.searchParams.get("start"), "13");
        assert.equal(url.searchParams.get("count"), "12");
      } else { assert.equal(url.searchParams.get("id"), "J000000001"); }
      return new Response(JSON.stringify(payload), { status: 200 });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  try { await run(); } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.HOTPEPPER_API_KEY; else process.env.HOTPEPPER_API_KEY = previousKey;
  }
}
const shop = { id: "J000000001", name: "Actual shop", address: "Tokyo", access: "Station", lat: 35, lng: 139, open: "11:00-22:00" };
test("connects the HTTP search route to upstream and returns safe pagination", async () => {
  await withUpstream({ results: { api_version: "1.20", results_available: 25, results_returned: "1", results_start: 13, shop: [shop] } }, async () => {
    const response = await fetch(`${baseUrl}/api/shops?lat=35&lng=139&range=2&start=13&count=12`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.text();
    assert.equal(body.includes("server-only-test-key"), false);
    const parsed = JSON.parse(body);
    assert.equal(parsed.data.shops[0].name, "Actual shop");
    assert.deepEqual(parsed.data.pagination, { total: 25, returned: 1, start: 13, count: 12 });
  });
});
test("serves full shop detail over HTTP", async () => {
  await withUpstream({ results: { api_version: "1.20", results_available: 1, results_returned: 1, results_start: 1, shop } }, async () => {
    const response = await fetch(`${baseUrl}/api/shops/J000000001`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.open, "11:00-22:00");
  });
});
test("returns 404 for a missing shop", async () => {
  await withUpstream({ results: { api_version: "1.20", results_available: 0, results_returned: 0, results_start: 1 } }, async () => {
    const response = await fetch(`${baseUrl}/api/shops/J000000001`);
    assert.equal(response.status, 404);
  });
});
test("rejects an invalid shop ID without calling upstream", async () => {
  const response = await fetch(`${baseUrl}/api/shops/invalid`);
  assert.equal(response.status, 400);
});
