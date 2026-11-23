import test from "node:test";
import assert from "node:assert/strict";
import { fixtureOrigin } from "../../test/fixtures/cache-releases.mjs";
import { currentKnowledge } from "../../scripts/read-current-knowledge.mjs";
import { serveLocal } from "../local.mjs";

const version = "2026-07-28";
async function rpc(url, method, params, extra = {}) {
  const headers = { "content-type": "application/json", accept: "application/json, text/event-stream",
    "mcp-protocol-version": version, "mcp-method": method, ...extra };
  if (method === "tools/call") headers["mcp-name"] = params.name;
  const _meta = { "io.modelcontextprotocol/protocolVersion": version,
    "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": { name: "qualification", version: "1" } };
  const response = await fetch(url, { method: "POST", headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: { ...params, _meta } }) });
  assert.equal(response.headers.get("cache-control"), "no-store");
  return { status: response.status, body: await response.json() };
}

async function setup(t) {
  const fixture = await fixtureOrigin();
  let now = "2031-01-01T00:00:00Z";
  const reader = currentKnowledge(fixture.url, { now: () => new Date(now) });
  const server = await serveLocal(reader);
  t.after(async () => { await server.close(); await fixture.close(); });
  async function call(name, args) {
    const { status, body } = await rpc(server.url, "tools/call", { name, arguments: args });
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(body.result, JSON.stringify(body));
    return body.result;
  }
  return { fixture, url: server.url, call, setClock: instant => { now = instant; } };
}

test("per-request discovery, listing, input boundaries, host/origin and transport checks", async t => {
  const { url, fixture } = await setup(t);
  const discovery = await rpc(url, "server/discover", {});
  assert.equal(discovery.status, 200, JSON.stringify(discovery.body));
  assert.ok(discovery.body.result.supportedVersions.includes(version));
  const { body } = await rpc(url, "tools/list", {});
  assert.deepEqual(body.result.tools.map(tool => tool.name).sort(), ["compare_requirements","fetch","related_capabilities","search"]);
  assert.ok(body.result.tools.every(tool => tool.annotations.readOnlyHint && !tool.annotations.destructiveHint));
  assert.equal((await rpc(url, "server/discover", {}, { origin: "https://example.org" })).status, 403);
  assert.equal((await rpc(url, "server/discover", {}, { "mcp-method": "ping" })).body.error.code, -32020);
  assert.equal((await fetch(url)).status, 405);
  for (const [name, args] of [["fetch",{ id:"../x" }],["search",{ query:"a".repeat(241) }],
    ["compare_requirements",{ requirements:Array(9).fill("cash") }],["fetch",{ id:"cash-checkout", url:"https://example.org/" }],
    ["related_capabilities",{ id:"cash-checkout", relation:"merchant_of" }],["unknown",{}]]) {
    const { body: message } = await rpc(url, "tools/call", { name, arguments:args });
    assert.ok(message.error || message.result?.isError, JSON.stringify(message));
  }
  assert.equal((await rpc(url, "tools/call", { name:"search", arguments:{ query:"X".repeat(9000) } })).status, 413);
  assert.equal(fixture.requests.length, 0);
});

test("seven scoped records, citations, ranking, compound requirements and one-hop edges", async t => {
  const { fixture, call } = await setup(t);
  for (const r of fixture.releases.A.current) {
    const result = await call("fetch", { id:r.slug });
    const data = result.structuredContent;
    assert.deepEqual(JSON.parse(result.content[0].text), data);
    assert.equal(data.releaseId, fixture.releases.A.manifest.releaseId);
    assert.equal(data.revision, r.review.revision);
    assert.equal(data.text,r.answer);
    assert.equal(data.scope,r.scope);
    assert.equal(data.lifecycle,"unverified");
    assert.equal(data.availabilityStatus,"unverified");
    assert.deepEqual(data.citations,r.citations);
    assert.doesNotMatch(JSON.stringify(data), /file:|Graphify|Okcleaners|operator_harness|127\.0\.0\.1/i);
  }
  const question = "Does selling an oat bar change stock at another store?";
  const hits = (await call("search",{query:question})).structuredContent;
  assert.equal(hits.matchType,"related");
  assert.equal(hits.results[0].id,"location-stock");
  assert.equal((await call("search",{query:"automatic refunds"})).structuredContent.results.length,0);
  assert.equal((await call("compare_requirements",{requirements:["open the till 日本語"]})).structuredContent.assessments[0].outcome,"unverified");
  const compound = "open the till and accept offline refunds";
  const a = (await call("compare_requirements",{requirements:[question,compound,"Can I take cards offline?"]})).structuredContent.assessments;
  assert.deepEqual(a.map(row=>row.outcome),["synthetic_demo_only","unverified","unverified"]);
  assert.deepEqual(a[1].clauses.map(row=>row.outcome),["synthetic_demo_only","unverified"]);
  assert.equal(a[2].evidence.id,"offline-card");
  assert.equal(a[0].evidence.citations.at(-1).url.endsWith("#walkthrough-follow-the-sale"),true);
  assert.deepEqual((await call("related_capabilities",{id:"location-stock",relation:"demonstrated_in"})).structuredContent.edges,
    fixture.releases.A.graph.edges.filter(e=>e.from==="location-stock"));
  assert.deepEqual((await call("related_capabilities",{id:"offline-card"})).structuredContent.edges,[]);
  assert.ok((await call("fetch",{id:"unknown-id"})).isError);
});

