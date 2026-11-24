import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getShopById, searchShops } from "./hotpepperService.js";
import { HotPepperServiceError } from "../types/hotpepper.js";
import type { ShopSearchQuery } from "../types/hotpepper.js";

const query: ShopSearchQuery = { lat: 35.66, lng: 139.7, range: 3, start: 1, count: 10 };
const shop = {
  id: "J000000001",
  name: "Nearby Cafe",
  address: "Tokyo",
  access: "Near the station",
  lat: 35.66,
  lng: 139.7,
};
const results = {
  api_version: "1.20",
  results_available: 1,
  results_returned: 1,
  results_start: 1,
};
const originalFetch = globalThis.fetch;
const originalApiKey = process.env.HOTPEPPER_API_KEY;
const originalTimeout = process.env.HOTPEPPER_API_TIMEOUT_MS;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.HOTPEPPER_API_KEY;
  else process.env.HOTPEPPER_API_KEY = originalApiKey;
  if (originalTimeout === undefined) delete process.env.HOTPEPPER_API_TIMEOUT_MS;
  else process.env.HOTPEPPER_API_TIMEOUT_MS = originalTimeout;
});

function mockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  process.env.HOTPEPPER_API_KEY = "test-key";
  globalThis.fetch = handler as typeof fetch;
}

function jsonResponse(payload: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

test("maps a successful search and pagination metadata", async () => {
  mockFetch(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("key"), "test-key");
    assert.equal(url.searchParams.get("lat"), "35.66");
    assert.equal(url.searchParams.get("lng"), "139.7");
    assert.equal(url.searchParams.get("range"), "3");
    assert.equal(url.searchParams.get("start"), "1");
    assert.equal(url.searchParams.get("count"), "10");
    assert.equal(url.searchParams.get("format"), "json");
    assert.equal(url.searchParams.has("type"), false);
    return jsonResponse({ results: { ...results, shop: [shop] } });
  });
  const response = await searchShops(query);
  assert.deepEqual(response.shops, [shop]);
  assert.deepEqual(response.pagination, { total: 1, returned: 1, start: 1, count: 10 });
});

test("accepts numeric results_returned", async () => {
  mockFetch(async () => jsonResponse({ results: { ...results, shop: [shop] } }));
  assert.equal((await searchShops(query)).pagination.returned, 1);
});

test("normalizes digit-string results_returned to a number", async () => {
  mockFetch(async () => jsonResponse({ results: { ...results, results_returned: "1", shop: [shop] } }));
  const returned = (await searchShops(query)).pagination.returned;
  assert.equal(returned, 1);
  assert.equal(typeof returned, "number");
});

test("accepts shop as a single object", async () => {
  mockFetch(async () => jsonResponse({ results: { ...results, shop } }));
  assert.deepEqual((await searchShops(query)).shops, [shop]);
});

test("accepts shop as an array", async () => {
  mockFetch(async () => jsonResponse({ results: { ...results, shop: [shop, { ...shop, id: "J000000002" }] } }));
  assert.equal((await searchShops(query)).shops.length, 2);
});

test("fails clearly when API key is missing without making a request", async () => {
  delete process.env.HOTPEPPER_API_KEY;
  globalThis.fetch = async () => { throw new Error("fetch must not be called"); };
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError
      && error.statusCode === 503
      && error.code === "HOTPEPPER_API_KEY_MISSING");
});

test("maps an upstream HTTP error to 502", async () => {
  mockFetch(async () => new Response("upstream failed", { status: 503 }));
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError && error.statusCode === 502 && error.code === "HOTPEPPER_HTTP_ERROR");
});

test("distinguishes an ordinary upstream network failure from a timeout", async () => {
  mockFetch(async () => { throw new TypeError("network unavailable"); });
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError
      && error.statusCode === 502
      && error.code === "HOTPEPPER_NETWORK_ERROR");
});

for (const [apiCode, status] of [[1000, 502], [2000, 502], [3000, 400]] as const) {
  test(`maps HotPepper error ${apiCode} to HTTP ${status}`, async () => {
    mockFetch(async () => jsonResponse({ results: { api_version: "1.20", error: { code: apiCode, message: "API error" } } }));
    await assert.rejects(searchShops(query), (error: unknown) =>
      error instanceof HotPepperServiceError
        && error.statusCode === status
        && error.code === `HOTPEPPER_API_${apiCode}`);
  });
}

test("rejects invalid JSON", async () => {
  mockFetch(async () => new Response("not json", { status: 200 }));
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError && error.message.includes("invalid JSON"));
});

for (const [name, payload] of [
  ["missing results", {}],
  ["invalid available count", { results: { ...results, results_available: "1", shop } }],
  ["invalid shop", { results: { ...results, shop: { ...shop, lat: "35.66" } } }],
] as const) {
  test(`rejects unexpected response structure: ${name}`, async () => {
    mockFetch(async () => jsonResponse(payload));
    await assert.rejects(searchShops(query), HotPepperServiceError);
  });
}

for (const invalidReturned of ["1x", "", " 1", "1.0", "NaN", "9007199254740992"] as const) {
  test(`rejects invalid results_returned value ${JSON.stringify(invalidReturned)}`, async () => {
    mockFetch(async () => jsonResponse({ results: { ...results, results_returned: invalidReturned, shop } }));
    await assert.rejects(searchShops(query), HotPepperServiceError);
  });
}

test("times out while waiting for response headers", async () => {
  process.env.HOTPEPPER_API_TIMEOUT_MS = "1000";
  mockFetch((_input, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError && error.statusCode === 504 && error.code === "HOTPEPPER_TIMEOUT");
});

test("times out while reading the response body", async () => {
  process.env.HOTPEPPER_API_TIMEOUT_MS = "1000";
  mockFetch(async (_input, init) => ({
    ok: true,
    status: 200,
    json: () => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }),
  } as Response));
  await assert.rejects(searchShops(query), (error: unknown) =>
    error instanceof HotPepperServiceError && error.statusCode === 504 && error.code === "HOTPEPPER_TIMEOUT");
});

test("loads full detail by ID without sending location and returns actual fields", async () => {
  mockFetch(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("id"), shop.id);
    assert.equal(url.searchParams.has("lat"), false);
    assert.equal(url.searchParams.has("type"), false);
    return jsonResponse({ results: { ...results, shop: { ...shop, open: "11:00-22:00", capacity: 30, extra: "not exposed" } } });
  });
  const detail = await getShopById(shop.id);
  assert.equal(detail?.open, "11:00-22:00");
  assert.equal(detail?.capacity, 30);
  assert.equal("extra" in detail!, false);
});
test("returns null when the detail API finds no matching shop", async () => {
  mockFetch(async () => jsonResponse({ results: { ...results, results_available: 0, results_returned: 0 } }));
  assert.equal(await getShopById(shop.id), null);
});
test("does not echo upstream error text containing credentials", async () => {
  mockFetch(async () => jsonResponse({ results: { api_version: "1.20", error: { code: 1000, message: "key=test-key" } } }));
  await assert.rejects(searchShops(query), (error: unknown) => error instanceof HotPepperServiceError && !error.message.includes("test-key"));
});
