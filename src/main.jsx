import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  DatabaseZap,
  LifeBuoy,
  Megaphone,
  Network,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Store,
  UsersRound,
  Workflow,
} from "lucide-react";
import ContentStudioSection from "./ContentStudioSection.jsx";
import atlasData from "../atlas-data.json";
import "./styles.css";
import "./contentStudio.css";

const navItems = [
  ["Home", "home"],
  ["Atlas", "atlas"],
  ["ERP-Lite", "erp-lite"],
  ["Flow", "flow"],
  ["Modules", "modules"],
  ["Alpha", "alpha"],
  ["Contact", "contact"],
];

const accentCycle = ["#2bb3ff", "#2de2d2", "#97ff4f", "#ff9b4a", "#b16dff"];

const iconByModule = {
  "sales-register": Store,
  "customer-crm": UsersRound,
  inventory: Boxes,
  "payments-recovery": CreditCard,
  reporting: BarChart3,
  "business-operations": Building2,
  "ai-assistant": BrainCircuit,
  "content-studio-social-observer": Megaphone,
  integrations: DatabaseZap,
  "backup-replay": RefreshCcw,
};

const merchantReasons = [
  ["Lower software overhead", "Fewer disconnected subscriptions and less operational drag."],
  ["Unified operational visibility", "Sales, customers, payments, inventory, and reporting in one map."],
  ["Merchant-first workflows", "Designed around owners, managers, and frontline teams."],
  ["Recovery-aware systems", "Built with interruptions, exceptions, and continuity in mind."],
  ["AI-assisted guidance", "Useful recommendations without hype or autopilot theater."],
  ["ERP-lite simplicity", "Serious coordination without enterprise complexity."],
];

const flowSteps = [
  "Customer",
  "Sale",
  "Payment",
  "Inventory",
  "Reporting",
  "Follow-Up",
  "Operational Insight",
];

const disclosureSections = [
  {
    id: "accessibility-statement",
    title: "Accessibility Statement",
    body: [
      "AtlasADE is committed to making its website accessible to all users. We aim to conform to WCAG 2.2 Level AA and are continuously improving accessibility.",
      "If you have difficulty accessing content, email jwong@atlasade.com. Please include the page or section, the issue encountered, assistive technology or browser if relevant, and your preferred contact method.",
      "We will make reasonable efforts to provide information in an alternative format when needed.",
    ],
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    body: [
      "This alpha website is informational. No payment information is collected on the website, and no account login is provided on the website.",
      "If you email us, we use your email address and message only to respond to your inquiry.",
      "We do not overstate tracking practices here because this alpha site has not been represented as having a full analytics or tracking audit.",
    ],
  },
  {
    id: "terms",
    title: "Terms",
    body: [
      "Website content is provided for informational purposes. Alpha availability is limited and subject to change.",
      "AtlasADE is not represented as a full enterprise ERP replacement.",
      "The website is provided without a guarantee that every detail will be uninterrupted or error-free. For questions, email jwong@atlasade.com.",
    ],
  },
];

