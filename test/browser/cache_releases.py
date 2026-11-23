"""Verify an open Help tab across corrections, withdrawal, midnight UTC and offline return."""
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[2]
with subprocess.Popen(
    ["node", "test/fixtures/cache-releases.mjs"], cwd=root, stdin=subprocess.PIPE,
    stdout=subprocess.PIPE, text=True, encoding="utf-8"
) as origin:
    base = origin.stdout.readline().strip()
    assert base.startswith("http://127.0.0.1:")
    def promote(label):
        origin.stdin.write(label + "\n")
        origin.stdin.flush()
        assert origin.stdout.readline().strip() == label

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width":390,"height":844})
            page = ctx.new_page()
            page.clock.install(time="2031-01-03T23:59:10Z")
            page.goto(base+"/features/")
            field = page.get_by_role("searchbox")
            help_box = page.locator("#help-result")

            def ask(question):
                field.fill(question)
                field.press("Enter")

            ask("Does selling an oat bar change stock at another store?")
            expect(help_box).to_contain_text("Hill stays at 9")
            promote("B")
            page.dispatch_event("body", "visibilitychange", {"bubbles": True})
            expect(help_box).to_contain_text("Refresh the directory")
            expect(help_box).not_to_contain_text("Hill stays at 9")
            page.get_by_role("link", name="Reload Feature Finder").click()
            ask("Does selling an oat bar change stock at another store?")
            expect(help_box).to_contain_text("Synthetic correction")
            expect(help_box.locator("[data-revision]")).to_have_attribute("data-revision","2")
            ask("Cash checkout and change")
            expect(help_box).to_contain_text("$1.60")
            promote("C")
            page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}))")
            expect(help_box).to_contain_text("Refresh the directory")
            page.get_by_role("link", name="Reload Feature Finder").click()
            ask("Cash checkout and change")
            expect(help_box).to_contain_text("no verified answer")
            ask("Opening a register")
            expect(help_box).to_contain_text("Synthetic opening claim")
            page.clock.fast_forward(51000)
            expect(help_box).to_contain_text("no verified answer")
            expect(page.locator('article[data-feature="open-register"]')).to_have_count(0)
            ctx.set_offline(True)
            page.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}))")
            expect(help_box).to_contain_text("Refresh the directory")
            expect(field).to_be_hidden()
            ctx.close()
            nojs = browser.new_context(java_script_enabled=False)
            doc = nojs.new_page()
            doc.goto(base+"/features/open-register/")
            expect(doc.locator("main")).to_contain_text("2031-01-04 at 00:00 UTC")
            expect(doc.locator("main")).not_to_contain_text("Synthetic opening claim")
            promote("D")
            doc.reload()
            expect(doc.locator("main")).to_contain_text("review has expired")
            doc.goto(base+"/features/cash-checkout/")
            expect(doc.locator("main")).to_contain_text("has been withdrawn")
            browser.close()
            print("PASS open-tab correction, withdrawal, midnight expiry, offline return, and JS-free notices")
    finally:
        origin.stdin.close()
