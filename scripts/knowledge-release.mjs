import { serialize, sha256, recordDigest } from "./release-digests.mjs";
export { serialize, sha256, recordDigest } from "./release-digests.mjs";
import { readFile } from "node:fs/promises";
import { site } from "../src/public-content.js";
import { check, legacySchema } from "./validate-catalog.mjs";
import { publicSchema, sourceSchema, graphSchema, manifestSchema } from "./knowledge-schema.mjs";

const readJSON = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const legacyKeys = Object.keys(legacySchema.properties.records.items.properties);
const notices = {
  withdrawn: "This claim has been withdrawn. There is no current answer for this capability.",
  expired: "The evidence review has expired. This capability requires a new review.",
  unknown: "There is no verified answer for this capability."
};

function rejectPrivateText(record) {
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") rejectPrivateText(value);
    else if (typeof value === "string" && /[<>\\]|https?:\/\/|(?:^|\s)(?:file:|~\/|\/(?:home|Users|tmp|etc)\/)|\b(?:localhost|127\.0\.0\.1|Okcleaners|Graphify|rust_core|operator_harness|source-inventory|github\.com|docs\/|src\/|\.git\/)|BEGIN [\w ]*PRIVATE KEY/i.test(value)) {
      throw new Error("Private or non-public text in capability");
    }
  }
}

function project(record, asOf) {
  const { publication, review, slug, title, claimScope, availabilityStatus } = record;
  const canonicalUrl = site + "/features/" + slug + "/";
  const status = publication.state === "withdrawn" ? "withdrawn"
    : publication.expiresOn && publication.expiresOn <= asOf ? "expired"
    : publication.evidence === "unknown" ? "unknown" : publication.state;
  if (Object.hasOwn(notices, status)) {
    return { slug, title, claimScope, availabilityStatus, review, publication, canonicalUrl,
      status, lifecycle: "unverified", notice: notices[status] };
  }
  const links = [...record.sources, ...(record.demo ? [record.demo] : [])];
  return { ...record, status, canonicalUrl, citations: links.map(({ href, label }) => ({ label, url: site + href })) };
}

export function createRelease(source, approvals, asOf = new Date().toISOString().slice(0,10)) {
  check(source, sourceSchema, "catalog");
  if (source.issuedOn > asOf) throw new Error("Release is future dated");
  const seen = new Set();
  const records = source.records.map(record => {
    rejectPrivateText(record);
    const { slug, publication, review } = record;
    const history = Object.hasOwn(approvals, slug) && approvals[slug];
    if (seen.has(slug) || !Array.isArray(history) || history.length !== review.revision ||
        history.at(-1) !== recordDigest(record)) throw new Error("Missing or mismatched wording approval for " + slug);
    seen.add(slug);
    if (review.checkedOn > publication.issuedOn || publication.issuedOn > source.issuedOn ||
        (publication.expiresOn && publication.expiresOn <= publication.issuedOn)) throw new Error("Invalid review window for " + slug);
    if (publication.supersedes !== (review.revision > 1 ? review.revision - 1 : null) ||
        (publication.state !== "active" && !publication.supersedes)) throw new Error("Invalid revision lineage for " + slug);
    if (record.claimScope === "synthetic_demo" && (!record.demo || record.lifecycle !== "unverified")) throw new Error("Invalid demo scope");
    if (record.demo && !/^\/day-with-atlasade\/#walkthrough-[a-z-]+$/.test(record.demo.href)) throw new Error("Invalid chapter");
    if (record.sources.some(({ href }) => !/^\/(?:(?:availability|faq|deployment|product)\/#[a-z0-9-]+|#(?:atlas|erp-lite|hardware))$/.test(href))) throw new Error("Invalid source");
    return project(record, asOf);
  });
  if (seen.size !== Object.keys(approvals).length) throw new Error("Removed feature needs a withdrawal notice");
  const schemaVersion = 2;
  const issuedOn = source.issuedOn;
  const current = records.filter(r => !r.notice);
  const legacy = { schemaVersion: 1, records: current.filter(record => !record.publication.expiresOn).map(record =>
    Object.fromEntries(legacyKeys.map(key => [key, record[key]]))) };
  const nodes = records.map(r => ({ id: r.slug, kind: "capability", url: r.canonicalUrl, revision: r.review.revision, status: r.status }));
  const edges = [];
  for (const r of current.filter(r => r.demo)) {
    const target = r.demo.href.split("#")[1];
    if (!nodes.some(n => n.id === target)) nodes.push({ id: target, kind: "chapter", url: site + r.demo.href });
    edges.push({ from: r.slug, relation: "demonstrated_in", to: target, revision: r.review.revision,
      claimScope: "synthetic_demo", citation: site + r.demo.href });
  }
  const releaseId = "atlasade-" + recordDigest({ schemaVersion, issuedOn, records, nodes, edges, legacy, publicSchema });
  const header = { schemaVersion, releaseId, issuedOn };
  const capabilities = { ...header, records };
  check(capabilities, publicSchema, "capabilities");
  const graph = { ...header, nodes, edges };
  check(graph, graphSchema, "graph");
  const files = new Map([
    ["/agents/capabilities.json", serialize(capabilities)], ["/agents/graph.json", serialize(graph)],
    ["/agents/schema.json", serialize(publicSchema)], ["/finder/catalog.v1.json", serialize(legacy)]
  ]);
  const manifest = { ...header, digestAlgorithm: "sha256", artifacts: [...files].map(([path, bytes]) =>
    ({ path, sha256: sha256(bytes), bytes: Buffer.byteLength(bytes) })) };
  check(manifest, manifestSchema, "manifest");
  files.set("/agents/manifest.json", serialize(manifest));
  return { capabilities, current, graph, manifest, files };
}

export async function loadRelease() {
  const [source, approvals] = await Promise.all([
    readJSON("../knowledge/catalog.json"), readJSON("../knowledge/approved-revisions.json")
  ]);
  return createRelease(source, approvals);
}
