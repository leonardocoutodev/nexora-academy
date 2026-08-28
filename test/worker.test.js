import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const env={ASSETS:{fetch:async request=>new Response(`asset:${new URL(request.url).pathname}`,{headers:{"content-type":"text/plain"}})}};

test("health endpoint returns service status",async()=>{
  const response=await worker.fetch(new Request("https://lc.test/api/health"),env,{});
  assert.equal(response.status,200);
  assert.deepEqual((await response.json()).ok,true);
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
});

test("protected endpoint rejects missing bearer token",async()=>{
  const response=await worker.fetch(new Request("https://lc.test/api/lc/me"),env,{});
  assert.equal(response.status,401);
});

test("static responses receive security and cache headers",async()=>{
  const response=await worker.fetch(new Request("https://lc.test/pages/login.html"),env,{});
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store, max-age=0, must-revalidate");
  assert.equal(response.headers.get("x-content-type-options"),"nosniff");
});
