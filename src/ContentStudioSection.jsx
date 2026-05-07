import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Eye, Megaphone, PenLine, Radio, ShieldCheck, TrendingUp, Workflow } from "lucide-react";

const studioSignals = [
  ["Sales signals", "Turn products and services that are moving into promotion ideas."],
  ["Customer trends", "Spot repeat visits, seasonal demand, and follow up moments."],
  ["Campaign opportunities", "Find practical reasons to post without inventing marketing noise."],
  ["Owner review", "Drafts stay with the merchant before anything goes public."],
];

const studioFlow = [
  ["Sales", "Real business activity"],
  ["Customer Trends", "What people return for"],
  ["Business Signals", "What changed this week"],
  ["Campaign Ideas", "What is worth saying"],
  ["Draft Support", "Copy ideas for review"],
  ["Merchant Approval", "Owner stays in control"],
  ["Published Content", "Stay visible"],
];

const safeguards = [
  "Owner approval before publishing",
  "No automatic replies",
  "No direct message handling",
  "No uncontrolled social actions",
];

export default function ContentStudioSection() {
  return (
    <section className="section studio-section" id="content-studio">
      <div className="section-inner studio-layout">
        <motion.div
          className="studio-copy"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="eyebrow">Content Studio / Social Observer</p>
          <h2>Stay visible without starting from a blank page.</h2>
          <p>
            AtlasADE can help turn real business activity into content ideas for review: popular
            products, repeat services, seasonal moments, customer trends, and campaign
            opportunities. The owner stays in control.
          </p>
          <div className="studio-proof">
            <ShieldCheck size={22} aria-hidden="true" />
            <span>Content ideas based on real business activity, with merchant approval.</span>
          </div>
          <div className="safeguard-grid" aria-label="Social Observer safeguards">
            {safeguards.map((item) => (
              <span key={item}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="studio-dashboard"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <div className="studio-orbit" aria-hidden="true" />
          <div className="studio-topbar">
            <div>
              <span className="studio-live-dot" />
              Social Observer
            </div>
            <span>Merchant approval required</span>
          </div>

          <div className="signal-grid">
            {studioSignals.map(([title, copy], index) => {
              const icons = [TrendingUp, Eye, Megaphone, Workflow];
              const Icon = icons[index];
              return (
                <motion.article
                  key={title}
                  style={{ "--delay": `${index * 0.18}s` }}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ delay: index * 0.07, duration: 0.45 }}
                >
                  <Icon size={20} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="studio-pipeline" aria-label="Content Studio workflow">
            {studioFlow.map(([title, copy], index) => (
              <motion.div
                className="pipeline-node"
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: index * 0.045, duration: 0.38 }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <small>{copy}</small>
              </motion.div>
            ))}
          </div>

          <div className="draft-card">
            <div className="draft-icon" aria-hidden="true">
              <PenLine size={20} />
            </div>
            <div>
              <h3>Draft help for merchant review</h3>
              <p>
                The system can suggest merchant reviewed content from real signals, then wait for the
                owner to review, edit, approve, and publish.
              </p>
            </div>
            <BrainCircuit className="draft-watermark" aria-hidden="true" />
          </div>

          <div className="observer-strip">
            <Radio size={17} aria-hidden="true" />
            <span>Watch the signals. Suggest useful ideas. Keep the merchant in control.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
