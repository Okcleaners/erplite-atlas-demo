import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import test from "node:test";
import { fixtureOrigin } from "../../test/fixtures/cache-releases.mjs";
import { checkpointKey } from "../worker/checkpoint.mjs";
import { promote } from "./promote.mjs";
import { localRelease, runtime } from "./runtime.mjs";

async function freePort() {
  const socket = createServer();
  await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}
const protocol = "2026-07-28";
function call(worker, name, args, headers = {}) {
  return fetch(worker + "/mcp", { method: "POST", headers: {
    "accept-encoding": "gzip", "content-type": "application/json", accept: "application/json, text/event-stream",
    "mcp-protocol-version": protocol, "mcp-method": "tools/call", "mcp-name": name, ...headers
  }, body: JSON.stringify({ jsonrpc: "2.0", method: "tools/call", id: 1, params: {
    name, arguments: args, _meta: { "io.modelcontextprotocol/protocolVersion": protocol,
      "io.modelcontextprotocol/clientCapabilities": {} }
  } }) });
}

async function result(worker, name, args, headers) {
  const response = await call(worker, name, args, headers);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  return (await response.json()).result;
}
async function rejected(promise) {
  const value = await promise;
  assert.ok(value.isError, JSON.stringify(value));
  assert.equal(value.structuredContent, undefined);
}

