"""Qualify the built website via visible controls. Requires Python Playwright and the selected browser."""
import argparse
import sys
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


def check_legacy_layout(page, board):
    # Remove unsupported rules from the running document only. Exercise each
    # missing capability independently, then combine them at 200% content zoom.
    for mode in ("container", "has", "both"):
        styles = page.evaluate("""() => Array.from(document.styleSheets, sheet =>
            Array.from(sheet.cssRules, rule => rule.cssText).join('\\n'))""")
        page.evaluate("""mode => {
            function remove(rules) {
                for (let i = rules.cssRules.length - 1; i >= 0; --i) {
                    const rule = rules.cssRules[i];
                    if ((mode !== 'has' && rule.cssText.startsWith('@container')) ||
                        (mode !== 'container' && rule.selectorText?.includes(':has('))) rules.deleteRule(i);
                    else if (rule.cssRules && rule.deleteRule) remove(rule);
                }
            }
            Array.from(document.styleSheets).forEach(remove);
        }""", mode)
        if mode == "both":
            page.set_viewport_size({"width":780,"height":844})
            page.evaluate("document.documentElement.style.zoom = '200%'")
        try:
            columns = board.evaluate("el => getComputedStyle(el).gridTemplateColumns.split(' ').length")
            print("legacy layout",mode,"columns",columns,flush=True)
            assert columns == 1, mode
            expect(board.get_by_role("button",name="Expand receipt")).to_be_visible()
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        finally:
            page.evaluate("""styles => Array.from(document.styleSheets).forEach((sheet, i) => {
                const replacement = document.createElement('style');
                replacement.textContent = styles[i]; sheet.ownerNode.replaceWith(replacement);
            })""",styles)
            page.evaluate("document.documentElement.style.zoom = ''")
            page.set_viewport_size({"width":390,"height":844})


def exercise(browser, base, output, width, height, keyboard=False, reduced=False, legacy_layout=False):
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
            earlier = locator.evaluate("""el => Boolean(
                document.activeElement.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)""")
            page.keyboard.press("Shift+Tab" if earlier else "Tab")
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
    if keyboard and sys.platform == "win32" and browser.browser_type.name == "webkit":
        # Windows MiniBrowser's default Tab order skips native hyperlinks.
        # Enter through the link with a pointer, then exercise the register by keyboard.
        invitation.click()
    else:
        activate(invitation)
    expect(page).to_have_title("A Day With Atlasade | River & Oak café demo")
    assert page.url.rstrip("/") == base + "/day-with-atlasade"
    if not keyboard:
        # Finish the CTA navigation before independently exercising a direct load.
        expect(page.locator(".register-status")).to_have_text("Register closed")
        response = page.goto(base + "/day-with-atlasade", wait_until="load")
        # A repeat navigation can revalidate the canonical document from cache.
        assert response.ok or response.status == 304
        assert page.url == base + "/day-with-atlasade/"

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
    board = page.locator(".sale-map")
    receipt = board.get_by_role("region", name="Completed receipt")
    if width == 390 and legacy_layout:
        check_legacy_layout(page, board)
    if width == 390:
        expect(receipt).to_have_count(0)
        shot("05-compact")
        action("See inventory change")
        expect(board.locator("#stock-source")).to_contain_text("1 × Oat bar")
        action("See where the money went")
        expect(board.locator("#cash-source")).to_contain_text("$8.40")
        action("See where the money went")
        action("Expand receipt")
        expect(button("Collapse receipt")).to_have_attribute("aria-expanded", "true")
    expected_receipt = receipt.inner_text()
    assert receipt.locator(".amount b").all_text_contents() == [
        "$5.00", "$3.00", "$8.00", "$0.40", "$8.40", "$10.00", "$1.60"]
    expect(receipt).to_contain_text("Sam Reed")
    expect(board.locator(".inventory .sale-reading")).to_have_text("12 →to 11")
    expect(board.locator(".inventory")).to_contain_text("Hill stays at 9.")
    expect(board.locator(".finance")).to_contain_text("$8.00 sales excluding tax + $0.40 tax")
    expect(board.locator(".finance .sale-reading")).to_have_text("$8.40")
    shot("05-connected")
    stock_label, cash_label = "See inventory change", "See where the money went"
    for label, source in [(stock_label, "stock"), (cash_label, "cash"), (stock_label, "stock")]:
        action(label)
        if keyboard:
            expect(button(label)).to_be_focused()
        expect(button(label)).to_have_attribute("aria-expanded", "true")
        detail = board.locator("#" + source + "-source")
        expect(detail).to_contain_text("Receipt #104")
        expect(detail).to_be_visible()
        expect(detail).to_contain_text("1 × Oat bar at River · $3.00" if source == "stock" else "$10.00 tendered less $1.60 change leaves $8.40")
        expect(board.locator(".trace-button[aria-expanded=true]")).to_have_count(1)
        assert receipt.inner_text() == expected_receipt
        if reduced:
            assert detail.evaluate("e => getComputedStyle(e.closest('section'),'::before').animationName") == "none"
        shot("05-" + source)
    if width == 390:
        page.evaluate("""() => {
          window.tracePaints = [];
          document.addEventListener("click", event => {
            if (!event.target.closest(".trace-button")) return;
            const start = event.timeStamp;
            requestAnimationFrame(() => requestAnimationFrame(() => window.tracePaints.push(performance.now() - start)));
          }, true);
        }""")
        for i in range(44):
            button(cash_label if i % 2 == 0 else stock_label).click()
            page.wait_for_function("n => window.tracePaints.length === n", arg=i+1)
        samples = sorted(page.evaluate("window.tracePaints.slice(4)"))
        print(f"40 trace clicks, unthrottled 390px, click to second frame p95 {samples[37]:.1f} ms", flush=True)
    action(stock_label)
    expect(board.locator("#stock-source")).to_be_hidden()
    action(stock_label)
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
        expect(button(stock_label)).to_have_attribute("aria-expanded", "true")
        if width == 390:
            expect(button("Expand receipt")).to_have_attribute("aria-expanded", "false")
            action("Expand receipt")
        assert receipt.inner_text() == expected_receipt
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
    parser.add_argument("--legacy-layout", action="store_true")
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
            exercise(browser, base, args.screenshots, width, height, keyboard=width == 1440, reduced=width == 768, legacy_layout=args.legacy_layout)
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
