import legacySchema from "../public/finder/catalog.schema.json" with { type: "json" };
export { legacySchema };
export function check(value, rule, path) {
  const fail = () => { throw new Error("Invalid public capability field: " + path); };
  if (rule.anyOf) {
    for (const candidate of rule.anyOf) {
      try { check(value, candidate, path); return; } catch { /* try the next schema */ }
    }
    fail();
  }
  if (rule.type === "null" && value !== null) fail();
  if ("const" in rule && value !== rule.const) fail();
  if (rule.enum && !rule.enum.includes(value)) fail();
  if (rule.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail();
    if (Object.keys(value).some(key => !Object.hasOwn(rule.properties, key))) fail();
    for (const key of rule.required) check(value[key], rule.properties[key], path + "." + key);
  }
  if (rule.type === "array") {
    if (!Array.isArray(value) || value.length < rule.minItems) fail();
    value.forEach((item,i) => check(item,rule.items,path + "[" + i + "]"));
  }
  if (rule.type === "integer" && (!Number.isSafeInteger(value) || value < rule.minimum)) fail();
  if (rule.type === "string") {
    if (typeof value !== "string" || !value.trim()) fail();
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail();
    if (rule.format === "date") {
      const time = Date.parse(value + "T00:00:00Z");
      if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== value) fail();
    }
  }
}
export function validateCatalog(catalog) {
  check(catalog,legacySchema,"catalog");
  const ids = new Set(catalog.records.map(record => record.slug));
  if (ids.size !== catalog.records.length) throw new Error("Duplicate public feature slug");
  return catalog.records;
}
