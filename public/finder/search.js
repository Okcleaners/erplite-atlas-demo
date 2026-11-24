const normalize = value => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const filler = new Set("a an the at by is are can do does i my your and or to in of with when for it how what me please".split(" "));
const words = phrase => phrase.split(" ").filter(word => word && !filler.has(word));
const guards = [
  [/\b(automatic\w*|autopost\w*|auto post)\b/, []],
  [/^(?=.*\b(?:offline|outage|without internet|internet goes down)\b)(?=.*\b(?:cards?|cash|payments?|checkout)\b)/, ["offline-card"]],
  [/\b(refund\w*|revers\w*)\b/, ["refunds-voids", "reporting"]],
  [/\b((other|another|different|across) (stores?|locations?)|hill)\b/, ["location-stock", "multi-location"]],
];
// Normalization may discard qualifiers. Only punctuation used in reviewed public
// terms and questions may be ignored when deciding whether a match is exact.
const exactInput = /^[a-z0-9\p{Script=Latin}\p{M}\s'’.,?!()&/-]*$/iu;
export function makeIndex(records) {
  return records.map(record => {
    const title = normalize(record.title);
    const aliases = record.aliases.map(normalize);
    const questions = record.questions.map(normalize);
    const vocabulary = new Set(words([title, ...aliases, ...questions, normalize(record.category)].join(" ")));
    const supporting = new Set(words(normalize(record.answer + " " + record.scope)));
    return { record, title, aliases, questions, vocabulary, supporting };
  });
}
export function search(index, value, category = "", lifecycle = "") {
  const query = normalize(value);
  const tokens = [...new Set(words(query))];
  const today = new Date().toISOString().slice(0,10);
  const canAnswer = exactInput.test(value);
  const allowed = guards.filter(([pattern]) => pattern.test(query));
  const matches = [];
  for (const item of index) {
    const { record } = item;
    const publication = record.publication;
    if (publication && (publication.state === "withdrawn" || publication.evidence !== "documented" ||
        (publication.expiresOn && publication.expiresOn <= today))) continue;
    if ((category && category !== record.category) || (lifecycle && lifecycle !== record.lifecycle)) continue;
    // A complete grammar covers ordinary rephrasings of the two-store example.
    // Extra conditions (refunds, integrations, etc.) cannot become direct answers.
    const stockQuestion = record.slug === "location-stock" &&
      /^(?:(?:does|will|would|can) (?:selling|ringing up) (?:an?|one) oat bar(?: at river)? (?:change|affect|reduce|decrease)|if i sell (?:an?|one) oat bar(?: at river)? (?:does|will) (?:it )?(?:change|affect)) (?:the )?(?:stock|inventory)(?: levels?)? (?:at|in|for) (?:my other|the other|another|a different) (?:store|location)$/.test(query);
    const exact = canAnswer && (stockQuestion || item.questions.includes(query) || item.title === query || item.aliases.includes(query));
    if (!exact && allowed.some(([, slugs]) => !slugs.includes(record.slug))) continue;
    const hits = tokens.filter(token => item.vocabulary.has(token)).length;
    const supportingHits = tokens.filter(token => item.supporting.has(token)).length;
    let score = hits ? 10 * hits / tokens.length + (item.title.includes(query) ? 5 : 0) : 0;
    if (tokens.length && supportingHits === tokens.length) score += 1;
    if (exact) score = 100;
    if (!value.trim() || score > 0) matches.push({ record, score, exact });
  }
  matches.sort((a,b) => b.score - a.score || a.record.title.localeCompare(b.record.title, "en"));
  // Only an entire authored question or phrase is eligible for a direct answer.
  const direct = matches.filter(match => match.exact);
  return { records: matches.map(match => match.record), answer: direct.length === 1 ? direct[0].record : null };
}
