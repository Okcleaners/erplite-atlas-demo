"""Exercise the actual offline prototype and record reproducible local evidence."""
import argparse
import json
import math
import os
from pathlib import Path
from statistics import median
from urllib.parse import urlsplit

import psutil
from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parent
PATH = "/connected-business-explorer/"
OFFLINE = (ROOT / ("dist" + PATH + "index.html")).as_uri()
SIZES = [(1920, 1080), (1440, 900), (768, 1024), (390, 844), (320, 740)]


def amount(page, place, key):
    return page.locator(f'[data-location="{place}"] [data-part="{key}"]')


def verify(page, out, width, target):
    errors = []
    requests = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: requests.append(request.url))
    page.goto(target, wait_until="load")
    expect(page.get_by_role("heading", level=1)).to_have_text("Connected Business Explorer")
    expect(amount(page, "river", "stock")).to_have_text("12")
    expect(amount(page, "hill", "stock")).to_have_text("9")
    expect(page.locator('[data-total="drawer"]')).to_have_text("$350.00")
    if out:
        page.screenshot(path=out / f"{width}-opening.png", full_page=True)
    river = page.get_by_role("radio", name="River", exact=True)
    hill = page.get_by_role("radio", name="Hill", exact=True)
    button = page.get_by_role("button", name="Complete $8.40 sale", exact=True)
    repeat = page.get_by_role("button", name="New experiment", exact=True)
    river.focus()
    river.press("ArrowRight")
    expect(hill).to_be_checked()
    expect(hill).to_be_focused()
    guess = page.get_by_role("radio", name="Both stores", exact=True)
    guess.focus()
    guess.press("Space")
    expect(guess).to_be_checked()
    button.focus()
    button.press("Enter")
    expect(button).to_be_focused()
    if width == 1440:
        assert page.locator('[data-location="hill"] .trace').evaluate("path => path.getAnimations().length === 1")
    expect(page.get_by_role("status")).to_contain_text("You predicted both stores. Hill sold 1 oat bar.")
    expect(amount(page, "river", "stock")).to_have_text("12")
    expect(amount(page, "river", "drawer")).to_have_text("$200.00")
    expect(amount(page, "river", "label")).to_have_text("Unchanged this sale")
    expect(amount(page, "hill", "stock")).to_have_text("8")
    expect(amount(page, "hill", "drawer")).to_have_text("$158.40")
    expect(amount(page, "hill", "label")).to_have_text("Sale posted here")
    expect(page.locator('[data-total="sales"]')).to_have_text("$8.00")
    expect(page.locator('[data-total="tax"]')).to_have_text("$0.40")
    expect(page.locator('[data-total="drawer"]')).to_have_text("$358.40")
    if width == 768:
        assert page.evaluate("document.getAnimations().every(animation => animation.playState !== 'running')")
    button.press("Enter")
    page.locator("#experiment").evaluate("form => form.requestSubmit()")
    expect(page.locator('[data-total="receipts"]')).to_have_text("1")
    if out:
        page.screenshot(path=out / f"{width}-hill-sale.png", full_page=True, animations="disabled")
    repeat.focus()
    repeat.press("Enter")
    expect(hill).to_be_focused()
    expect(guess).not_to_be_checked()
    river.check()
    page.get_by_role("radio", name="Only the selling store").check()
    button.click()
    expect(page.get_by_role("status")).to_contain_text("Your prediction matched. River sold 1 oat bar.")
    expect(amount(page, "river", "stock")).to_have_text("11")
    expect(amount(page, "hill", "stock")).to_have_text("8")
    expect(page.locator('[data-total="receipts"]')).to_have_text("2")
    expect(page.locator('[data-total="drawer"]')).to_have_text("$366.80")
    page.locator("#explanation summary").focus()
    page.locator("#explanation summary").press("Enter")
    expect(page.locator("#scope-proof")).to_contain_text("The receipt belongs to River.")
    expect(page.locator("#explanation summary")).to_be_focused()
    if out:
        page.screenshot(path=out / f"{width}-both-stores.png", full_page=True, animations="disabled")
    for _ in range(8):
        repeat.click()
        hill.check()
        button.click()
    expect(amount(page, "hill", "stock")).to_have_text("0")
    repeat.click()
    expect(button).to_have_attribute("aria-disabled", "true")
    expect(page.locator("#sale-hint")).to_contain_text("Hill is out of oat bars")
    button.press("Enter")
    expect(page.locator('[data-total="receipts"]')).to_have_text("10")
    river.check()
    button.click()
    expect(amount(page, "river", "stock")).to_have_text("10")
    expect(page.locator('[data-total="receipts"]')).to_have_text("11")
    page.get_by_role("button", name="Reset both stores").click()
    expect(river).to_be_checked()
    expect(river).to_be_focused()
    expect(page.locator('[data-total="drawer"]')).to_have_text("$350.00")
    expect(page.locator('[data-total="receipts"]')).to_have_text("0")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    # Some file-scheme browser drivers omit the document's request event.
    assert page.url == target and all(request == target for request in requests), requests
    assert page.evaluate("performance.getEntriesByType('resource').length === 0")
    assert not errors, errors


