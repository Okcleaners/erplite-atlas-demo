"""Compare built loopback homepages and record a real connected sale in Chromium."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--before", required=True)
parser.add_argument("--after", required=True)
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
timings = []
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    for label, base in [("before", args.before), ("after", args.after)]:
        assert urlsplit(base).hostname in {"localhost", "127.0.0.1"}
        for width, height in [(320, 740), (390, 844), (768, 1024), (1440, 900), (1920, 1080)]:
            ctx = browser.new_context(viewport={"width": width, "height": height},
                                      reduced_motion="reduce" if width == 768 else "no-preference")
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
            page.goto(base, wait_until="networkidle")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            for text in ["Try the café day", "Find a feature"]:
                expect(page.get_by_role("link", name=text, exact=True).first).to_be_in_viewport()
            timings.append(dict(label=label, width=width, **page.evaluate("""() => ({
                load: performance.getEntriesByType('navigation')[0].loadEventEnd,
                fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
            })""")))
            page.screenshot(path=args.output / f"{label}-{width}.png", animations="disabled")
            if label == "after":
                fig = page.locator(".sale-portrait")
                expect(fig).to_contain_text("Sam Reed")
                expect(fig).to_contain_text("12 → 11")
                expect(fig).to_contain_text("Hill stays at 9")
                follow = fig.get_by_role("button")
                follow.focus()
                page.keyboard.press("Enter")
                expect(fig.get_by_role("status")).to_contain_text("retained $8.40")
                motion = fig.locator(".signal").first.evaluate("el => getComputedStyle(el).animationName")
                assert motion == ("none" if width == 768 else "travel")
            assert not errors, errors
            ctx.close()

    out = args.output
    ctx = browser.new_context(viewport={"width": 1440, "height": 900},
                              record_video_dir=out, record_video_size={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(args.after, wait_until="networkidle")
    page.wait_for_timeout(1200)
    page.get_by_role("button", name="Follow this sale").click()
    page.wait_for_timeout(2300)
    page.get_by_role("link", name="Try the café day", exact=True).click()
    for label in ["Open the register", "Meet the first customer", "Add house coffee", "Add oat bar",
                  "Find the customer", "Attach customer", "Continue to checkout", "Complete simulated sale",
                  "Follow this sale", "See inventory change", "See where the money went"]:
        control = page.get_by_role("button", name=label, exact=True)
        control.scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        control.click()
        if label in {"Follow this sale", "See inventory change", "See where the money went"}:
            page.locator(".sale-map").scroll_into_view_if_needed()
            page.wait_for_timeout(1700)
    video = page.video
    ctx.close()
    Path(video.path()).replace(out / "connected-sale.webm")
    (out / "homepage-timings.json").write_text(json.dumps(timings, indent=2))
    print(timings)
    browser.close()
