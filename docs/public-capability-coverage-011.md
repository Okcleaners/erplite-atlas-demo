# Atlasade public capability coverage

Audit date November 24, 2026. Production had 15 canonical pages and seven Finder records. The candidate starts at compatibility commit `bd50d418fcd3ac28ee33da419b7ca232f660c7f5`. It preserves the seven published records and their URLs, adds 23 records, and covers all ten official product-map modules with dedicated records. The compiled candidate has 38 canonical pages and eight Finder categories.

The audit used the live sitemap, homepage and all ten module descriptions, the deployed module data for roadmap labels, the product overview, deployment, availability, FAQ, River & Oak walkthrough, seven feature pages, and the agent release. The independent merchant, multi-location and enterprise entrances were checked on the homepage. The `/app/` compatibility entry mirrors the homepage. The historical repository documentation route and the standalone source data route returned 404 on the public site. [Homepage and module explorer](https://www.atlasade.com/#atlas) · [Public sitemap](https://www.atlasade.com/sitemap.xml) · [Original feature directory](https://www.atlasade.com/features/)

## Product-map modules

| Official module | Before | Candidate Finder record | Scope and representative search terms |
| --- | --- | --- | --- |
| Sales Register | Three café steps and no system entry | `point-of-sale` | POS, point of sale, cash register, checkout, sales tax, receipt. Controlled-beta cash workflows, with other tenders and deeper order handoff qualified. |
| Customer/CRM | `customer-lookup` covered the fictional regular. CRM did not resolve. | `crm` | CRM, customer relationship management, customer management, profiles, purchase history, phone lookup, follow-up and data access. Bounded demonstrations and wider product direction. |
| Inventory | `location-stock` covered one tracked item at two fictional stores. | `inventory` | Stock control, receiving, counts, adjustments, tracked goods, prepared items, low-stock alerts and ingredients. Bounded demonstrations and roadmap ideas are identified in the detail. |
| Payments & Recovery | `cash-checkout` was fictional. `offline-card` was qualified. | `payments-recovery` | Payment processing, credit cards, tenders, terminals, declines, interruptions, manager review and settlement. Provider, device, region and recovery limits apply. |
| Reporting | `daily-cash` covered one fictional drawer. | `reporting` | Sales reports, analytics, daily totals, tax, tender, customer and refund views, scheduled reports, role views and store comparisons. Named report delivery and reconciliation require confirmation. |
| Business Operations | Opening and close appeared as café steps. | `business-operations` | Saved and reopened tickets, held orders, manager review, unfinished work, business-day close, task checklists and approvals. Role and close rules depend on the setup. |
| Guidance Assistant | Missing | `guidance-assistant` | Atlas Assistant, AI guidance, cashier help, item lookup, recovery guidance, coaching and voice help. Broader guidance is planned and the development demonstrations are bounded. |
| Content Studio / Social Observer | Missing | `content-studio` | Marketing drafts, social media, content planning, campaigns, brand voice and publishing. The public scope is local draft development with merchant review. |
| Integrations | Offline card record gave a provider caveat. | `integrations` | Connectors, data sync, hardware, payment, accounting, inventory, marketing and analytics connections. The categories describe product direction. |
| Backup & Replay | Café replay was part of the exercise. | `backup-replay` | Backup, restore, restart recovery, records, checkpoints and cloud backup. Bounded development checks and roadmap ideas. |

The Finder landing page organizes these records alongside the detail records below. An exact reviewed question can return a scoped Help answer. Additional qualifiers and compound requirements can lead to related reading or uncertainty. Test cases cover official names, all authored terms and questions, and combinations such as CRM plus cross-location stock transfers, offline gift-card acceptance, and staff scheduling plus payroll.

## Merchant paths, related capabilities, and product documentation

| Public system or question | Before | Candidate Finder record | Public basis and status |
| --- | --- | --- | --- |
| Independent merchant checkout | Café steps | `point-of-sale`, `products-pricing`, and the café records below | Homepage independent-business entrance and Sales Register map. |
| Products, menu, item catalog, product and service prices | `sales-ticket` showed two fictional items. | `products-pricing` | Sales Register map and café ticket. Price setup, modifiers, overrides and price lists require confirmation. |
| Customer loyalty, segments, privacy controls and marketing exports | Missing | `loyalty-customer-segments`, `crm` | CRM product map and FAQ. Loyalty and segments are roadmap ideas. Data governance and exports need setup-specific confirmation. |
| Employee management, staff access and roles | Missing | `employee-management` | Business Operations map. Role and manager-review demonstrations are bounded. Shift management is a roadmap idea. |
| Multi-location operations and stock scope | `location-stock` covered one comparison. | `multi-location`, `location-stock` | Growing-across-locations entrance, Inventory and Reporting map, and café. Transfers and consolidated operations remain unverified. |
| Enterprise and ERP Lite | Missing | `erp-lite` | ERP Lite homepage section and product overview. Connected merchant work is a development direction with workflow-by-workflow availability. |
| Scheduling, reservation and service-history questions | Missing | `appointments-service-history` | CRM roadmap mentions appointment or service history. The record limits that scope and directs booking, calendar, capacity and reservation questions to confirmation. |
| Purchasing and suppliers | Missing | `purchasing-suppliers` | Inventory and Integrations roadmap descriptions name supplier ordering and inventory suppliers. Receiving stock is covered by the Inventory record. |
| Refunds, voids, corrections and restocking | Missing | `refunds-voids`, `reporting`, `inventory` | Payments, Inventory and Reporting map. Refund, void, restock, settlement and correction rules remain setup-specific. |
| Accounting and report exports | Missing | `accounting-exports` | Reporting and Integrations map. Handoffs, file formats, connectors and posting need separate confirmation. |
| Online ordering | Missing | `online-ordering` | Integrations roadmap. Ordering channels, fulfillment and payments require confirmation. |
| Deployment, installation, hardware, connectivity and merchant data | `offline-card` covered only card acceptance. | `pos-deployment`, `offline-card` | Hardware and deployment pages. Local Mac rehearsal, merchant hosting, supported peripherals, connectivity and offline cards have distinct scopes. |
| Alpha, Atlasade subscription pricing and business fit | Missing | `merchant-availability` | Availability and product audience pages. Contact for current terms, access and the suitable supported workflow. |

The roadmap section in the product overview gives the approved public roadmap labels a readable citation. It carries forward appointment or service history, loyalty offers, customer segments, supplier ordering, inventory suppliers and online ordering as ideas without an availability commitment. [Product overview](https://www.atlasade.com/product/) · [Deployment](https://www.atlasade.com/deployment/) · [Availability](https://www.atlasade.com/availability/) · [Merchant FAQ](https://www.atlasade.com/faq/)

## Café and legacy Finder pages

| Public workflow | Before | Candidate coverage |
| --- | --- | --- |
| Open River with the fictional float | `open-register` | Same record and canonical URL. |
| Add items and calculate illustrative tax | `sales-ticket` | Same record and URL, with `products-pricing` for the catalog context. |
| Find and attach a fictional regular | `customer-lookup` | Same record and URL, with `crm` for the broader system. |
| Take simulated cash, give change and view the receipt | `cash-checkout` | Same record and URL, with `point-of-sale` and `payments-recovery` for the system context. |
| Follow one sale across cashier, operator and finance | `location-stock` covered the stock effect. | `cafe-sale-trace` describes the connected receipt, stock movement, revenue and tax. |
| Compare River and Hill stock | `location-stock` | Same record and URL, with `multi-location` for the operating scope. |
| Count the drawer, review a variance, close and replay | `daily-cash` | Same record and URL. `business-operations` covers closeout scope and `backup-replay` covers merchant restart and restore questions. |
| Ask about card acceptance during an outage | `offline-card` | Same record, URL and unverified scope. |

The example remains fictional. The public graph contains 30 capability nodes, six café chapter nodes and nine reviewed demonstration links. A chapter remains available through its other current links when an individual capability is withdrawn. [River & Oak café](https://www.atlasade.com/day-with-atlasade/)

## Claims requiring further approval

- Gift cards, gift certificates and stored value had no Atlasade capability description in the audited public pages or product-map bundle. Workspace configuration appeared in repository design notes as a future demonstration candidate. Both require approved public scope and evidence before catalog publication.
- The appointment-history and supplier-ordering roadmap descriptions provide no basis to promise reservation capacity, calendars, online booking, purchase orders, automatic purchasing or supplier connectors.
- Live card processing, refunds, reversals, settlement, device or processor compatibility, and offline card acceptance require engineering and product approval for the exact setup.
- Commercial availability, rollout timing, multi-location transfers and consolidation, employee scheduling and payroll, accounting synchronization, automated reconciliation, production backup or restore guarantees, and autonomous social or assistant actions require separately approved claims.

## Shared release

The catalog generates the Finder, Help, static feature pages, agent JSON, relationship graph and manifest. MCP reads and revalidates that same public release. The candidate release ID is `atlasade-3ec0ffb296a6ab057c42236cd7594388899dfdced4232a8e749fd59504cbb18b`. All 30 records carry unverified commercial availability. The review pins preserve the existing seven records and the correction, withdrawal, deadline, and current-release checks.

## Local qualification

- The website suite passed all 36 tests. Search checks covered all 30 titles, 271 aliases and 83 reviewed questions. The MCP suite passed all four tests, the two-instance workerd suite passed, and the Python MCP reference client negotiated the candidate release and completed its four calls.
- Chromium 149, Firefox 151 and WebKit 26.5 passed Finder, Help, manifest deadlines and the café journey with the compatibility layout fallbacks. Chromium also passed the open-tab correction, withdrawal, UTC expiry and offline checks. The before-and-after visual comparison covered 320, 390, 768, 1440 and 1920 px.
- Search scripts and the embedded index measured 5,755 bytes gzipped before and 13,614 after, under the 25,000-byte budget. Matched Chromium runs at 390 × 844 and 4× CPU throttling measured 25.3 ms p95 before and 24.6 ms after, under the 50 ms budget. Each run measured input to the second animation frame over 80 updates after eight warmups.
- The supplemental strict raw MCP probe reproduced the documented Windows loopback framing issue. The Python and Node fixture servers each returned 14 of 24 valid raw responses. Workerd passed both gzip cases and failed both identity cases. See [004E transport qualification](../mcp/qualification/transport-004e.md).
