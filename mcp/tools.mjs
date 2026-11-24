import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { makeIndex, search } from "../public/finder/search.js";

const phrase = z.string().trim().min(1).max(240).regex(/^[^\u0000-\u001f\u007f]+$/u);
const id = z.string().max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function reference(r) {
  return { id: r.slug, title: r.title, url: r.canonicalUrl, revision: r.review.revision,
    claimScope: r.claimScope, scope: r.scope, lifecycle: r.lifecycle, availabilityStatus: r.availabilityStatus };
}

function detail(r) {
  return { ...reference(r), text: r.answer, limitation: r.limitation, availability: r.availability,
    dependencies: r.dependencies, citations: r.citations, review: r.review, publication: r.publication, status: r.status };
}

function assess(requirement, index) {
  const { answer, records } = search(index, requirement);
  if (!answer) return { requirement, outcome: "unverified", relatedIds: records.slice(0, 3).map(r => r.slug) };
  // Only reviewed merchant-product wording can explicitly exclude a capability.
  // The current records contain no such exclusion or implemented product claim.
  let outcome = "unverified";
  if (answer.claimScope === "synthetic_demo") outcome = "synthetic_demo_only";
  else if (answer.answer.startsWith("Explicitly excluded: ")) outcome = "explicitly_excluded";
  else if (answer.lifecycle === "implemented" && answer.answer.startsWith("Supported within the documented scope: "))
    outcome = "supported_within_documented_scope";
  return { requirement, outcome, evidence: detail(answer) };
}

function compare(requirement, index) {
  const whole = assess(requirement, index);
  if (whole.evidence) return whole;
  // Preserve the whole requirement as unverified. Clause matches never authorize
  // the conjunction, a disjunction, or qualifiers shared across its clauses.
  const clauses = requirement.split(/\s+(?:and|plus|or)\s+|[;\n]+/iu).map(s => s.trim()).filter(Boolean);
  if (clauses.length > 1 && clauses.length <= 4)
    whole.clauses = clauses.map(clause => assess(clause, index));
  return whole;
}

const contracts = {
  search: {
    description: "Find related current public records. A ranked match is a reading suggestion. Fetch the evidence before answering.",
    inputSchema: z.strictObject({ query: phrase }),
    run: (view, { query }) => ({ matchType: "related", results: search(makeIndex(view.records), query).records.slice(0, 8).map(reference) })
  },
  fetch: {
    description: "Read the approved scoped answer, limitations, commercial availability, revision and public citations for one ID.",
    inputSchema: z.strictObject({ id }),
    run: (view, args) => {
      const record = view.records.find(r => r.slug === args.id);
      return record && detail(record);
    }
  },
  compare_requirements: {
    description: "Assess each requirement independently. Outcomes are supported_within_documented_scope, synthetic_demo_only, explicitly_excluded or unverified. Read the cited answer and all qualifications.",
    inputSchema: z.strictObject({ requirements: z.array(phrase).min(1).max(8) }),
    run: (view, { requirements }) => {
      const index = makeIndex(view.records);
      return { assessments: requirements.map(requirement => compare(requirement, index)) };
    }
  },
  related_capabilities: {
    description: "Return the approved outgoing one-hop relationships for a current capability, including each edge's public citation.",
    inputSchema: z.strictObject({ id, relation: z.enum(["demonstrated_in"]).optional() }),
    run: (view, { id, relation }) => {
      const record = view.records.find(r => r.slug === id);
      return record && { source: reference(record), edges: view.edges.filter(e => e.from === id && (!relation || relation === e.relation)) };
    }
  }
};

function errorResult(text) {
  return { isError: true, content: [{ type: "text", text }] };
}

export function knowledgeServer(reader) {
  const server = new McpServer({ name: "atlasade-public-knowledge", version: "0.1.0" }, {
    instructions: "Use a fresh tool call for each answer. Cite the public record. A café demonstration does not establish merchant availability."
  });
  for (const [name, { description, inputSchema, run }] of Object.entries(contracts)) {
    server.registerTool(name, { description, inputSchema, annotations }, async args => {
      try {
        const view = await reader.read();
        const result = run(view, args);
        if (!result) return errorResult("No current approved record for this ID.");
        const data = { releaseId: view.releaseId, ...result };
        const text = JSON.stringify(data);
        if (new TextEncoder().encode(text).length > 24 * 1024)
          return errorResult("Result exceeds the response limit. Request fewer items.");
        return { content: [{ type: "text", text }], structuredContent: data };
      } catch {
        return errorResult("Current public knowledge could not be verified. No answer is available.");
      }
    });
  }
  server.server.registerCapabilities({ tools: { listChanged: false } });
  return server;
}
