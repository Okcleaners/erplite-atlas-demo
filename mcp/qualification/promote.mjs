import { checkpointKey, latestCheckpoint, validateCheckpoint } from "../worker/checkpoint.mjs";

// Operator-side rehearsal only. Neither deployed module imports this publisher.
export async function promote(bucket, expected, approvedId) {
  const head = await latestCheckpoint(bucket);
  if ((head?.generation ?? 0) !== expected.generation || (head?.releaseId ?? null) !== expected.releaseId)
    throw new Error("The approved predecessor is no longer current");
  const next = validateCheckpoint({ schemaVersion: 1, generation: expected.generation + 1,
    previousReleaseId: expected.releaseId, releaseId: approvedId });
  // Check historical identity and lineage on the infrequent write path.
  let prior = head;
  while (prior) {
    if (prior.releaseId === approvedId) throw new Error("Cannot re-promote a retired release");
    if (prior.generation === 1) break;
    const item = await bucket.get(checkpointKey(prior.generation - 1));
    if (!item || item.size > 512) throw new Error("Missing checkpoint history");
    const predecessor = validateCheckpoint(await item.json());
    if (predecessor.generation !== prior.generation - 1 || predecessor.releaseId !== prior.previousReleaseId)
      throw new Error("Inconsistent checkpoint history");
    prior = predecessor;
  }
  // Competing publishers have the same next key. Only the first can create it.
  const written = await bucket.put(checkpointKey(next.generation), JSON.stringify(next), {
    onlyIf: { etagDoesNotMatch: "*" }
  });
  if (!written) throw new Error("Checkpoint already promoted");
  return next;
}
