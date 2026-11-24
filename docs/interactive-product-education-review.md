# Interactive product education review

The extension to [$atlasade-visual-design](../.agents/skills/atlasade-visual-design/references/product-education.md) helps a merchant answer a question by varying one input and comparing the consequences. Quiet Orbit remains the visual standard. The lesson design below is a proposal.

## What the reference taught

In the live book, the energy-stores spread paired a prediction with an optional explanation, a five-step account of the demonstration, and controls for identifying each store. The next spread placed a track beside an explanation of energy transfer. In the spring lesson, activating the pull control once changed extension from zero to 0.0050 m. The worked expression changed from zero to 0.0013 J. The valuable interaction was being able to see which input explained that difference. [Every Joule](https://iamtechartist.com/every-joule/)

At 1280 × 720 the facing pages kept the model beside the question, although the tilted text was small. At 390 × 844 part of the scene extended beyond the viewport. Opening the mobile lesson drawer brought upright text, the equation and definitions into view. The browser accessibility tree exposed buttons as alternatives to dragging, prediction choices, a text version, and sound and still-mode controls. These observations establish available affordances. Screen-reader task completion, full keyboard coverage and low-end frame timing were outside this review.

The public Lesson 1 reference is a built distribution. Its tree includes separate lesson, numbers, sound and graphics bundles, and teacher and source entry pages. The Three.js chunk alone is 688,028 bytes uncompressed on disk. That figure describes a file, not observed transfer size or frame time. The HTML includes a WebGL failure message and a JavaScript requirement for opening the book. For Atlasade, keep the worked example readable in HTML and the adjustable model operable with native controls. [Pinned technical reference](https://github.com/iamtechartist/every-joule-lesson1/tree/48591ddc5f0a22e6eb2a5a41c424a426599061ca)

**Reuse boundary.** The pinned tree has no project-wide license file. The live book displays a Techartist copyright notice. The sound credits identify individual source recordings as CC0. Those credits do not grant rights to the book as a whole. The extension uses original instructions, fictional Atlasade records and conceptual observations. It imports no Every Joule code, prose, interface layout, screenshots, font files, sound, graphics or branding. [Sound credits](https://github.com/iamtechartist/every-joule-lesson1/blob/48591ddc5f0a22e6eb2a5a41c424a426599061ca/audio/CREDITS.md) · [GitHub licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)

## Proposed lesson · Does a bigger bill mean a bigger sale?

At River's Front counter, invite the visitor to predict what happens to the drawer if Sam pays for the same coffee and oat bar with a different bill. Offer two tender choices beside receipt #104. Show cash in, change out and the amount retained. Keep the receipt total visible. A disclosure can show how the subtotal and illustrative tax explain that total.

| Fictional trial | Tender | Change | Net cash | Expected drawer |
| --- | ---: | ---: | ---: | ---: |
| Pay with a ten | $10.00 | $1.60 | $8.40 | $208.40 |
| Pay with a twenty | $20.00 | $11.60 | $8.40 | $208.40 |

Compare independent alternatives from the same prepayment ticket. The published café uses the ten. The twenty is an educational variation. In both, the receipt has $8.00 in sales and $0.40 in illustrative tax, a $200.00 opening drawer and one oat bar sold at River. Render every amount from the fixture and selected transition. An optional trace or equation reveal only inspects the resulting record. A visitor who tries both has compared two possible payments for one sale. [Website scenario](../src/day/scenario.ts)

Ask the visitor what would happen with exact change and why. A correct explanation identifies zero change and the same $8.40 retained. Keep the comparison readable with motion off, give touch and keyboard users the same controls, and supply the worked comparison as HTML. In any future implementation, compare matched screenshots and measure the interaction on the existing throttled mobile profile. This planning review establishes neither measured learner comprehension nor performance for a built lesson.

## Qualification

Codex discovered the updated skill as enabled in the website repository. An explicit, ephemeral read-only invocation of `$atlasade-visual-design` produced the two tender trials above and proposed a $50 transfer question ($41.60 change). It called for keyboard-operable radio buttons, a motion-free comparison, input-to-render p95 against the existing café baseline, and a first-time visitor explaining where the extra cash went. The exercise used the approved mobile homepage image and repository reference text. It produced a plan only.

The skill validator passed. Direct calls to the existing scenario engine reproduced both worked trials and the exact-change control, rejected a one-cent underpayment, and left a completed payment unchanged on repeat submission. All 35 website tests passed. The rebuilt production and preview directories each matched all 41 paths and SHA-256 values in their respective qualified release manifests.
