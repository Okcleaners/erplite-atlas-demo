import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";
import { createRelease, recordDigest, sha256 } from "../../scripts/knowledge-release.mjs";
import { featureDocuments } from "../../scripts/feature-pages.mjs";
import { agentGuide } from "../../scripts/agent-guide.mjs";

const json = async file => JSON.parse(await readFile(new URL("../../knowledge/"+file,import.meta.url),"utf8"));
const days = ["2031-01-01","2031-01-02","2031-01-03","2031-01-04"];
export async function fixtureOrigin() {
  const catalog = await json("catalog.json");
  const approvals = await json("approved-revisions.json");
  const releases = {};
  const resources = {};
  function revise(slug, day, changes, state = "corrected") {
    const r = catalog.records.find(item=>item.slug===slug);
    const prior = r.review.revision;
    Object.assign(r, changes);
    Object.assign(r.review,{ revision:prior+1,checkedOn:day });
    Object.assign(r.publication,{ issuedOn:day,supersedes:prior,state });
    approvals[slug].push(recordDigest(r));
  }
  for (const [i, label] of ["A","B","C","D"].entries()) {
    const day = days[i];
    if (label === "A") {
      const opening = catalog.records.find(r=>r.slug==="open-register");
      opening.publication.expiresOn = days[3];
      revise(opening.slug, day, {answer:"Synthetic opening claim valid through January 3."});
    }
    if (label === "B") revise("location-stock", day, { answer:"Synthetic correction. Only River’s tracked oat-bar count changes." });
    if (label === "C") revise("cash-checkout", day, {}, "withdrawn");
    if (label !== "D") catalog.issuedOn = day;
    const r = createRelease(structuredClone(catalog), approvals, day);
    releases[label] = r;
    const files = new Map(r.files);
    for (const [path,html] of await featureDocuments(r)) files.set(path,html);
    files.set("/agents/",agentGuide(r));
    for (const path of ["/finder/ui.js","/finder/search.js","/finder/style.css","/favicon.ico","/quiet-orbit.css","/images/quiet-orbit.svg","/images/cafe-morning.webp"])
      files.set(path, await readFile(new URL("../../public"+path,import.meta.url)));
    resources[label] = files;
  }
  let current = "A";
  const overrides = new Map();
  const requests = [];
  let after;
  const server = createServer((request,response) => {
    const path = request.url;
    const content = overrides.has(path) ? overrides.get(path) : resources[current].get(path);
    let status = content == null ? (content === null ? 503 : 404) : 200;
    const etag = content == null ? null : '"' + sha256(content) + '"';
    if (etag && request.headers["if-none-match"]===etag) status=304;
    const type = path.endsWith(".json") ? "application/json" : path.endsWith(".js") ? "text/javascript" :
      path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".css") ? "text/css" : path.endsWith(".webp") ? "image/webp" : "text/html";
    response.writeHead(status,{...(etag?{ETag:etag}:{}),"Cache-Control":"public, no-cache, must-revalidate","Content-Type":type+"; charset=utf-8"});
    response.end(status===200 ? content : undefined);
    requests.push({path,status,etag,conditional:request.headers["if-none-match"]});
    if (after?.path===path) {current=after.label;after=undefined;}
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  return { url:"http://127.0.0.1:"+server.address().port, releases, resources, requests, overrides,
    promote(label) { if (!releases[label]) throw new Error("Unknown fixture");current=label; },
    promoteAfter(path,label) {after={path,label};},
    async close() {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
  };
}

// Browser qualification controls promotion over its own subprocess stdin.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const fixture=await fixtureOrigin();
  console.log(fixture.url);
  for await (const label of createInterface({input:process.stdin})) {
    fixture.promote(label);console.log(label);
  }
  await fixture.close();
}
