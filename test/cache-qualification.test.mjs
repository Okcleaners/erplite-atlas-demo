import test from "node:test";
import assert from "node:assert/strict";
import { fixtureOrigin } from "./fixtures/cache-releases.mjs";
import { currentKnowledge } from "../scripts/read-current-knowledge.mjs";
import { makeIndex,search } from "../public/finder/search.js";
import { sha256 } from "../scripts/knowledge-release.mjs";

const pointer="/agents/manifest.json", cap="/agents/capabilities.json", graph="/agents/graph.json", v1="/finder/catalog.v1.json";
const answer=(view,query)=>search(makeIndex(view.records),query).answer;
const askStock="Does selling an oat bar change stock at another store?";
async function withFixture(run) {
  const f=await fixtureOrigin();
  try { await run(f); } finally { await f.close(); }
}
test("A → B → C: warm release, record, graph and legacy clients revalidate across two promotions",()=>withFixture(async f=>{
  const reader=currentKnowledge(f.url,{now:()=>new Date("2031-01-03T12:00:00Z")});
  const old=await reader.read();
  const savedRecord=answer(old,askStock);
  assert.match(savedRecord.answer,/Hill stays at 9/);
  assert.ok(old.edges.some(e=>e.from==="cash-checkout"));
  const entries=[pointer,cap,graph,v1,"/features/","/features/location-stock/","/features/cash-checkout/","/agents/"];
  const cache=new Map();
  async function request(path) {
    const prior=cache.get(path);
    const res=await fetch(f.url+path,{headers:prior?{"If-None-Match":prior.etag}:{}});
    if(res.status===200) cache.set(path,{etag:res.headers.get("etag"),body:await res.text()});
    else assert.equal(res.status,304);
    assert.equal(res.headers.get("cache-control"),"public, no-cache, must-revalidate");
    return res.status;
  }
  for(const p of entries) {assert.equal(await request(p),200);assert.equal(await request(p),304);}
  const oldLegacy=JSON.parse(cache.get(v1).body);
  f.promote("B");
  for(const p of entries) assert.equal(await request(p),200,p);
  const corrected=await reader.read();
  assert.notEqual(old.releaseId,corrected.releaseId);
  assert.equal(answer(corrected,askStock).review.revision,2);
  assert.notEqual(savedRecord.answer,answer(corrected,askStock).answer);
  assert.match(cache.get("/features/location-stock/").body,/Corrects revision 1/);
  assert.match(cache.get("/features/").body,/Synthetic correction/);
  assert.match(cache.get("/agents/").body,new RegExp(corrected.releaseId));
  assert.match(JSON.parse(cache.get(v1).body).records.find(r=>r.slug==="location-stock").answer,/Synthetic correction/);
  f.promote("C");
  for(const p of entries) assert.equal(await request(p),200,p);
  const withdrawn=await reader.read();
  assert.notEqual(corrected.releaseId,withdrawn.releaseId);
  assert.equal(answer(withdrawn,"Cash checkout and change"),null);
  assert.ok(!withdrawn.edges.some(e=>e.from==="cash-checkout"));
  assert.ok(!JSON.parse(cache.get(v1).body).records.some(r=>r.slug==="cash-checkout"));
  assert.ok(oldLegacy.records.some(r=>r.slug==="cash-checkout")); // An offline download stays unchanged.
  assert.match(cache.get("/features/cash-checkout/").body,/has been withdrawn/);
  assert.match(cache.get("/features/cash-checkout/").body,/data-revision="2"/);
  assert.ok(!cache.get("/features/").body.includes('data-feature="cash-checkout"'));
  for(const p of entries) assert.equal(await request(p),304,p);
  f.promote("A");
  await assert.rejects(reader.read(),/superseded/);
  console.log("Warm client:",[old,corrected,withdrawn].map(v=>v.releaseId.slice(9,21)).join(" → "),"· cash-checkout edge removed");
}));
test("stale capabilities, stale graph, stale v1, wrong release metadata and unavailable pointer fail closed",()=>withFixture(async f=>{
  for(const path of [cap,graph,v1]){
    f.promote("A");
    const reader=currentKnowledge(f.url);
    await reader.read();
    f.promote("C");
    f.overrides.set(path,f.resources.A.get(path));
    await assert.rejects(reader.read(),/Digest mismatch/);
    f.overrides.clear();
    assert.equal((await reader.read()).releaseId,f.releases.C.manifest.releaseId);
  }
  const graphBytes=f.resources.B.get(graph);
  const mixed=structuredClone(f.releases.C.manifest);
  Object.assign(mixed.artifacts.find(a=>a.path===graph),{sha256:sha256(graphBytes),bytes:Buffer.byteLength(graphBytes)});
  f.overrides.set(pointer,JSON.stringify(mixed));f.overrides.set(graph,graphBytes);
  await assert.rejects(currentKnowledge(f.url).read(),/Mixed release metadata/);
  f.overrides.clear();
  const staleLegacy = f.resources.A.get(v1);
  const inconsistent = structuredClone(f.releases.C.manifest);
  Object.assign(inconsistent.artifacts.find(a=>a.path===v1),{sha256:sha256(staleLegacy),bytes:Buffer.byteLength(staleLegacy)});
  f.overrides.set(v1,staleLegacy);
  f.overrides.set(pointer,JSON.stringify(inconsistent));
  await assert.rejects(currentKnowledge(f.url).read(),/Release identity mismatch/);
  f.overrides.clear();
  const reader=currentKnowledge(f.url);
  await reader.read();
  f.promote("B"); // This reader first observed C and has never seen B.
  await assert.rejects(reader.read(),/Older issue date|Regressed capability/);
  f.promote("C");
  assert.equal((await reader.read()).releaseId,f.releases.C.manifest.releaseId);
  f.overrides.set(pointer,null);
  await assert.rejects(reader.read(),/manifest unavailable/);
}));
test("an in-flight release change is rejected and the next retrieval recovers",()=>withFixture(async f=>{
  f.promoteAfter(v1,"B");
  await assert.rejects(currentKnowledge(f.url).read(),/Manifest changed during retrieval/);
  f.promote("A");
  f.promoteAfter(cap,"C");
  const reader=currentKnowledge(f.url);
  await assert.rejects(reader.read(),/Digest mismatch|Manifest changed/);
  assert.equal((await reader.read()).releaseId,f.releases.C.manifest.releaseId);
  f.promote("A");
  const cold=currentKnowledge(f.url);
  f.promoteAfter(pointer,"B");
  await assert.rejects(cold.read(),/Digest mismatch|Manifest changed/);
}));
test("deadline suppresses answers and edges even with unchanged manifest and origin returning 304",()=>withFixture(async f=>{
  f.promote("C");
  let clock="2031-01-03T23:59:59.999Z";
  const reader=currentKnowledge(f.url,{now:()=>new Date(clock)});
  const before=await reader.read();
  assert.ok(before.records.some(r=>r.slug==="open-register"));
  assert.ok(before.edges.some(e=>e.from==="open-register"));
  assert.ok(!before.legacy.some(r=>r.slug==="open-register"));
  clock="2031-01-04T00:00:00Z";
  const after=await reader.read();
  assert.equal(after.releaseId,before.releaseId);
  assert.ok(!after.records.some(r=>r.slug==="open-register"));
  assert.ok(!after.edges.some(e=>e.from==="open-register"));
  assert.equal(f.requests.at(-1).status,304);
  const html=await (await fetch(f.url+"/features/open-register/")).text();
  assert.match(html,/2031-01-04 at 00:00 UTC/);
  assert.ok(!html.includes("Synthetic opening claim"));
  f.promote("D");
  const rebuilt=await reader.read();
  assert.notEqual(rebuilt.releaseId,after.releaseId);
  assert.match(await (await fetch(f.url+"/features/open-register/")).text(),/review has expired/);
}));
