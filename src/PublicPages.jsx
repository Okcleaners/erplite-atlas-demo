import React from "react";
import { pages, contact } from "./public-content.js";

export function KnowledgeLinks() {
  return <nav className="knowledge-nav" aria-label="Product information">
    <a href="/">Home</a>
    {pages.map((page) => <a key={page.path} href={page.path}>{page.path === "/faq/" ? "FAQ" : page.path.split("/")[1].replace(/^./, (c) => c.toUpperCase())}</a>)}
  </nav>;
}

export function AvailabilityNotice() {
  return <aside className="availability-notice" aria-label="Alpha availability">
    <strong>Alpha product overview.</strong> The product map describes areas of development,
    not a list of commercially released features. <a href="/availability/">Check current access and limitations</a>.
  </aside>;
}

export function PublicPage({ page }) {
  return <div className="section-inner knowledge-page">
    <a className="skip-link" href="#main">Skip to main content</a>
    <a className="brand" href="/" aria-label="AtlasADE home">
      <span className="brand-mark" aria-hidden="true"><span /></span>
      <span className="brand-word">ATLAS<span>ADE</span></span>
    </a>
    <KnowledgeLinks />
    <main id="main">
      <p className="eyebrow">AtlasADE product information</p>
      <h1>{page.heading}</h1>
      <p>{page.description}</p>
      <AvailabilityNotice />
      <nav className="knowledge-nav" aria-label="On this page">
        {page.sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.question}</a>)}
      </nav>
      {page.sections.map((section) => <section key={section.id} id={section.id}>
        <h2>{section.question}</h2><p>{section.answer}</p>
      </section>)}
    </main>
    <footer>
      <p>Ask about current access: <a href={`mailto:${contact}`}>{contact}</a>.</p>
      <KnowledgeLinks />
      <p><a href="/#privacy-policy">Privacy</a> Â· <a href="/#terms">Terms</a> Â· <a href="/#accessibility-statement">Accessibility</a></p>
    </footer>
  </div>;
}
