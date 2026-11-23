import { sha256, recordDigest } from "./knowledge-release.mjs";
import { publicSchema, graphSchema, manifestSchema } from "./knowledge-schema.mjs";
import { check, validateCatalog } from "./validate-catalog.mjs";

const pointer = "/agents/manifest.json";
const required = ["/agents/capabilities.json", "/agents/graph.json", "/agents/schema.json", "/finder/catalog.v1.json"];

// This reader consumes only public HTTP resources. A returned view is one observation.
// Call read() again for the next answer. Failures never return the last successful view.
export function currentKnowledge(origin, { now = () => new Date() } = {}) {
  let previous;
  let revisions = new Map();
  let bytesByDigest = new Map();
  const retired = new Set();
  let pending;

  async function manifest(prior, signal) {
    const headers = prior?.etag ? { "If-None-Match": prior.etag } : {};
    const response = await fetch(new URL(pointer, origin), { headers, cache: "no-cache", redirect: "error", signal });
    if (response.status === 304 && prior?.etag) {
      const validated = response.headers.get("etag");
      if (validated && validated !== prior.etag) throw new Error("Inconsistent 304 validator");
      return prior;
    }
    if (response.status !== 200) throw new Error("Current manifest unavailable");
    const data = await response.json();
    check(data, manifestSchema, "manifest");
    if (data.artifacts.length !== required.length || !required.every(path => data.artifacts.some(a => a.path === path)))
      throw new Error("Unexpected manifest inventory");
    return { data, etag: response.headers.get("etag") };
  }

  async function refresh() {
    const signal = AbortSignal.timeout(10000);
    const first = await manifest(previous, signal);
    const { data } = first;
    if (retired.has(data.releaseId)) throw new Error("Previously superseded release");
    const nextCache = new Map();
    const documents = new Map();
    for (const artifact of data.artifacts) {
      let bytes = bytesByDigest.get(artifact.sha256);
      if (!bytes) {
        const response = await fetch(new URL(artifact.path, origin), { cache: "no-cache", redirect: "error", signal });
        if (response.status !== 200) throw new Error("Missing current artifact: " + artifact.path);
        bytes = Buffer.from(await response.arrayBuffer());
      }
      if (bytes.length !== artifact.bytes || sha256(bytes) !== artifact.sha256) throw new Error("Digest mismatch: " + artifact.path);
      documents.set(artifact.path, JSON.parse(bytes.toString("utf8")));
      nextCache.set(artifact.sha256, bytes);
    }
    const capabilities = documents.get(required[0]);
    const graph = documents.get(required[1]);
    check(capabilities, publicSchema, "capabilities");
    check(graph, graphSchema, "graph");
    const legacy = validateCatalog(documents.get(required[3]));
    for (const file of [capabilities, graph]) {
      if (file.releaseId !== data.releaseId || file.issuedOn !== data.issuedOn) throw new Error("Mixed release metadata");
    }
    const identity = recordDigest({ schemaVersion: data.schemaVersion, issuedOn: data.issuedOn,
      records: capabilities.records, nodes: graph.nodes, edges: graph.edges,
      legacy: documents.get(required[3]), publicSchema: documents.get(required[2]) });
    if ("atlasade-" + identity !== data.releaseId) throw new Error("Release identity mismatch");
    // Recheck the complete manifest to catch a promotion during acquisition.
    const last = await manifest(first, signal);
    if (JSON.stringify(last.data) !== JSON.stringify(data)) throw new Error("Manifest changed during retrieval");
    const nextRevisions = new Map(capabilities.records.map(r => [r.slug, r]));
    if (previous && data.issuedOn < previous.data.issuedOn) throw new Error("Older issue date");
    for (const [slug, prior] of revisions) {
      const next = nextRevisions.get(slug);
      if (!next || next.review.revision < prior.revision ||
          (next.review.revision === prior.revision && prior.inactive && !next.notice))
        throw new Error("Regressed capability revision: " + slug);
    }
    if (previous && previous.data.releaseId !== data.releaseId) retired.add(previous.data.releaseId);
    revisions = new Map(capabilities.records.map(r => [r.slug, { revision: r.review.revision, inactive: Boolean(r.notice) }]));
    previous = last;
    bytesByDigest = nextCache;
    const today = now().toISOString().slice(0,10);
    const records = capabilities.records.filter(r =>
      ["active","corrected"].includes(r.status) && r.publication.evidence === "documented" &&
      (!r.publication.expiresOn || today < r.publication.expiresOn));
    const valid = new Map(records.map(r => [r.slug,r]));
    return {
      releaseId: data.releaseId, records,
      edges: graph.edges.filter(e => valid.get(e.from)?.review.revision === e.revision),
      legacy: legacy.filter(r => valid.get(r.slug)?.review.revision === r.review.revision && !valid.get(r.slug).publication.expiresOn)
    };
  }
  return { read() {
    pending ??= refresh().finally(() => { pending = undefined; });
    return pending;
  } };
}
