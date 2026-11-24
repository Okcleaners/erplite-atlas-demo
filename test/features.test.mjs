import test from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {gzipSync} from "node:zlib";
import {makeIndex,search} from "../public/finder/search.js";
import {validateCatalog} from "../scripts/validate-catalog.mjs";
import atlas from "../atlas-data.json" with { type: "json" };
const read = path => readFile(new URL("../dist/" + path,import.meta.url),"utf8");
const catalog = JSON.parse(await read("finder/catalog.v1.json"));
const records = validateCatalog(catalog);
const index = makeIndex(records);
test("all reviewed titles, aliases and complete questions resolve to their own entry", () => {
  for(const record of records) for(const q of [record.title,...record.aliases,...record.questions]){
    const result=search(index,q);
    assert.equal(result.records[0].slug,record.slug,q);
    assert.equal(result.answer.slug,record.slug,q);
  }
});
test("every product-map module has its own searchable merchant record", () => {
  const expected = {
    "sales-register": "point-of-sale", "customer-crm": "crm", inventory: "inventory",
    "payments-recovery": "payments-recovery", reporting: "reporting", "business-operations": "business-operations",
    "ai-assistant": "guidance-assistant", "content-studio-social-observer": "content-studio",
    integrations: "integrations", "backup-replay": "backup-replay"
  };
  assert.deepEqual(atlas.modules.map(module=>module.id).sort(),Object.keys(expected).sort());
  for (const module of atlas.modules) {
    const slug = expected[module.id];
    assert.equal(search(index,module.name).answer?.slug,slug,module.name);
    assert.equal(search(index,module.name).records[0]?.slug,slug,module.name);
  }
  for (const [query, slug] of [
    ["CRM","crm"], ["customer relationship management","crm"], ["customer profiles","crm"],
    ["point of sale","point-of-sale"], ["cash register","point-of-sale"], ["stock control","inventory"],
    ["multiple stores","multi-location"], ["staff permissions","employee-management"],
    ["Atlas Assistant","guidance-assistant"], ["ERP","erp-lite"], ["business analytics","reporting"],
    ["PO","purchasing-suppliers"], ["appointment scheduling","appointments-service-history"]
  ]) {
    assert.equal(search(index,query).answer?.slug,slug,query);
  }
});
test("cash, stock, unrelated words and consequential qualifiers stay distinct", () => {
  assert.equal(search(index,"Would selling an oat bar affect inventory at a different location?").answer.slug,"location-stock");
  for(const q of ["automatic inventory refund","cash checkout offline","does Hill automatically refund cash?","cash checkout with a loyalty discount","transfer stock to other locations","Can you post this to my ledger?","Is cash checkout included in my plan?",
    "Can I use CRM and transfer stock between stores?", "CRM 日本語", "CRM +", "POS =",
    "Will CRM send an automatic text follow-up?", "Does the POS accept gift cards during an outage?",
    "Can I schedule staff and run payroll?", "Can I sync my reports and take card payments across locations?"]){
    assert.equal(search(index,q).answer,null,q);
  }
  assert.ok(search(index,"cash checkout offline").records.every(r=>r.slug==="offline-card"));
  assert.ok(search(index,"drawer").records.length>1);
  assert.equal(search(index,"drawer").answer,null);
  assert.equal(search(index,"xyz123").records.length,0);
  assert.deepEqual(search(index,"","Payments").records.map(r=>r.slug).sort(),
    ["cash-checkout","offline-card","payments-recovery","refunds-voids"]);
  assert.equal(search(index,"","","implemented").records.length,0);
});
test("public export shape rejects private extensions, non-public links, unknown lifecycle and duplicate ids", () => {
  for(const change of [r=>r.privateSource="internal",r=>r.sources[0].href="https://example.invalid/private",r=>r.lifecycle="shipped",r=>delete r.review]){
    const copy=structuredClone(catalog);change(copy.records[0]);assert.throws(()=>validateCatalog(copy));
  }
  assert.throws(()=>validateCatalog({...catalog,records:[records[0],records[0]]}));
  assert.equal(records.length,30);
  assert.ok(records.every(r=>r.availability && r.scope && r.limitation));
  assert.deepEqual(records.filter(r=>r.lifecycle==="planned").map(r=>r.slug),["guidance-assistant"]);
  assert.equal(records.filter(r=>r.demo).length,9);
});
test("all detail pages, citations and walkthrough targets exist as static HTML",async()=>{
  for(const r of records){
    const html=await read("features/"+r.slug+"/index.html");
    for(const text of [r.answer,r.scope,r.availability,r.lifecycle]) assert.ok(html.includes(text.replaceAll("&","&amp;")),r.slug);
    assert.ok(html.includes('rel="canonical" href="https://www.atlasade.com/features/'+r.slug+'/'));
    for(const {href} of [...r.sources,...(r.demo?[r.demo]:[])]){
      const [path,id]=href.split("#");
      assert.ok((await read(path.slice(1)+"index.html")).includes('id="'+id+'"'),href);
    }
  }
});
test("compiled public artifacts exclude internal references, source maps and private data paths",async()=>{
  async function audit(path=""){
    for(const entry of await readdir(new URL("../dist/"+path,import.meta.url),{withFileTypes:true})){
      const name=path+entry.name;
      assert.doesNotMatch(name,/(?:\.map$|\.env|\.git|\.rs$|source-inventory|private-review)/i);
      if(entry.isDirectory()) await audit(name+"/");
      else if(/\.(?:html|js|json|css|txt|xml)$/.test(name)){
        assert.doesNotMatch(await read(name),/Okcleaners\/pos-mac|rust_core[\\/]|operator_harness[\\/]|docs[\\/]graphify|C:[\\/]Users[\\/]Brain|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/i,name);
      }
    }
  }
  await audit();
});
test("search module, UI and embedded catalog stay within the compressed budget",async()=>{
  const directory=await read("features/index.html");
  const data=directory.match(/<script id="catalog" type="application\/json">([\s\S]*?)<\/script>/)[1];
  const bytes=[await read("finder/search.js"),await read("finder/ui.js"),data].reduce((n,s)=>n+gzipSync(s).length,0);
  console.log("Finder scripts and index:",bytes,"bytes gzip");
  assert.ok(bytes<25000);
});
