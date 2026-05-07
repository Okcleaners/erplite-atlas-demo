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
import atlasData from "../atlas-data.json";
import "./styles.css";

const navItems = [
  ["Home", "home"],
  ["Merchants", "merchant-types"],
  ["Atlas", "atlas"],
  ["Helps", "helps"],
  ["ERP Lite", "erp-lite"],
  ["Partners", "alpha"],
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

const merchantTypes = [
  "Coffee shops",
  "Salons",
  "Med spas",
  "Local retail",
  "Service businesses",
  "Small hospitality",
  "Specialty shops",
  "Independent merchants",
];

const helpCards = [
  ["Know what sold", "See what moved today without rebuilding the day from receipts."],
  ["Know who came in", "Connect customer visits and history when the customer chooses to share it."],
  ["Know what needs restocking", "See which products moved and what may need attention soon."],
  ["Know what needs follow up", "Keep customer and service follow up visible after the sale."],
  ["Know what happened today", "Review sales, payments, refunds, saved work, and exceptions before close."],
  ["Know what to post or promote", "Turn real products, services, and seasonal signals into content ideas for review."],
  ["Know what needs attention before closing", "Make unresolved work visible so owners are not closing blind."],
  ["Know where the pieces connect", "See how money, customers, products, and daily work fit together."],
];

const merchantReasons = [
  ["Less running between tools", "One operating view for sales, customers, inventory, reporting, and daily work."],
  ["Cleaner information at close", "Owners can review the day without rebuilding the story by hand."],
  ["Built for owners", "Designed for owners, managers, and lean teams doing the work."],
  ["Attention before surprises", "Stock, saved work, payment exceptions, and follow up stay visible."],
  ["Practical guidance", "Helpful prompts and draft support with the owner still in control."],
  ["ERP Lite made smaller", "Enterprise Resource Planning, simplified for small merchants."],
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
      "The website is provided without a guarantee that every detail will be uninterrupted or free of errors. For questions, email jwong@atlasade.com.",
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
        Partner
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
      <svg viewBox="0 0 100 100" className="map-svg" role="img" aria-label="Animated business map">
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
            <span>Business System For Merchants</span>
          </div>
          <p className="eyebrow">Built For Small Merchants</p>
          <h1>Run your business without running between systems.</h1>
          <p className="hero-brand-line">Know what sold, what needs attention, and where the day is going.</p>
          <p className="hero-subtitle">
            AtlasADE is an ERP Lite system for small merchants, solo owners, and lean teams. It
            helps keep sales, customers, inventory, payments, reporting, content ideas, and daily
            work connected so owners can spend less time chasing answers and more time running
            the business.
          </p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={() => scrollToSection("alpha")}>
              Join Early Partner Program <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="button secondary" type="button" onClick={() => scrollToSection("merchant-types")}>
              See Who It Fits
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

function MerchantTypesSection() {
  return (
    <section className="section merchant-types-section" id="merchant-types">
      <div className="section-inner merchant-types-layout">
        <div className="section-heading">
          <p className="eyebrow">Merchant Fit</p>
          <h2>Built for merchants like these.</h2>
          <p>
            Coffee shops, salons, med spas, local retail, service businesses, small hospitality,
            specialty shops, and independent merchants all need the same basic thing: a clearer
            way to see what is happening.
          </p>
        </div>
        <div className="merchant-type-grid" aria-label="Compatible merchant types">
          {merchantTypes.map((merchant, index) => (
            <motion.article
              key={merchant}
              className="merchant-type-card"
              style={{ "--accent": getAccent(index) }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.04, duration: 0.4 }}
            >
              <Store size={18} aria-hidden="true" />
              <h3>{merchant}</h3>
            </motion.article>
          ))}
        </div>
        <p className="merchant-fit-note">
          AtlasADE is not locked to one industry. It is not built only for restaurants, salons,
          or retail. It is designed around the daily business patterns most small merchants share.
        </p>
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
          <p className="eyebrow">See how the business connects</p>
          <h2>Understand what is happening without jumping between systems.</h2>
          <p>
            Select any module to see what sold, who came in, what needs attention, what needs
            restocking, what needs follow up, what to review before closing, and what content or
            promotion might be worth considering.
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
                  aria-selected={isSelected}
                  aria-label={`${module.name}. ${module.tagline}. Select to see what this area touches and what it helps the owner understand.`}
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
            <div
              className="atlas-detail-body"
              tabIndex={0}
              aria-label={`${selectedModule.name} details. Scroll this area to read longer module information.`}
            >
              <p className="atlas-description">{selectedModule.description}</p>
              <div className="atlas-outcome-block">
                <h4>Why it matters</h4>
                <p>{selectedModule.whyItMatters}</p>
              </div>
              <div className="atlas-detail-grid">
                <div>
                  <h4>What this connects</h4>
                  <ul>
                    {selectedModule.connectedEndpoints.map((endpoint) => (
                      <li key={endpoint}>{endpoint}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>What this helps you know</h4>
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
            </div>
          </motion.aside>
        </div>

        <div className="purchase-lifecycle">
          <div className="purchase-lifecycle-head">
            <p className="eyebrow">{atlasData.lifecycle?.title ?? "Follow a customer purchase"}</p>
            <h3>From customer lookup to a business record the owner can trust.</h3>
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
  const lines = [
    "Sales.",
    "Customers.",
    "Inventory.",
    "Payments.",
    "Reporting.",
    "Content ideas.",
    "Daily operations.",
  ];

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
          <p className="eyebrow">ERP Lite, explained simply</p>
          <h2>Enterprise Resource Planning, simplified for small merchants.</h2>
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
            Instead of separate tools for sales, customers, inventory, reports, marketing notes,
            and daily work, AtlasADE keeps the pieces connected in one practical view.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function HelpCardsSection() {
  const icons = [BarChart3, UsersRound, Boxes, RefreshCcw, Workflow, Megaphone, ShieldCheck, Network];

  return (
    <section className="section helps-section" id="helps">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">What AtlasADE helps with</p>
          <h2>Know the answers owners ask every day.</h2>
          <p>
            Small merchants deserve the same clear view larger companies already have, without
            needing a software team to get it.
          </p>
        </div>
        <div className="help-grid">
          {helpCards.map(([title, copy], index) => {
            const Icon = icons[index] ?? Sparkles;
            return (
              <motion.article
                className="help-card"
                key={title}
                style={{ "--accent": getAccent(index) }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: (index % 4) * 0.05, duration: 0.42 }}
              >
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HardwareSection() {
  const hardwareCards = [
    ["Modern workstations", "Designed for modern Apple based merchant workstations."],
    ["Practical peripherals", "Built to support merchant work without forcing every business into one hardware path."],
    ["Less vendor lock in", "The system stays focused on the business, not the hardware vendor."],
  ];

  return (
    <section className="section hardware-section" id="hardware">
      <div className="section-inner hardware-layout">
        <div className="section-heading">
          <p className="eyebrow">Hardware direction</p>
          <h2>Hardware flexible by design.</h2>
          <p>
            AtlasADE is designed to support merchant work without forcing the business into a
            single proprietary hardware path. The goal is to let merchants use practical, modern
            tools while keeping the system focused on the business, not vendor lock in.
          </p>
        </div>
        <div className="hardware-grid">
          {hardwareCards.map(([title, copy], index) => {
            const icons = [Store, Workflow, ShieldCheck];
            const Icon = icons[index];
            return (
              <motion.article
                className="hardware-card"
                key={title}
                style={{ "--accent": getAccent(index + 1) }}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.06, duration: 0.42 }}
              >
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
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
    <section className="section merchants-section" id="owners">
      <div className="section-inner merchant-layout">
        <div className="section-copy">
          <p className="eyebrow">Owner Time</p>
          <h2>Built for owners who do not have time to chase the business.</h2>
          <p>
            Most small business owners are not short on effort. They are short on time, clean
            information, and systems that work together. AtlasADE is built to reduce the daily
            search for answers: what sold, what needs attention, what customers need follow up,
            what inventory moved, what content should be reviewed, and what happened today.
          </p>
          <div className="owner-callout">
            <ShieldCheck size={22} aria-hidden="true" />
            <span>One operating view for everyday merchant decisions.</span>
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
  const merchants = ["coffee shops", "salons", "med spas", "local retail", "service businesses", "specialty shops"];

  return (
    <section className="section alpha-section" id="alpha">
      <div className="section-inner alpha-panel">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.75 }}
        >
          <p className="eyebrow">Early merchant partner program</p>
          <h2>Help shape simpler merchant operations.</h2>
          <p>
            We are working with a small group of merchants who want simpler tools, clearer
            information, and a system shaped around how their business actually runs.
          </p>
          <div className="merchant-tags">
            {merchants.map((merchant) => (
              <span key={merchant}>{merchant}</span>
            ))}
          </div>
          <a className="button primary" href="mailto:jwong@atlasade.com?subject=AtlasADE%20Alpha%20Access">
            Request Partner Access <ArrowRight size={18} aria-hidden="true" />
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
          <span>ERP Lite system for small merchants</span>
          <span>(c) 2026 AtlasADE. All rights reserved.</span>
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
        <MerchantTypesSection />
        <InteractiveAtlasSection />
        <HelpCardsSection />
        <ErpLiteSection />
        <HardwareSection />
        <MerchantsSection />
        <AlphaSection />
        <ContactSection />
      </main>
    </MotionConfig>
  );
}

createRoot(document.getElementById("root")).render(<App />);
