import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRelease, loadRelease, recordDigest, sha256 } from "../scripts/knowledge-release.mjs";
import { featureDocuments } from "../scripts/feature-pages.mjs";
import { agentGuide } from "../scripts/agent-guide.mjs";
import { writeKnowledge } from "../scripts/write-knowledge.mjs";
import { auditRelease } from "../scripts/audit-release.mjs";
import { makeIndex, search } from "../public/finder/search.js";
import { validateCatalog } from "../scripts/validate-catalog.mjs";

const read = async path => readFile(new URL("../" + path, import.meta.url), "utf8");
const source = JSON.parse(await read("knowledge/catalog.json"));
const approvals = JSON.parse(await read("knowledge/approved-revisions.json"));
const current = await loadRelease();
const question = "Does selling an oat bar change stock at another store?";
const date = "2026-12-01";
function revised(change, asOf = date) {
  const draft = structuredClone(source);
  const pins = structuredClone(approvals);
  const stock = draft.records.find(r => r.slug === "location-stock");
  draft.issuedOn = date;
  stock.review = { ...stock.review, revision: 2, checkedOn: date };
  stock.publication = { ...stock.publication, supersedes: 1, issuedOn: date, state: "corrected" };
  change(stock);
  pins[stock.slug].push(recordDigest(stock));
  return createRelease(draft, pins, asOf);
}
function browserIndex(docs) {
  return JSON.parse(docs.get("/features/").match(/<script id="catalog" type="application\/json">([\s\S]*?)<\/script>/)[1]);
}
test("compiled JSON, HTML, browser answers, citations and graph agree with the release", async () => {
  const { releaseId } = current.manifest;
  for (const dir of ["dist", "dist-preview"]) {
    await auditRelease(fileURLToPath(new URL("../" + dir + "/", import.meta.url)), current);
    const guide = await read(dir + "/agents/index.html");
    assert.ok(guide.includes(releaseId));
    const html = await read(dir + "/features/index.html");
    const records = browserIndex(new Map([["/features/",html]]));
    assert.deepEqual(records, current.current);
    const index = makeIndex(records);
    assert.deepEqual(JSON.parse(await read(dir+"/agents/capabilities.json")),current.capabilities);
    for (const r of current.current) {
      const page = await read(dir+"/features/"+r.slug+"/index.html");
      assert.ok(page.includes('data-release="'+releaseId+'" data-revision="'+r.review.revision+'"'));
      assert.ok(html.includes('data-feature="'+r.slug+'" data-revision="'+r.review.revision+'"'));
      assert.deepEqual(search(index,r.title).answer, r);
      assert.equal(r.availabilityStatus,"unverified");
      const edges = current.graph.edges.filter(e => e.from === r.slug);
      assert.equal(edges.length,r.demo ? 1 : 0);
      for (const e of edges) {
        assert.equal(current.graph.nodes.find(n=>n.id===e.from).revision,r.review.revision);
        assert.equal(current.graph.nodes.find(n=>n.id===e.to).url, e.citation);
        assert.ok(r.citations.some(c => c.url === e.citation));
      }
    }
    for (const f of current.manifest.artifacts)
      assert.equal(sha256(await read(dir+f.path)),f.sha256);
  }
});
test("correcting a claim changes the release, wording, citation view and revision together", async () => {
  const corrected = revised(r => { r.answer = "Synthetic corrected wording."; });
  assert.notEqual(corrected.manifest.releaseId,current.manifest.releaseId);
  const docs = await featureDocuments(corrected);
  const answer = search(makeIndex(browserIndex(docs)),question).answer;
  assert.equal(answer.answer,"Synthetic corrected wording.");
  assert.equal(answer.review.revision,2);
  assert.ok(docs.get("/features/location-stock/").includes("Corrects revision 1"));
  assert.equal(corrected.graph.edges.find(e=>e.from===answer.slug).revision,2);
  for (const bytes of [...docs.values(),...corrected.files.values()]) assert.ok(!bytes.includes("Hill stays at 9"));
});
test("withdrawal, unknown evidence and exclusive UTC expiry strip claim content in every new projection", async () => {
  for (const [status,change,asOf] of [
    ["withdrawn",r => { r.publication.state = "withdrawn"; },date],
    ["unknown",r => { r.publication.evidence = "unknown"; },date],
    ["expired",r => { r.publication.expiresOn = "2026-12-02"; },"2026-12-02"],
  ]) {
    const release = revised(change,asOf);
    const docs = await featureDocuments(release);
    const notice = release.capabilities.records.find(r => r.slug === "location-stock");
    assert.equal(notice.status,status);
    assert.equal(notice.answer,undefined);
    assert.equal(notice.citations,undefined);
    assert.ok(docs.get("/features/location-stock/").includes(notice.notice));
    assert.ok(!release.graph.edges.some(e=>e.from===notice.slug));
    assert.ok(!release.graph.nodes.some(n=>n.id==="walkthrough-follow-the-sale"));
    assert.ok(!validateCatalog(JSON.parse(release.files.get("/finder/catalog.v1.json"))).some(r=>r.slug===notice.slug));
    assert.equal(search(makeIndex(browserIndex(docs)),question).answer,null);
    for (const bytes of [...release.files.values(),...docs.values(),agentGuide(release)]) assert.ok(!bytes.includes("Hill stays at 9"));
  }
  const before = revised(r=>{r.publication.expiresOn="2026-12-02";});
  assert.equal(before.current.length,7);
  const past = structuredClone(before.current);
  past.find(r=>r.slug==="location-stock").publication.expiresOn="2000-01-01";
  assert.equal(search(makeIndex(past),question).answer,null);
});
test("unreviewed edits, extra fields, private sources, silent removals and invalid lineage fail closed", () => {
  for (const mutate of [
    r=>r.answer="Changed wording", r=>r.title="git reference: rust_core/src/test.rs",
    r=>r.sources[0].href="/private/#internal", r=>r.publication.approver="Internal",
    r=>r.review.checkedOn="2026-02-31", r=>r.publication.supersedes=7
  ]) {
    const draft=structuredClone(source);
    mutate(draft.records[0]);
    assert.throws(()=>createRelease(draft,approvals,date));
    if (draft.records[0].answer!=="Changed wording") {
      const pins=structuredClone(approvals);
      pins[draft.records[0].slug]=[recordDigest(draft.records[0])];
      assert.throws(()=>createRelease(draft,pins,date));
    }
  }
  assert.throws(()=>createRelease({...source,records:source.records.slice(1)},approvals,date));
});
test("mixed-release files and an undeclared compiled asset fail the artifact audit", async () => {
  const fixture = await mkdtemp(join(tmpdir(),"atlasade-release-test-"));
  try {
    await cp(new URL("../dist/",import.meta.url),fixture,{recursive:true});
    const extra = join(fixture,"private-review.json");
    await writeFile(extra,"{}");
    await assert.rejects(auditRelease(fixture,current),/Unexpected compiled asset/);
    await rm(extra);
    await writeFile(join(fixture,"agents","graph.json"),revised(r=>{r.publication.state="withdrawn";}).files.get("/agents/graph.json"));
    await assert.rejects(auditRelease(fixture,current),/artifact mismatch/);
  } finally { await rm(fixture,{recursive:true,force:true}); }
});

