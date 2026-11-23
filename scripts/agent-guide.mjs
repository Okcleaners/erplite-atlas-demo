import { site } from "../src/public-content.js";
import { shell } from "./feature-pages.mjs";

export function agentGuide({ manifest, current, graph }) {
  const dataset = {
    "@context": "https://schema.org", "@type": "Dataset", name: "Atlasade public capabilities",
    url: site + "/agents/", version: manifest.releaseId, datePublished: manifest.issuedOn,
    distribution: { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: site + "/agents/capabilities.json" }
  };
  return shell("Agent guide", "Retrieve and cite the versioned Atlasade public capability release.", "/agents/", `
    <a class="back" href="/features/">Feature Finder</a>
    <div class="detail-head"><p class="eyebrow">Public documentation</p><h1>Agent guide</h1>
      <p class="lead">Read the same capability records that power Feature Finder and Atlasade Help. Each answer carries its scope, limits, revision and public sources.</p></div>
    <section class="details agent-guide"><h2>Retrieve the release</h2>
      <p>${current.length} current records · ${graph.edges.length} documented chapter connections · Issued ${manifest.issuedOn}</p>
      <ol><li>Read the <a href="/agents/manifest.json">release manifest</a>. Keep its full release ID.</li>
      <li>Download the <a href="/agents/capabilities.json">capability records</a> and, for chapter links, the <a href="/agents/graph.json">relationship graph</a>.</li>
      <li>Check the SHA-256 digest of each downloaded file’s decoded bytes against the manifest. Match the release ID in both documents. Recheck the current manifest before answering. If versions disagree, retrieve the files again.</li></ol>
      <details><summary>Full release ID</summary><code data-release="${manifest.releaseId}">${manifest.releaseId}</code></details>
      <h2>Read a capability</h2><p>The <a href="/agents/schema.json">version 2 JSON Schema</a> describes the records. The slug identifies a feature across releases. Its review revision changes when approved wording or publication controls change.</p>
      <dl><dt>Scope</dt><dd><code>synthetic_demo</code> describes the fictional café. <code>merchant_product</code> identifies a question about a merchant installation. Read lifecycle, availability, dependencies and limitations before drawing a conclusion.</dd>
      <dt>Product lifecycle</dt><dd>Implemented describes approved behavior in the stated scope. Experimental describes a trial. Planned describes a future direction. Unverified means the available public evidence does not establish the product capability.</dd>
      <dt>Publication status</dt><dd>Active and corrected records carry the current wording. A correction identifies its prior revision. Withdrawn, expired and unknown records carry only a notice. Treat these as unanswered. An expiry date starts at 00:00 UTC on the listed day.</dd>
      <dt>Merchant availability</dt><dd>Unverified means a merchant must confirm support for their package and setup. A demonstrated action or a chapter connection does not establish entitlement.</dd></dl>
      <h2>Cite an answer</h2><p>Include the feature title, canonical feature URL, record revision, release ID and at least one supporting public citation. Carry the claim scope and merchant availability in the answer itself. Use the current record’s precise wording for quantities and location effects.</p>
      <p>For example, look up <a href="/features/location-stock/">Location-scoped inventory</a> and follow its supporting documentation before answering a question about another store.</p>
      <h2>Follow a relationship</h2><p>Each <code>demonstrated_in</code> edge connects a capability revision to its documented café chapter. The chapter URL opens a written explanation. A missing edge supplies no evidence about a relationship.</p>
    </section>`, '<link rel="alternate" type="application/json" href="/agents/capabilities.json"><script type="application/ld+json">' + JSON.stringify(dataset) + '</script>');
}
