"""Run against the compiled loopback preview with installed Python Playwright."""
import argparse
import json
import math
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="http://127.0.0.1:18744")
parser.add_argument("--output", type=Path, required=True)
args = parser.parse_args()
assert urlsplit(args.base).hostname in {"localhost", "127.0.0.1"}
args.output.mkdir(parents=True, exist_ok=True)
question = "Does selling an oat bar change stock at another store?"
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(390,844), (768,1024), (1440,900)]:
        ctx = browser.new_context(viewport={"width":width,"height":height}, reduced_motion="reduce" if width==768 else "no-preference")
        page = ctx.new_page()
        errors, requests = [], []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda e: errors.append(e.text) if e.type=="error" else None)
        page.on("request", lambda r: requests.append(r.url))
        def shot(label):
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.screenshot(path=args.output/f"{width}-{label}.png")
        page.goto(args.base + "/features/", wait_until="networkidle")
        field = page.get_by_role("searchbox")
        expect(field).to_be_visible()
        shot("directory")
        if width == 1440:
            for _ in range(12):
                page.keyboard.press("Tab")
                if field.evaluate("e => e === document.activeElement"):
                    break
            expect(field).to_be_focused()
        category = page.get_by_label("Category", exact=True)
        category.select_option("Payments")
        expect(page.locator("#results article")).to_have_count(2)
        page.get_by_label("Product lifecycle",exact=True).select_option("planned")
        expect(page.locator("#no-matches")).to_be_visible()
        page.get_by_role("button",name="Clear filters").click()
        for q in ["drawer","Can cash checkout automatically refund another location?"]:
            field.fill(q)
            field.press("Enter")
            expect(page.locator("#help-result")).to_contain_text("no verified answer")
        before = len(requests)
        field.fill(question)
        field.press("Enter")
        answer = page.locator("#help-result")
        expect(answer).to_contain_text("Hill stays at 9")
        expect(answer).to_contain_text("unverified")
        expect(answer).to_contain_text("Confirm")
        assert len(requests) == before
        answer.scroll_into_view_if_needed()
        shot("answer")
        page.get_by_role("link",name="Location-scoped inventory",exact=True).click()
        expect(page).to_have_url(args.base+"/features/location-stock/")
        shot("detail")
        page.get_by_role("link",name="Read “Follow the sale”").click()
        expect(page.locator("details.walkthrough")).to_have_attribute("open","")
        expect(page.locator("#walkthrough-follow-the-sale")).to_be_in_viewport()
        expect(page.locator(".register-status")).to_have_text("Register closed")
        shot("walkthrough")
        assert not errors, errors
        assert all(urlsplit(url).netloc==urlsplit(args.base).netloc for url in requests)
        print("PASS",width,height,"console and external requests clear",flush=True)
        ctx.close()
    ctx = browser.new_context(java_script_enabled=False, viewport={"width":390,"height":844})
    page = ctx.new_page()
    page.goto(args.base+"/")
    page.get_by_role("link", name="Find a feature", exact=True).first.click()
    for href in page.locator("#results h2 a").evaluate_all("links => links.map(link => link.href)"):
        response = page.goto(href)
        assert response.status == 200
        expect(page.get_by_role("heading", name="Supporting documentation")).to_be_visible()
        expect(page.locator("link[rel=canonical]")).to_have_attribute("href", "https://www.atlasade.com"+urlsplit(href).path)
    page.goto(args.base+"/features/")
    expect(page.locator("#results article")).to_have_count(7)
    page.get_by_role("link",name="Location-scoped inventory").click()
    page.get_by_role("link",name="Read “Follow the sale”").click()
    expect(page.locator("#walkthrough-follow-the-sale")).to_be_in_viewport()
    expect(page.locator("#walkthrough-follow-the-sale")).to_be_visible()
    ctx.close()
    ctx = browser.new_context(viewport={"width":390,"height":844})
    page = ctx.new_page()
    session = ctx.new_cdp_session(page)
    session.send("Emulation.setCPUThrottlingRate", {"rate":4})
    page.goto(args.base+"/features/",wait_until="networkidle")
    field = page.get_by_role("searchbox")
    page.evaluate("""() => {
      window.paints = [];
      document.addEventListener('input', e => {
        const start = e.timeStamp;
        requestAnimationFrame(() => requestAnimationFrame(() => window.paints.push(performance.now() - start)));
      }, true);
    }""")
    samples = ["c","cash","drawer","stock","offline","oat bar stock","unused word",""]
    for i in range(88):
        field.fill(samples[i % len(samples)])
        page.wait_for_function("n => window.paints.length >= n", arg=i+1)
    times = page.evaluate("window.paints.slice(8)")
    p95 = sorted(times)[math.ceil(len(times)*.95)-1]
    data = dict(browser=browser.version, viewport="390x844", cpu_slowdown=4, warmup=8,
                samples_ms=times, p95_ms=p95, method="input timestamp to second animation frame after DOM update")
    (args.output/"performance.json").write_text(json.dumps(data,indent=2))
    print("80 painted query updates; p95",round(p95,2),"ms")
    assert p95 < 50
    browser.close()
