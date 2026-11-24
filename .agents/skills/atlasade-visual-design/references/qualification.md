# Visual qualification

## Compare like for like

Use the website's existing browser harnesses in `test/browser/` when they cover the task. Record the baseline commit, route, fixture, browser, viewport and motion setting. Capture at 390 px and 1440 px. Include 768 px for transitions between stacked and side-by-side layouts and 320 px where records or controls risk clipping. Inspect both images for hierarchy, reading order, focal point, depth consistency, focus visibility and asset failures. Keep framing and interaction state identical across each pair. When motion is central, add the first frame, an intermediate frame and the settled state, or record a short interaction clip. Resolve visible defects and capture again.

For a data trace, capture idle, activated, and replay or review states. Hold the same record and location across captures. Verify that display actions leave the underlying transaction, inventory and cash values intact. Give each cue an answerable purpose, such as helping the visitor identify which location's stock changed.

## Accessibility and interaction

- Run keyboard navigation and activation in reading order. Verify focus on both paper and dark surfaces and that expanding a record preserves the user's place.
- Test at touch widths and with reduced motion enabled. Use visible endpoint labels, state text and shapes alongside color. Any live announcement should describe the completed change once.
- Check text contrast against the actual background, including gradients and overlays. Target WCAG AA: 4.5:1 for normal text and 3:1 for large text, with perceivable controls and focus indicators. Inspect at 200% zoom for overlapping or clipped content.
- Check recent and empty states, long labels, and missing assets where relevant. Verify the public explanation and citations with JavaScript disabled, and check that essential meaning is available when the motion or masking feature is unsupported.

## Performance

- Preserve the existing Feature Finder budget of under 25 KB gzipped for the scripts and embedded catalog, as measured by `test/features.test.mjs`. Maintain p95 under 50 ms for input to the second rendered frame on the documented 390 × 844 Chromium profile at 4× CPU throttling (`test/browser/features.py`).
- For café changes, compare trace click-to-second-frame p95 at 390 px using `test/browser/cafe.py`. Measure on the same machine and browser profile with comparable load, and report the before and after. Investigate a repeatable regression before signing off.
- Capture transferred bytes by type and first-load timing in matched cold contexts when adding visual assets, CSS or JS. Set a baseline-relative budget in the plan and record any budget exception with its user-facing benefit. Prefer reserved media dimensions, responsive stills and small native state animations. Avoid continuous rendering and dependencies for a single effect.

For planning-only work, give concrete acceptance conditions and flag any evidence the project still needs. Treat screenshot inspection, measurements and interaction tests as separate proofs.
