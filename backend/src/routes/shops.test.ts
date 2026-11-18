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
