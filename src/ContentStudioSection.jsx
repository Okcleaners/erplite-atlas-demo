import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2, Eye, Megaphone, PenLine, Radio, ShieldCheck, TrendingUp, Workflow } from "lucide-react";

const studioSignals = [
  ["Sales signals", "Turn best-selling products and services into promotion ideas."],
  ["Customer trends", "Spot repeat behavior, seasonal demand, and follow-up opportunities."],
  ["Campaign opportunities", "Find practical reasons to post without inventing marketing noise."],
  ["Approval workflow", "Drafts stay merchant-controlled before anything goes public."],
];

const studioFlow = [
  ["Sales", "Real business activity"],
  ["Customer Trends", "What people return for"],
  ["Operational Signals", "What changed this week"],
  ["Campaign Ideas", "What is worth saying"],
  ["AI Draft Assist", "Copy support, not autopilot"],
  ["Merchant Approval", "Owner stays in control"],
  ["Published Content", "Consistent visibility"],
];

const safeguards = [
  "No autonomous posting",
  "No AI replying",
  "No AI DMs",
  "No uncontrolled social automation",
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
          <h2>Turn operational activity into better merchant marketing.</h2>
          <p>
            AtlasADE helps merchants understand what is happening inside the business and turn
            real activity into content opportunities, campaign ideas, and safer AI-assisted drafts.
          </p>
          <div className="studio-proof">
            <ShieldCheck size={22} aria-hidden="true" />
            <span>Operationally-informed content guidance. Not social media autopilot.</span>
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
              <h3>AI-assisted draft generation</h3>
              <p>
                The system can suggest merchant-safe content from real signals, then wait for the
                owner to review, edit, approve, and publish.
              </p>
            </div>
            <BrainCircuit className="draft-watermark" aria-hidden="true" />
          </div>

          <div className="observer-strip">
            <Radio size={17} aria-hidden="true" />
            <span>Observe signals. Recommend opportunities. Keep the merchant in control.</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