test("two workerd instances validate independently through corrections, withdrawal, races and cold restarts", {timeout:90000}, async t => {
  const fixture = await fixtureOrigin();
  const storage = await mkdtemp(join(tmpdir(), "atlas-worker-"));
  let deployment, first, second, hook;
  const upstream = localRelease(fixture.url);
  const ids = Object.fromEntries(Object.entries(fixture.releases).map(([key,r])=>[key,r.manifest.releaseId]));
  async function restart(clock) {
    await deployment?.mf.dispose();
    const port = await freePort();
    first = "http://127.0.0.1:" + port;
    second = "http://localhost:" + port;
    deployment = await runtime({ origin:first, port, instanceOrigins:[first,second], storage, clock, publicKnowledge: async request => {
      if (hook) await hook(request);
      return upstream(request);
    } });
  }
  t.after(async () => {
    await deployment?.mf.dispose();
    await fixture.close();
    await rm(storage,{recursive:true,force:true});
  });
  await restart("2031-01-03T23:59:59Z");
  const get = (worker,id="location-stock") => result(worker,"fetch",{id});
  await rejected(get(first)); // Empty authority on a fresh instance.
  const genesis = { generation:0, releaseId:null };
  const attempts = await Promise.allSettled([promote(deployment.bucket,genesis,ids.A),promote(deployment.bucket,genesis,ids.A)]);
  assert.equal(attempts.filter(x=>x.status==="fulfilled").length,1);
  const a = attempts.find(x=>x.status==="fulfilled").value;
  for (const response of await Promise.all([get(first),get(second)])) {
    assert.equal(response.structuredContent.releaseId,ids.A,JSON.stringify(response));
    assert.equal(response.structuredContent.availabilityStatus,"unverified");
    assert.ok(response.structuredContent.citations.length);
  }
  for (const record of fixture.releases.A.current) {
    const data = (await get(first,record.slug)).structuredContent;
    assert.equal(data.revision, record.review.revision);
    assert.equal(data.text, record.answer);
    assert.deepEqual(data.citations, record.citations);
    assert.equal(data.claimScope, record.claimScope);
    assert.equal(data.lifecycle, record.lifecycle);
  }
  assert.ok(fixture.requests.some(r=>r.path==="/agents/manifest.json" && r.status===304 && r.conditional));

  // Advance the trusted head after the first check while immutable A bytes remain at the origin.
  let b;
  hook = async request => {
    if (new URL(request.url).pathname === "/agents/graph.json") {
      hook = undefined;
      b = await promote(deployment.bucket,a,ids.B);
    }
  };
  await rejected(get(first));
  await rejected(get(second));
  fixture.promote("B");
  fixture.overrides.set("/agents/graph.json",fixture.resources.A.get("/agents/graph.json"));
  await rejected(get(first));
  fixture.overrides.clear();
  assert.match((await get(second)).structuredContent.text,/Synthetic correction/);
  fixture.promoteAfter("/agents/graph.json","C");
  await rejected(get(first)); // Pointer changes during artifact acquisition.
  const c = await promote(deployment.bucket,b,ids.C);
  for (const w of [first,second]) {
    await rejected(get(w,"cash-checkout"));
    await rejected(result(w,"related_capabilities",{id:"cash-checkout"}));
    assert.ok(!(await result(w,"search",{query:"cash checkout"})).structuredContent.results.some(r=>r.id==="cash-checkout"));
    assert.equal((await result(w,"compare_requirements",{requirements:["cash checkout"]})).structuredContent.assessments[0].outcome,"unverified");
    assert.ok((await get(w,"open-register")).structuredContent);
  }
  const midnight = { "x-fixture-clock": "2031-01-04T00:00:00Z" };
  await rejected(result(first,"fetch",{id:"open-register"},midnight));
  await rejected(result(second,"related_capabilities",{id:"open-register"},midnight));
  assert.equal((await result(first,"compare_requirements",{requirements:["open the till"]},midnight))
    .structuredContent.assessments[0].outcome,"unverified");
  await assert.rejects(promote(deployment.bucket,c,ids.A),/retired release/);
  await assert.rejects(promote(deployment.bucket,a,ids.D),/predecessor/);
  fixture.promote("A");
  await restart("2031-01-04T00:00:00Z");
  await Promise.all([rejected(get(first)),rejected(get(second))]);
  fixture.promote("C");
  await rejected(get(first,"open-register")); // Same C bytes and ETag across midnight.
  await rejected(result(second,"related_capabilities",{id:"open-register"}));
  fixture.overrides.set("/agents/manifest.json",null);
  await rejected(get(first));
  fixture.overrides.clear();
  assert.equal((await get(first)).structuredContent.releaseId,ids.C);

  // Fault injection in the disposable trusted store, inaccessible to MCP callers.
  await deployment.bucket.put(checkpointKey(4),"{}");
  await rejected(get(first));
  await rejected(get(second));
  await deployment.bucket.delete(checkpointKey(4));
  assert.equal((await get(second)).structuredContent.releaseId,ids.C);
  console.log("A/B/C promotion, release and checkpoint races, outage recovery, rollback after restart and UTC expiry passed");

  // Hold sixteen independent reads at the origin and test admission on a second isolate.
  const entered = Promise.withResolvers();
  const release = Promise.withResolvers();
  let waiting = 0;
  hook = async request => {
    if (new URL(request.url).pathname==="/agents/manifest.json" && !request.headers.has("if-none-match")) {
      if (++waiting === 16) entered.resolve();
      await release.promise;
    }
  };
  const held = Array.from({length:16},()=>get(first));
  try {
    await Promise.race([entered.promise, new Promise((_, reject)=>{const timer=setTimeout(()=>reject(new Error("Concurrent reads did not arrive")),8000);timer.unref();})]);
    const overflow = await call(first,"fetch",{id:"location-stock"});
    assert.equal(overflow.status,429);
    assert.equal(overflow.headers.get("cache-control"),"no-store");
    hook = undefined;
    assert.equal((await get(second)).structuredContent.releaseId,ids.C);
  } finally { hook = undefined; release.resolve(); }
  assert.ok((await Promise.all(held)).every(r=>r.structuredContent.releaseId===ids.C));
  const before = fixture.requests.length;
  for (let i=0;i<3;i++) {
    const response = await fetch(first + "/mcp",{method:"POST",headers:{"content-type":"application/json"},body:"{"});
    assert.equal(response.status,400);
    assert.equal(response.headers.get("cache-control"),"no-store");
  }
  assert.equal((await call(first,"search",{query:"x".repeat(9000)})).status,413);
  assert.equal((await fetch(first + "/agents/capabilities.json")).status,404);
  assert.equal((await call(first,"fetch",{id:"cash-checkout"},{origin:"https://example.org"})).status,403);
  assert.equal(fixture.requests.length,before);
  const stalled = Promise.withResolvers();
  const safetyTimer = setTimeout(() => stalled.resolve(), 15000);
  hook = () => stalled.promise;
  try {
    const start = performance.now();
    await rejected(get(first));
    assert.ok(performance.now() - start < 14000,"stalled acquisition exceeded its deadline");
  } finally {
    hook = undefined;
    clearTimeout(safetyTimer);
    stalled.resolve();
  }
  assert.equal((await get(first)).structuredContent.releaseId,ids.C);
});