test("regenerating an existing compiled tree replaces a corrected claim and then withdraws it", async () => {
  const root = await mkdtemp(join(tmpdir(),"atlasade-reissue-"));
  try {
    await cp(new URL("../dist/",import.meta.url),root,{recursive:true});
    const corrected = revised(r => { r.answer = "Synthetic stock correction."; });
    await writeKnowledge(root, corrected);
    await auditRelease(root, corrected);
    const htmlPath = join(root,"features","location-stock","index.html");
    const correctedPage = await readFile(htmlPath,"utf8");
    assert.ok(correctedPage.includes("Synthetic stock correction."));
    const draft = structuredClone(source);
    draft.issuedOn = "2026-12-02";
    const stock = draft.records.find(r => r.slug === "location-stock");
    stock.review = { ...stock.review, revision: 3, checkedOn: draft.issuedOn };
    stock.publication = { ...stock.publication, state: "withdrawn", supersedes: 2, issuedOn: draft.issuedOn };
    const history = structuredClone(approvals);
    const correctedRecord = corrected.current.find(r => r.slug === stock.slug);
    const { status, canonicalUrl, citations, ...authored } = correctedRecord;
    history[stock.slug].push(recordDigest(authored),recordDigest(stock));
    const withdrawn = createRelease(draft,history,draft.issuedOn);
    await writeKnowledge(root,withdrawn);
    await auditRelease(root,withdrawn);
    const tombstone = await readFile(htmlPath,"utf8");
    assert.ok(tombstone.includes('data-revision="3"'));
    assert.ok(tombstone.includes("has been withdrawn"));
    assert.ok(!tombstone.includes("Synthetic stock correction."));
    await writeFile(htmlPath,correctedPage);
    await assert.rejects(auditRelease(root,withdrawn),/HTML mismatch/);
  } finally { await rm(root,{recursive:true,force:true}); }
});
