"""Qualify the built website via visible controls. Requires Python Playwright + Chromium."""
import argparse
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


def exercise(browser, base, output, width, height, keyboard=False, reduced=False):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce" if reduced else "no-preference")
    page = ctx.new_page()
    page.set_default_timeout(10000)
    page.set_default_navigation_timeout(30000)
    errors = []
    requests = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda request: requests.append(request.url))
    page.on("requestfailed", lambda request: errors.append(request.url + " " + str(request.failure)))
    page.on("response", lambda response: errors.append(str(response.status) + " " + response.url) if response.status >= 400 else None)

    def shot(name, full=True):
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), name
        if output:
            page.evaluate("scrollTo({top:0,behavior:'instant'})")
            page.screenshot(path=output / f"{width}-{name}.png", full_page=full, animations="disabled")

    def tab_to(locator):
        for _ in range(80):
            if locator.evaluate("el => el === document.activeElement"):
                return
            page.keyboard.press("Tab")
        raise AssertionError("Unreachable via Tab: " + str(locator))

    def activate(locator):
        expect(locator).to_be_visible()
        if keyboard:
            tab_to(locator)
            assert locator.evaluate("el => getComputedStyle(el).outlineStyle !== 'none'")
            page.keyboard.press("Enter")
        else:
            locator.click()

    def button(name):
        return page.get_by_role("button", name=name, exact=True)

    def action(name):
        activate(button(name))

    def chapter(name):
        title = page.get_by_role("heading", name=name, exact=True)
        expect(title).to_be_visible()
        return title

    def region():
        return page.locator(".lens-panel")

    page.goto(base + "/", wait_until="load")
    expect(page.locator("#atlas")).to_have_attribute("data-enhanced", "true", timeout=20000)
    invitation = page.get_by_role("link", name="Try the café day", exact=True)
    rect = invitation.bounding_box()
    assert rect["y"] >= 0 and rect["y"] + rect["height"] <= height, rect
    shot("homepage", False)
    if width <= 980:
        menu = page.locator(".phone-menu summary")
        activate(menu)
        for item in page.get_by_role("navigation", name="Site sections").get_by_role("link").all():
            rect = item.bounding_box()
            assert rect["x"] >= 0 and rect["x"] + rect["width"] <= width
        shot("homepage-menu", False)
        activate(page.get_by_role("navigation", name="Site sections").get_by_role("link", name="Atlas", exact=True))
        assert page.url.endswith("#atlas")
        expect(page.locator(".phone-menu")).not_to_have_attribute("open", "")
    module = page.locator(".atlas-node").filter(has_text="Inventory").first
    module.click()
    expect(module).to_have_attribute("aria-pressed", "true")
    expect(page.locator(".atlas-detail-panel h3")).to_have_text("Inventory")
    activate(invitation)
    expect(page).to_have_title("A Day With Atlasade | River & Oak café demo")
    assert page.url.rstrip("/") == base + "/day-with-atlasade"
    if not keyboard:
        assert page.goto(base + "/day-with-atlasade", wait_until="load").ok

    chapter("Begin the day")
    expect(page.locator(".float-value")).to_have_text("$200.00")
    if reduced:
        assert page.locator(".task").evaluate("el => getComputedStyle(el).animationName === 'none'")
    shot("01-opening")
    action("Open the register")
    expect(page.locator(".register-status")).to_have_text("Register open")
    action("Meet the first customer")
    chapter("The first customer")
    expect(button("Find the customer")).to_be_disabled()
    action("Add house coffee")
    expect(page.locator(".amount.strong")).to_contain_text("$5.25")
    action("Add oat bar")
    expect(page.locator(".ticket-block")).to_contain_text("$8.00")
    expect(page.locator(".ticket-block")).to_contain_text("$0.40")
    expect(page.locator(".amount.strong")).to_contain_text("$8.40")
    shot("02-ticket")
    action("Find the customer")
    chapter("Customer recognition")
    search = page.get_by_role("searchbox", name="Search café customers")
    if keyboard:
        tab_to(search)
        page.keyboard.type("unknown")
    else:
        search.fill("unknown")
    expect(page.get_by_text("No matching café customers.", exact=False)).to_be_visible()
    if keyboard:
        page.keyboard.press("Control+a")
        page.keyboard.type("sAm")
    else:
        search.fill("sAm")
    expect(page.locator(".person")).to_contain_text("Sam Reed")
    action("Attach customer")
    expect(page.locator(".notice")).to_contain_text("Sam Reed is attached to Ticket 104")
    shot("03-customer")
    action("Continue to checkout")
    chapter("Checkout")
    expect(page.locator(".ticket-block")).to_contain_text("$1.60")
    action("Complete simulated sale")
    activate(page.locator(".receipt-toggle summary"))
    receipt = page.get_by_role("region", name="Completed receipt")
    expect(receipt).to_contain_text("$10.00")
    expect(receipt).to_contain_text("Sam Reed")
    shot("04-receipt")
    action("Follow this sale")
    chapter("Follow the sale")
    expected_receipt = region().inner_text()
    shot("05-cashier")
    for name in ["Operator", "Finance", "Cashier", "Operator"]:
        action(name)
        expect(button(name)).to_be_focused()
        expect(page.locator(".sale-id")).to_contain_text("Receipt 104 · River")
        expect(page.locator(".sale-id")).to_contain_text("$8.40")
        if name == "Operator":
            rows = page.locator(".lens-panel tbody tr").all_inner_texts()
            assert [r.split() for r in rows] == [["River","12","11","1","sold"],["Hill","9","9","No","sale"]], rows
        elif name == "Finance":
            assert region().locator(".amount b").all_inner_texts() == ["$8.00","$0.40","$8.40"]
        else:
            assert region().inner_text() == expected_receipt
        shot("05-" + name.lower())
    activate(page.get_by_text("See the bigger picture", exact=True))
    expect(page.locator(".connections")).to_contain_text("River now has 11 of its original 12 oat bars.")
    shot("05-connections")
    if not keyboard:
        page.go_back()
        chapter("Checkout")
        expect(button("Complete simulated sale")).to_have_count(0)
        page.go_forward()
        chapter("Follow the sale")
        choose = page.get_by_role("combobox", name="Review chapter")
        choose.select_option("1")
        expect(button("House coffee added")).to_have_attribute("aria-disabled", "true")
        choose.select_option("3")
        expect(button("Complete simulated sale")).to_have_count(0)
        choose.select_option("4")
        expect(button("Operator")).to_have_attribute("aria-pressed", "true")
    action("Go to the closing count")
    chapter("Close the day")
    counted = page.get_by_role("textbox", name="Counted cash (USD)")
    expect(counted).to_have_value("208.40")
    for value, message in [("207.40","Short"), ("209.40","Over"), ("invalid","Enter a dollar amount"), ("208.40","Count matches")]:
        if keyboard:
            tab_to(counted)
            page.keyboard.press("Control+a")
            page.keyboard.type(value)
        else:
            counted.fill(value)
        expect(page.locator("#variance")).to_contain_text(message)
        if value != "208.40":
            expect(button("Close the register")).to_be_disabled()
        if value == "207.40":
            expect(page.locator("#variance")).to_contain_text("-$1.00")
            shot("06-short-count")
            if not keyboard:
                page.go_back()
                chapter("Follow the sale")
                page.go_forward()
                chapter("Close the day")
                expect(counted).to_have_value(value)
    action("Close the register")
    expect(page.locator(".closing-summary .amount b")).to_have_text(["$200.00","$8.40","$208.40","$208.40","$0.00"])
    shot("06-reconciled")
    action("Replay the day")
    chapter("Begin the day")
    expect(page.locator(".register-status")).to_have_text("Register closed")
    action("Open the register")
    action("Meet the first customer")
    action("Add oat bar")
    action("Start over")
    action("Keep playing")
    expect(button("Oat bar added")).to_have_attribute("aria-disabled", "true")
    action("Start over")
    action("Restart")
    chapter("Begin the day")
    expect(page.locator(".register-status")).to_have_text("Register closed")
    assert not errors, errors
    assert all(urlsplit(url).netloc == urlsplit(base).netloc for url in requests if url.startswith("http")), requests
    print(f"PASS {width}×{height}, keyboard={keyboard}, reduced motion={reduced}, {len(requests)} local requests, zero browser errors", flush=True)
    ctx.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:18743")
    parser.add_argument("--screenshots", type=Path)
    parser.add_argument("--engine", choices=["chromium", "msedge", "webkit", "firefox"], default="chromium")
    args = parser.parse_args()
    base = args.base.rstrip("/")
    assert urlsplit(base).hostname in ("127.0.0.1", "localhost"), "Qualify a local preview"
    if args.screenshots:
        args.screenshots.mkdir(exist_ok=True, parents=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge") if args.engine == "msedge" else getattr(p, args.engine).launch()
        print(f"{args.engine} {browser.version}", flush=True)
        for width, height in [(390,844), (768,1024), (1440,900)]:
            exercise(browser, base, args.screenshots, width, height, keyboard=width == 1440, reduced=width == 768)
        no_js = browser.new_context(java_script_enabled=False)
        page = no_js.new_page()
        page.goto(base + "/day-with-atlasade/")
        page.get_by_text("Read the café walkthrough", exact=True).click()
        expect(page.locator(".walkthrough li")).to_have_count(6)
        expect(page.locator(".walkthrough li").last).to_be_visible()
        print("PASS JavaScript-free walkthrough")
        browser.close()


if __name__ == "__main__":
    main()