test("tool calls revalidate on promotion, mixed bytes, withdrawal, rollback, expiry and outage", async t => {
  const { fixture, call, setClock } = await setup(t);
  const get = id => call("fetch",{id});
  const a = (await get("location-stock")).structuredContent;
  fixture.promote("B");
  fixture.overrides.set("/agents/graph.json",fixture.resources.A.get("/agents/graph.json"));
  const failed = await get("location-stock");
  assert.ok(failed.isError);
  assert.equal(failed.structuredContent,undefined);
  fixture.overrides.clear();
  const b = (await get("location-stock")).structuredContent;
  assert.notEqual(b.releaseId,a.releaseId);
  assert.equal(b.revision,a.revision+1);
  assert.match(b.text,/Synthetic correction/);
  fixture.promote("C");
  assert.ok((await get("cash-checkout")).isError);
  assert.ok((await call("related_capabilities",{id:"cash-checkout"})).isError);
  assert.ok(!(await call("search",{query:"cash checkout"})).structuredContent.results.some(r=>r.id==="cash-checkout"));
  assert.equal((await call("compare_requirements",{requirements:["cash checkout"]})).structuredContent.assessments[0].outcome,"unverified");
  fixture.promote("A");
  assert.ok((await get("cash-checkout")).isError);
  fixture.promote("C");
  setClock("2031-01-03T23:59:59Z");
  assert.ok((await get("open-register")).structuredContent);
  setClock("2031-01-04T00:00:00Z");
  assert.ok((await get("open-register")).isError);
  assert.ok((await call("related_capabilities",{id:"open-register"})).isError);
  fixture.overrides.set("/agents/manifest.json",null);
  for (const [name,args] of [["fetch",{id:"location-stock"}],["search",{query:"stock"}],
    ["compare_requirements",{requirements:["stock"]}],["related_capabilities",{id:"location-stock"}]]) {
    const result = await call(name,args);
    assert.ok(result.isError);
    assert.equal(result.structuredContent,undefined);
  }
});

test("synthetic policy controls require explicit reviewed wording for a product determination", async t => {
  const fixture = await fixtureOrigin();
  t.after(() => fixture.close());
  const record = structuredClone(fixture.releases.A.current.find(r => r.slug === "offline-card"));
  const server = await serveLocal({ read: async () => ({ releaseId: "fixture", records: [record], edges: [] }) });
  t.after(() => server.close());
  async function assess() {
    const { body } = await rpc(server.url, "tools/call", { name: "compare_requirements", arguments: { requirements: [record.title] } });
    return body.result.structuredContent.assessments[0];
  }
  record.lifecycle = "implemented";
  assert.equal((await assess()).outcome, "unverified");
  record.answer = "Supported within the documented scope: synthetic qualification example.";
  const supported = await assess();
  assert.equal(supported.outcome, "supported_within_documented_scope");
  assert.equal(supported.evidence.availabilityStatus, "unverified");
  record.answer = "Explicitly excluded: synthetic qualification example.";
  assert.equal((await assess()).outcome, "explicitly_excluded");
  record.answer = "X".repeat(25 * 1024);
  const { body } = await rpc(server.url, "tools/call", { name: "fetch", arguments: { id: record.slug } });
  assert.ok(body.result.isError);
  assert.equal(body.result.structuredContent, undefined);
});