def navigation(page, base):
    def fits():
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), page.url

    page.get_by_role("link", name="Atlasade home", exact=True).first.click()
    expect(page.get_by_role("link", name="Try the café day", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Find a feature", exact=True).first).to_be_visible()
    fits()
    growing = page.locator(".business-path.path-locations")
    expect(growing).to_contain_text("Growing across locations")
    growing.click()
    expect(page).to_have_url(base + PATH)
    feedback = page.get_by_role("link", name="Email feedback", exact=True)
    expect(feedback).to_have_attribute("href", "mailto:jwong@atlasade.com?subject=Atlasade%20Explorer%20feedback")
    fits()
    page.get_by_role("navigation", name="Website").get_by_role("link", name="Café day").click()
    expect(page.get_by_role("heading", level=1)).to_contain_text("River & Oak")
    fits()
    page.get_by_role("link", name="Try a sale at either store").click()
    expect(page).to_have_url(base + PATH)
    page.locator("#explanation summary").click()
    page.get_by_role("link", name="Read about location-scoped inventory").click()
    expect(page.get_by_role("heading", level=1)).to_have_text("Location-scoped inventory")
    fits()
    page.get_by_role("link", name="Open the Connected Business Explorer").click()
    page.get_by_role("navigation", name="Website").get_by_role("link", name="Feature Finder").click()
    query = page.get_by_role("searchbox")
    query.fill("CRM")
    query.press("Enter")
    expect(page.locator("#help-result")).to_contain_text("CRM and Customer Management")
    fits()


def performance(browser, out, target):
    with browser.new_context(viewport={"width": 390, "height": 844}) as ctx:
        page = ctx.new_page()
        ctx.new_cdp_session(page).send("Emulation.setCPUThrottlingRate", {"rate": 4})
        page.goto(target)
        page.evaluate("""() => {
          window.samples = [];
          document.querySelector('#complete').addEventListener('click', event => {
            const start = event.timeStamp;
            requestAnimationFrame(() => requestAnimationFrame(() => samples.push(performance.now() - start)));
          });
        }""")
        for i in range(88):
            page.get_by_role("button", name="Complete $8.40 sale", exact=True).click()
            page.wait_for_function("n => samples.length === n", arg=i+1)
            page.get_by_role("button", name="Reset both stores").click()
        results = page.evaluate("samples.slice(8)")
        report = {"samples": len(results), "cpuSlowdown": 4, "viewport": [390, 844],
                  "p50Ms": median(results), "p95Ms": sorted(results)[math.ceil(.95*len(results))-1],
                  "measurement": "Click timestamp to second animation frame"}
        (out / "performance.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report), flush=True)


def recording(browser, out, target):
    with browser.new_context(viewport={"width": 1280, "height": 900}, record_video_dir=out,
                             record_video_size={"width": 1280, "height": 900}) as ctx:
        page = ctx.new_page()
        page.goto(target)
        pause = lambda ms=850: page.wait_for_timeout(ms)
        pause(1400)
        page.get_by_role("radio", name="Only the selling store").check()
        pause()
        page.get_by_role("button", name="Complete $8.40 sale", exact=True).click()
        pause(1800)
        page.get_by_role("button", name="New experiment", exact=True).click()
        page.get_by_role("radio", name="Hill", exact=True).check()
        page.get_by_role("radio", name="Both stores", exact=True).check()
        pause()
        page.get_by_role("button", name="Complete $8.40 sale", exact=True).click()
        pause(1800)
        page.locator("#explanation summary").click()
        pause(2800)
        page.get_by_role("button", name="Reset both stores").click()
        pause(1300)
        video = page.video
    Path(video.path()).replace(out / "connected-business-explorer.webm")


def sample_children(process, observed):
    for child in process.children(recursive=True):
        try:
            observed[child.pid] = (child.ppid(), child.create_time())
        except psutil.NoSuchProcess:
            continue


def same_process(pid, created):
    try:
        return psutil.Process(pid).create_time() == created
    except psutil.NoSuchProcess:
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=("chromium", "firefox", "webkit"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--media", action="store_true")
    parser.add_argument("--base", help="Loopback origin for the compiled integrated site")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    base = args.base.rstrip("/") if args.base else ""
    if base:
        assert urlsplit(base).hostname in {"127.0.0.1", "localhost"}
    target = base + PATH if base else OFFLINE
    process = psutil.Process()
    print(f"Browser qualification PID={os.getpid()} PPID={os.getppid()} engine={args.engine}", flush=True)
    children = {}
    with sync_playwright() as pw:
        browser = getattr(pw, args.engine).launch()
        sample_children(process, children)
        print(f"Browser and driver children {children}", flush=True)
        for width, height in SIZES:
            with browser.new_context(viewport={"width": width, "height": height},
                                     reduced_motion="reduce" if width == 768 else "no-preference",
                                     has_touch=width <= 390) as ctx:
                page = ctx.new_page()
                verify(page, args.output if args.media else None, width, target)
                if base:
                    navigation(page, base)
                sample_children(process, children)
            print(f"PASS {args.engine} {browser.version} at {width} × {height}", flush=True)
        with browser.new_context(java_script_enabled=False, viewport={"width": 320, "height": 740}) as ctx:
            page = ctx.new_page()
            page.goto(target)
            worked = page.locator("#worked-example")
            expect(worked).to_be_visible()
            expect(worked).to_contain_text("The combined drawer becomes $358.40.")
            expect(page.locator("#experiment")).to_be_hidden()
            page.locator("#explanation summary").click()
            expect(page.locator("#scope-proof")).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            if base:
                nav = page.get_by_role("navigation", name="Website")
                nav.get_by_role("link", name="Café day").click()
                expect(page.get_by_role("link", name="Try a sale at either store")).to_be_visible()
                page.get_by_role("link", name="Try a sale at either store").click()
                expect(worked).to_be_visible()
                expect(page.get_by_role("heading", name="Help shape Atlasade")).to_be_visible()
        if args.media:
            performance(browser, args.output, target)
            recording(browser, args.output, target)
        sample_children(process, children)
        browser.close()
    surviving = [pid for pid, (_, created) in children.items() if psutil.pid_exists(pid)
                 and same_process(pid, created)]
    assert not surviving, surviving
    print(f"Zero surviving owned browser or driver processes. Observed PID and parent pairs: {children}", flush=True)


if __name__ == "__main__":
    main()
