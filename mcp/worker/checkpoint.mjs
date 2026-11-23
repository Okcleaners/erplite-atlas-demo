const prefix = "knowledge-checkpoints/v1/";
const maxGeneration = 999999999;
const release = /^atlasade-[0-9a-f]{64}$/;

export function checkpointKey(generation) {
  if (!Number.isSafeInteger(generation) || generation < 1 || generation > maxGeneration)
    throw new Error("Invalid checkpoint generation");
  // R2 lists keys in ascending lexicographic order. The latest generation sorts first.
  return prefix + String(maxGeneration - generation).padStart(9, "0");
}

export function validateCheckpoint(value) {
  if (value?.schemaVersion !== 1 || Object.keys(value).sort().join() !== "generation,previousReleaseId,releaseId,schemaVersion" ||
      typeof value.releaseId !== "string" || !release.test(value.releaseId) ||
      (value.generation === 1 ? value.previousReleaseId !== null :
        typeof value.previousReleaseId !== "string" || !release.test(value.previousReleaseId) || value.releaseId === value.previousReleaseId))
    throw new Error("Invalid checkpoint");
  checkpointKey(value.generation);
  return value;
}

export async function latestCheckpoint(bucket) {
  const { objects } = await bucket.list({ prefix, limit: 1 });
  if (!objects.length) return null;
  const head = objects[0];
  if (head.size > 512) throw new Error("Invalid checkpoint size");
  const item = await bucket.get(head.key);
  if (!item || item.version !== head.version || item.size > 512) throw new Error("Unstable checkpoint");
  const record = validateCheckpoint(await item.json());
  if (checkpointKey(record.generation) !== head.key) throw new Error("Invalid checkpoint key");
  return record;
}

export const checkpointURL = "https://checkpoint.internal/current";
