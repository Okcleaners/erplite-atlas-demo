import { createHash } from "node:crypto";

const orderedKeys = (_, value) => value && typeof value === "object" && !Array.isArray(value)
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value;
export const serialize = value => JSON.stringify(value, orderedKeys, 2) + "\n";
export const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

// Object key order and checkout line endings do not affect a wording approval.
export function recordDigest(record) {
  return sha256(JSON.stringify(record, orderedKeys));
}
