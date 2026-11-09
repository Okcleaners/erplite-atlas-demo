export const site = "https://www.atlasade.com";
export const contact = "jwong@atlasade.com";

// Only existing public statements and explicit availability limits belong here.
// Pending product claims are tracked in docs/website-readiness.md, not exported.
export const pages = [
  {
    path: "/product/",
    title: "AtlasADE product overview | Merchant business software",
    heading: "A clearer view of everyday merchant work",
    description: "Learn what AtlasADE is designed to connect, who the alpha website is for, and how to check current product availability.",
    sections: [
      { id: "what-is-atlas", question: "What is AtlasADE?", answer: "AtlasADE is an early merchant business system designed to connect sales, customers, inventory, reporting, content ideas, and daily work. This website explains the product direction and invites inquiries about limited alpha access." },
      { id: "connected-work", question: "What business problems is it designed to address?", answer: "The product map focuses on questions owners ask during a working day: what sold, which customer needs follow up, what stock needs attention, and what needs review before closing. These are intended areas of support, not a promise that every workflow is commercially available." },
      { id: "erp-lite", question: "Is AtlasADE a full enterprise ERP replacement?", answer: "No. The public product description uses ERP Lite to mean a simpler way to connect everyday merchant work. AtlasADE is not represented as a full enterprise ERP replacement." },
      { id: "who-it-is-for", question: "Who is the product intended for?", answer: "The public overview addresses small independent merchants, including coffee shops, salons, local retail, service businesses, and specialty shops. A mention of a business type does not establish suitability for every industry requirement. Confirm the fit for your business with the team." },
    ],
  },
  {
    path: "/deployment/",
    title: "AtlasADE deployment questions | Website and POS availability",
    heading: "Understand the website and deployment options",
    description: "Distinguish the AtlasADE information website from merchant POS deployment, and ask about supported devices and connectivity before choosing a system.",
    sections: [
      { id: "website-or-pos", question: "Is this website the merchant POS application?", answer: "No. This is AtlasADE's public information website. It provides no account login and collects no payment information. Visiting it does not give access to a merchant's operational system or records." },
      { id: "supported-deployment", question: "Which devices and deployment options can I use?", answer: "Ask the AtlasADE team to confirm the devices, installation process, supported peripherals, and connectivity requirements for the current alpha. This website does not establish a generally available self-service installation or hosted POS offering." },
      { id: "offline-card", question: "Does local POS operation mean card payments work offline?", answer: "No. Where a POS runs and whether a payment provider supports offline card acceptance are separate questions. Do not assume offline card acceptance from the phrase local operation. Confirm payment and connectivity requirements for your proposed setup." },
      { id: "website-hosting", question: "Does hosting the website in the cloud mean merchant data is hosted there?", answer: "No. Public website hosting and merchant operational deployment are separate decisions. This informational website provides no access to merchant databases, customer records, or payment credentials." },
    ],
  },
  {
    path: "/availability/",
    title: "AtlasADE availability and limitations | Alpha access",
    heading: "Current access and product limitations",
    description: "AtlasADE alpha availability is limited and subject to change. Learn how to distinguish available functionality, demonstrations, planned work, and roadmap ideas.",
    sections: [
      { id: "access", question: "Can I sign up and start using AtlasADE today?", answer: "Alpha availability is limited and subject to change. Contact the team to ask about current access and suitability. This website does not provide self-service account creation, a software download, or an online purchase." },
      { id: "status", question: "Are all areas in the product map commercially available?", answer: "No. The product map explains intended connections between areas of merchant work. It is not a release manifest. Confirm which workflows are available in the specific setup you are considering." },
      { id: "labels", question: "How should I interpret capability status?", answer: "Shipped means verified in an identified released product and available under stated conditions. Demonstrable means shown in a bounded demonstration, with availability confirmed separately. Planned means development intent. Roadmap means future direction without an availability commitment. This website does not label a capability shipped without an approved release statement." },
      { id: "payments-and-integrations", question: "Can I assume a payment provider, integration, or hardware device is supported?", answer: "No. Confirm the exact provider, device, region, integration, and supported workflow with the team. A diagram or product category is not a guarantee of compatibility, payment certification, or live processing availability." },
      { id: "pricing", question: "Where can I confirm pricing?", answer: "Contact the team for current terms. These pages do not publish a price, a free plan, or a commercial offer." },
    ],
  },
  {
    path: "/faq/",
    title: "AtlasADE questions | Stock, customers, day close, and access",
    heading: "Questions to ask before choosing merchant software",
    description: "Direct answers about AtlasADE's product direction, inventory and customer workflows, day close, limited alpha access, and supported deployment scope.",
    sections: [
      { id: "stock", question: "How can I avoid selling stock I do not have?", answer: "Look for a POS workflow that checks tracked stock before completing a sale and explains how counts and adjustments affect availability. Inventory is an area in AtlasADE's product map. Ask the team to demonstrate the supported workflow in the current alpha before relying on it." },
      { id: "customers", question: "Can staff find a returning customer's purchase history?", answer: "Customer history is an intended connection in the AtlasADE product map. Ask which customer lookup and history views are included in your proposed setup, what information is recorded, and how staff access is controlled. The website alone does not confirm release availability." },
      { id: "close", question: "How can I see unfinished work before closing the day?", answer: "Ask for a demonstration of daily reporting and how unresolved work is presented before close. AtlasADE's public overview identifies end-of-day visibility as a product goal; the exact supported workflow must be confirmed for the current alpha." },
      { id: "ai", question: "Does AtlasADE promise that AI runs my business?", answer: "No. The public overview describes guidance and draft support with the owner in control. It does not establish autonomous business operation or automatic publishing as commercially available functionality." },
      { id: "contact", question: "How do I check whether AtlasADE fits my business?", answer: "Email the team with your business type, current tools, and the workflow you want to improve. Ask for the current availability statement and a demonstration of the specific workflow that matters to you. Do not send customer records or payment information." },
    ],
  },
];
