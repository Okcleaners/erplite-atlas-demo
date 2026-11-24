"""Capture the same merchant and documentation views on two local website builds."""
import argparse
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--before", required=True)
parser.add_argument("--after", required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
sizes = [(320, 740), (390, 844), (768, 1024), (1440, 900), (1920, 1080)]
views = ["home", "business-paths", "directory", "answer", "detail", "cafe", "connected", "guide"]

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for label, base in [("before", args.before), ("after", args.after)]:
        assert urlsplit(base).hostname == "127.0.0.1"
        folder = args.output / label
        folder.mkdir(parents=True, exist_ok=True)
        for width, height in sizes:
            ctx = browser.new_context(viewport={"width": width, "height": height})
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

            def shot(name, selector=None):
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (name, width)
                file = folder / f"{width}-{name}.png"
                if selector:
                    page.locator(selector).screenshot(path=file, animations="disabled")
                else:
                    page.screenshot(path=file, animations="disabled")
            page.goto(base, wait_until="networkidle")
            shot("home")
            shot("business-paths", ".business-paths" if label == "after" else "#merchant-types")
            page.goto(base + "/features/", wait_until="networkidle")
            shot("directory")
            query = page.get_by_role("searchbox")
            query.fill("Does selling an oat bar change stock at another store?")
            query.press("Enter")
            expect(page.locator("#help-result")).to_contain_text("Hill stays at 9")
            shot("answer", "#help-result")
            page.goto(base + "/features/location-stock/", wait_until="networkidle")
            shot("detail")
            page.goto(base + "/agents/", wait_until="networkidle")
            shot("guide")
            page.goto(base + "/day-with-atlasade/", wait_until="networkidle")
            shot("cafe")
            for step in ["Open the register", "Meet the first customer", "Add house coffee", "Add oat bar",
                         "Find the customer", "Attach customer", "Continue to checkout",
                         "Complete simulated sale", "Follow this sale"]:
                page.get_by_role("button", name=step, exact=True).click()
            shot("connected", ".sale-map")
            assert not errors, (label, width, errors)
            ctx.close()
            print(label, width, "all eight views captured", flush=True)
    browser.close()

html = ['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>005D visual comparison</title><style>body{font:16px system-ui;color:#203c35;background:#faf6e9;margin:3vw}section{display:grid;grid-template-columns:1fr 1fr;gap:14px}img{width:100%;height:auto}figure{margin:0}summary{cursor:pointer;padding:10px}h2{font:2rem Georgia}</style><h1>Quiet Orbit visual comparison</h1><p>Open a comparison, then select a screenshot to inspect it at full size.</p>']
for name in views:
    html.append(f"<h2>{name.replace('-', ' ').capitalize()}</h2>")
    for width, _ in sizes:
        html.append(f"<details><summary>{width} px</summary><section>")
        for label in ["before", "after"]:
            src = f"{label}/{width}-{name}.png"
            html.append(f'<figure><figcaption>{label.title()}</figcaption><a href="{src}"><img loading="lazy" src="{src}" alt="{label} {name} at {width} pixels"></a></figure>')
        html.append("</section></details>")
(args.output / "index.html").write_text("".join(html), encoding="utf-8")