function getAccent(index) {
  return accentCycle[index % accentCycle.length];
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function BrandMark() {
  return (
    <a className="brand" href="#home" aria-label="AtlasADE home">
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span className="brand-word">
        ATLAS<span>ADE</span>
      </span>
    </a>
  );
}

function Navigation() {
  return (
    <header className="site-header">
      <BrandMark />
      <nav aria-label="Primary navigation">
        {navItems.map(([label, id]) => (
          <button key={id} type="button" onClick={() => scrollToSection(id)}>
            {label}
          </button>
        ))}
      </nav>
      <button className="nav-cta" type="button" onClick={() => scrollToSection("alpha")}>
        Alpha
      </button>
    </header>
  );
}

function OperationalMap({ compact = false }) {
  const nodes = compact
    ? [
        { x: 18, y: 50, label: "Sales", color: "#2bb3ff" },
        { x: 42, y: 24, label: "CRM", color: "#2de2d2" },
        { x: 48, y: 72, label: "Stock", color: "#97ff4f" },
        { x: 74, y: 38, label: "Pay", color: "#ff9b4a" },
        { x: 82, y: 70, label: "Insight", color: "#b16dff" },
      ]
    : [
        { x: 12, y: 48, label: "Customer", color: "#2de2d2" },
        { x: 31, y: 23, label: "Register", color: "#2bb3ff" },
        { x: 38, y: 69, label: "Inventory", color: "#97ff4f" },
        { x: 58, y: 42, label: "Payment", color: "#ff9b4a" },
        { x: 74, y: 20, label: "Reporting", color: "#b16dff" },
        { x: 82, y: 63, label: "Recovery", color: "#2bb3ff" },
      ];

  const connections =
    nodes.length === 5
      ? [
          [0, 1],
          [0, 2],
          [1, 3],
          [2, 4],
          [3, 4],
        ]
      : [
          [0, 1],
          [0, 2],
          [1, 3],
          [2, 3],
          [3, 4],
          [3, 5],
          [4, 5],
        ];

  return (
    <motion.div
      className={`map-shell ${compact ? "compact" : ""}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="map-glow" aria-hidden="true" />
      <svg viewBox="0 0 100 100" className="map-svg" role="img" aria-label="Animated operational map">
        <defs>
          <filter id={compact ? "softGlowCompact" : "softGlow"}>
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {connections.map(([from, to], index) => {
          const a = nodes[from];
          const b = nodes[to];
          return (
            <g key={`${from}-${to}`}>
              <line className="map-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
              <motion.line
                className="map-pulse"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                style={{ stroke: b.color }}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1, 1], opacity: [0, 0.95, 0] }}
                transition={{
                  duration: 3.4,
                  delay: index * 0.32,
                  repeat: Infinity,
                  repeatDelay: 1.1,
                  ease: "easeInOut",
                }}
              />
            </g>
          );
        })}
        {nodes.map((node, index) => (
          <g key={node.label} filter={`url(#${compact ? "softGlowCompact" : "softGlow"})`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="4.4"
              fill="#07111f"
              stroke={node.color}
              strokeWidth="0.45"
              animate={{ r: [4.2, 5.1, 4.2], opacity: [0.9, 1, 0.9] }}
              transition={{
                duration: 4,
                delay: index * 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <circle cx={node.x} cy={node.y} r="1.1" fill={node.color} />
          </g>
        ))}
      </svg>
      <div className="map-labels" aria-hidden="true">
        {nodes.map((node) => (
          <span
            key={node.label}
            style={{ left: `${node.x}%`, top: `${node.y}%`, "--node-color": node.color }}
          >
            {node.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.25], [0, 90]);
  const opacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.2]);

  return (
    <section className="hero section" id="home">
      <motion.div className="hero-bg-orbit" style={{ y, opacity }} aria-hidden="true" />
      <div className="hero-inner">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        >
          <div className="brand-panel">
            <BrandMark />
            <span>Operational Business Map</span>
          </div>
          <p className="eyebrow">Operational Intelligence For Merchants</p>
          <h1>See Every Connection. Drive Every Outcome.</h1>
          <p className="hero-subtitle">
            AtlasADE is an operational business map designed for merchants who need visibility,
            workflow intelligence, and ERP-lite coordination without enterprise complexity.
          </p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={() => scrollToSection("alpha")}>
              Apply For Alpha <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="button secondary" type="button" onClick={() => scrollToSection("atlas")}>
              Explore Atlas
            </button>
          </div>
        </motion.div>
        <OperationalMap />
      </div>
      <div className="hero-floor" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}

function InteractiveAtlasSection() {
  const modules = atlasData.modules ?? [];
  const lifecycle = atlasData.lifecycle?.steps ?? [];
  const [selectedId, setSelectedId] = useState(modules[0]?.id ?? "");

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedId) ?? modules[0],
    [modules, selectedId],
  );

  if (!selectedModule) {
    return null;
  }

  const selectedIndex = Math.max(0, modules.findIndex((module) => module.id === selectedModule.id));
  const selectedAccent = getAccent(selectedIndex);
  const SelectedIcon = iconByModule[selectedModule.id] ?? Network;

  return (
    <section className="section interactive-atlas-section" id="atlas">
      <div className="section-inner">
        <div className="section-heading atlas-heading">
          <p className="eyebrow">Interactive Atlas</p>
          <h2>Explore the operational map behind a merchant business.</h2>
          <p>
            Select any module to see the merchant outcome, what the system touches, and how each
            piece connects into a customer purchase flow.
          </p>
        </div>

        <div className="atlas-workbench">
          <div className="atlas-module-map" aria-label="Atlas modules">
            <div className="atlas-map-orbit" aria-hidden="true" />
            {modules.map((module, index) => {
              const Icon = iconByModule[module.id] ?? Network;
              const isSelected = module.id === selectedModule.id;
              const accent = getAccent(index);
              return (
                <motion.button
                  type="button"
                  className="atlas-node"
                  key={module.id}
                  style={{ "--accent": accent }}
                  aria-pressed={isSelected}
                  aria-label={`${module.name}. ${module.tagline}. Select to view merchant outcomes, connected endpoints, and related flows.`}
                  onClick={() => setSelectedId(module.id)}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.04, duration: 0.45 }}
                >
                  <span className="atlas-node-icon" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span>
                    <strong>{module.name}</strong>
                    <small>{module.tagline}</small>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.aside
            className="atlas-detail-panel"
            key={selectedModule.id}
            style={{ "--accent": selectedAccent }}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="atlas-detail-top">
              <span className="card-icon" aria-hidden="true">
                <SelectedIcon size={24} />
              </span>
              <div>
                <p className="eyebrow">Selected Module</p>
                <h3>{selectedModule.name}</h3>
              </div>
            </div>
            <p className="atlas-description">{selectedModule.description}</p>
            <div className="atlas-outcome-block">
              <h4>Plain-English merchant outcome</h4>
              <p>{selectedModule.whyItMatters}</p>
            </div>
            <div className="atlas-detail-grid">
              <div>
                <h4>What it touches</h4>
                <ul>
                  {selectedModule.connectedEndpoints.map((endpoint) => (
                    <li key={endpoint}>{endpoint}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Business outcomes</h4>
                <ul>
                  {selectedModule.businessOutcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="merchant-conversation">
              <Sparkles size={17} aria-hidden="true" />
              <span>{selectedModule.merchantConversation}</span>
            </div>
            <div className="flow-chip-row">
              {selectedModule.relatedFlows.map((flow) => (
                <span key={flow}>{flow}</span>
              ))}
            </div>
          </motion.aside>
        </div>

        <div className="purchase-lifecycle">
          <div className="purchase-lifecycle-head">
            <p className="eyebrow">{atlasData.lifecycle?.title ?? "Follow a customer purchase"}</p>
            <h3>From customer lookup to protected business record.</h3>
          </div>
          <div className="lifecycle-track">
            {lifecycle.map((step, index) => (
              <motion.article
                className="lifecycle-step"
                key={`${step.name}-${index}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.04, duration: 0.4 }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.name}</strong>
                <p>{step.detail}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ErpLiteSection() {
  const lines = ["Sales.", "Customers.", "Inventory.", "Payments.", "Reporting.", "Recovery.", "Workflow."];

  return (
    <section className="section split-section" id="erp-lite">
      <div className="section-inner split-grid">
        <OperationalMap compact />
        <motion.div
          className="section-copy"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="eyebrow">ERP-Lite Without Enterprise Weight</p>
          <h2>AtlasADE maps the operational reality of a business.</h2>
          <div className="operational-list">
            {lines.map((line, index) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, x: 14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
              >
                {line}
              </motion.span>
            ))}
          </div>
          <p>
            Everything connected in one operational view, so merchants can understand what is
            happening, where attention is needed, and which decisions move the business forward.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function FlowSection() {
  return (
    <section className="section flow-section" id="flow">
      <div className="section-inner">
        <div className="section-heading narrow">
          <p className="eyebrow">Merchant Workflow</p>
          <h2>Atlas is not just a register.</h2>
          <p>
            Every action moves through the business. AtlasADE keeps the operational trail visible,
            coordinated, and ready for insight.
          </p>
        </div>
        <div className="timeline" aria-label="Merchant workflow timeline">
          <motion.div
            className="timeline-pulse"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          {flowSteps.map((step, index) => (
            <motion.div
              className="timeline-node"
              key={step}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.09, duration: 0.5 }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  const modules = atlasData.modules ?? [];

  return (
    <section className="section" id="modules">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">Module Overview</p>
          <h2>Connected systems for the work merchants actually do.</h2>
        </div>
        <div className="module-grid">
          {modules.map((module, index) => {
            const Icon = iconByModule[module.id] ?? Network;
            return (
              <motion.article
                className="module-card"
                key={module.id}
                style={{ "--accent": getAccent(index) }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
                whileHover={{ y: -6, scale: 1.015 }}
              >
                <div className="card-icon" aria-hidden="true">
                  <Icon size={24} />
                </div>
                <h3>{module.name}</h3>
                <p>{module.tagline}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MerchantsSection() {
  return (
    <section className="section merchants-section">
      <div className="section-inner merchant-layout">
        <div className="section-copy">
          <p className="eyebrow">Why Merchants</p>
          <h2>Built for operators. Not software departments.</h2>
          <p>
            AtlasADE is for businesses that need better coordination without hiring a systems team
            or stitching together a maze of point solutions.
          </p>
          <div className="fee-callout">
            <ShieldCheck size={22} aria-hidden="true" />
            <span>No monthly software fee for processing merchants.</span>
          </div>
        </div>
        <div className="reason-grid">
          {merchantReasons.map(([title, copy], index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.05, duration: 0.45 }}
            >
              <Sparkles size={17} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AlphaSection() {
  const merchants = ["coffee shops", "salons", "med spas", "local retail", "service operators", "growing independents"];

  return (
    <section className="section alpha-section" id="alpha">
      <div className="section-inner alpha-panel">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.75 }}
        >
          <p className="eyebrow">Private Alpha</p>
          <h2>Shape the future of merchant systems.</h2>
          <p>
            AtlasADE is currently in private Alpha. We are looking for operationally-minded
            merchants who want to help shape the future of merchant systems.
          </p>
          <div className="merchant-tags">
            {merchants.map((merchant) => (
              <span key={merchant}>{merchant}</span>
            ))}
          </div>
          <a className="button primary" href="mailto:jwong@atlasade.com?subject=AtlasADE%20Alpha%20Access">
            Request Alpha Access <ArrowRight size={18} aria-hidden="true" />
          </a>
        </motion.div>
        <div className="alpha-signal" aria-hidden="true">
          <Network />
          <ChartNoAxesCombined />
          <LifeBuoy />
          <Workflow />
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <footer className="section contact-section" id="contact">
      <div className="section-inner contact-inner">
        <p className="eyebrow">Contact</p>
        <h2>Ready to map your business?</h2>
        <a className="contact-link" href="mailto:jwong@atlasade.com">
          jwong@atlasade.com
        </a>
        <nav className="footer-nav" aria-label="Footer disclosures">
          <a href="#accessibility-statement">Accessibility Statement</a>
          <a href="#privacy-policy">Privacy Policy</a>
          <a href="#terms">Terms</a>
          <a href="mailto:jwong@atlasade.com">Contact</a>
        </nav>
        <div className="disclosure-grid" aria-label="Website policies and accessibility information">
          {disclosureSections.map((section) => (
            <section className="disclosure-panel" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
              <h3 id={`${section.id}-title`}>{section.title}</h3>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
        <div className="footer-line">
          <BrandMark />
          <span>Operational Intelligence for Merchants</span>
          <span>© 2026 AtlasADE. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Navigation />
      <main id="main">
        <Hero />
        <InteractiveAtlasSection />
        <ContentStudioSection />
        <ErpLiteSection />
        <FlowSection />
        <ModulesSection />
        <MerchantsSection />
        <AlphaSection />
        <ContactSection />
      </main>
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")).render(<App />);
