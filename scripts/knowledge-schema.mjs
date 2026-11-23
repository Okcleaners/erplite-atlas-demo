import { legacySchema } from "./validate-catalog.mjs";

const object = properties => ({
  type: "object", properties, required: Object.keys(properties), additionalProperties: false
});
const list = (items, minItems = 0) => ({ type: "array", items, minItems });
const nullable = rule => ({ anyOf: [{ type: "null" }, rule] });
const text = { type: "string", minLength: 1 };
export const date = { ...text, format: "date" };
const revision = { type: "integer", minimum: 1 };
const url = { ...text, pattern: "^https://www\\.atlasade\\.com/[a-z0-9/#-]+$" };
const legacy = legacySchema.properties.records.items.properties;
const scoped = {
  claimScope: { enum: ["synthetic_demo", "merchant_product"] },
  availabilityStatus: { const: "unverified" },
  dependencies: list(text)
};
const publication = object({
  state: { enum: ["active", "corrected", "withdrawn"] }, issuedOn: date,
  expiresOn: nullable(date), supersedes: nullable(revision),
  evidence: { enum: ["documented", "unknown"] }
});
const authored = object({ ...legacy, ...scoped, publication });
export const sourceSchema = object({ schemaVersion: { const: 2 }, issuedOn: date, records: list(authored, 1) });
const identity = {
  slug: legacy.slug, title: text, canonicalUrl: url, review: legacy.review,
  claimScope: scoped.claimScope, availabilityStatus: scoped.availabilityStatus, publication
};
const current = object({
  ...authored.properties, canonicalUrl: url, citations: list(object({ label: text, url }), 1),
  status: { enum: ["active", "corrected"] }
});
const notice = object({
  ...identity, status: { enum: ["expired", "withdrawn", "unknown"] },
  lifecycle: { const: "unverified" }, notice: text
});
const releaseId = { ...text, pattern: "^atlasade-[0-9a-f]{64}$" };
const header = { schemaVersion: { const: 2 }, releaseId, issuedOn: date };
const capabilityNode = object({ id: legacy.slug, kind: { const: "capability" }, url, revision,
  status: { enum: ["active", "corrected", "withdrawn", "expired", "unknown"] } });
const chapterNode = object({ id: legacy.slug, kind: { const: "chapter" }, url });
const edge = object({ from: legacy.slug, to: legacy.slug, relation: { const: "demonstrated_in" },
  revision, claimScope: { const: "synthetic_demo" }, citation: url });
const artifact = object({ path: { ...text, pattern: "^/(agents|finder)/[a-z0-9.]+[.]json$" },
  sha256: { ...text, pattern: "^[0-9a-f]{64}$" }, bytes: { type: "integer", minimum: 1 } });
export const graphSchema = object({ ...header, nodes: list({ anyOf: [capabilityNode, chapterNode] }), edges: list(edge) });
export const manifestSchema = object({ ...header, digestAlgorithm: { const: "sha256" }, artifacts: list(artifact, 1) });
export const publicSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Atlasade public capabilities v2",
  $defs: { graph: graphSchema, manifest: manifestSchema },
  ...object({ ...header, records: list({ anyOf: [current, notice] }, 1) })
};
