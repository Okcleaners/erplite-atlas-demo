"""Exercise actual Finder fetch, body deadline and history restoration on loopback."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from threading import Thread
import time
from playwright.sync_api import sync_playwright, expect

dist = Path(__file__).resolve().parents[2] / "dist"
manifest = (dist / "agents/manifest.json").read_bytes()

class Origin(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path != "/agents/manifest.json":
            return super().do_GET()
        self.server.reads += 1
        case = self.server.case
        self.send_response(503 if case == "unavailable" else 200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if case == "delayed":
            time.sleep(1)
        body = {"stale": b'{"releaseId":"previous"}', "malformed": b"{"}.get(case, manifest)
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass

def qualify(browser, engine, origin):
    base = f"http://127.0.0.1:{origin.server_port}"
    for fallback in (False, True):
        with browser.new_context(reduced_motion="reduce") as ctx:
            # Accelerate just the ten-second deadline and track fallback timer disposal.
            ctx.add_init_script("""
              window.deadlines = []; window.pendingDeadlines = new Set();
              const later = window.setTimeout, clear = window.clearTimeout;
              window.setTimeout = (callback, ms, ...args) => {
                if (ms !== 10000) return later(callback, ms, ...args);
                deadlines.push(ms);
                const id = later(callback, 250, ...args); pendingDeadlines.add(id); return id;
              };
              window.clearTimeout = id => { pendingDeadlines.delete(id); clear(id); };
              const native = AbortSignal.timeout.bind(AbortSignal);
              Object.defineProperty(AbortSignal, 'timeout', {value: FALLBACK ? undefined : ms => {
                deadlines.push(ms); return native(ms === 10000 ? 250 : ms);
              }});
              addEventListener('pageshow', e => {window.restored = e.persisted;});
            """.replace("FALLBACK", json.dumps(fallback)))
            page = ctx.new_page()
            for case in ("valid","stale","malformed","delayed","unavailable"):
                origin.case = case
                page.goto(base + "/features/")
                field = page.get_by_role("searchbox")
                if case == "valid":
                    expect(field).to_be_visible()
                    field.fill("Does selling an oat bar change stock at another store?")
                    field.press("Enter")
                    expect(page.locator("#help-result")).to_contain_text("Hill stays at 9")
                else:
                    expect(page.locator("#help-result")).to_contain_text("Refresh the directory")
                    expect(field).to_be_hidden()
                    expect(page.locator("#results article")).to_have_count(0)
                assert page.evaluate("deadlines.includes(10000)")
                page.wait_for_function("pendingDeadlines.size === 0")
            origin.case = "valid"
            page.goto(base + "/features/")
            field.fill("Cash checkout and change")
            field.press("Enter")
            expect(page.locator("#help-result")).to_contain_text("$1.60")
            page.get_by_role("link", name="About availability").click()
            origin.case = "stale"
            before = origin.reads
            page.go_back()
            expect(page.locator("#help-result")).to_contain_text("Refresh the directory")
            expect(field).to_be_hidden()
            assert origin.reads > before
            print(engine, "fallback",fallback,"history pageshow.persisted",page.evaluate("window.restored"),flush=True)
            # Some automation configurations reload on back. Also exercise the
            # persisted handler with the previous affirmative answer in the DOM.
            origin.case = "valid"
            page.reload()
            field.fill("Cash checkout and change")
            field.press("Enter")
            expect(page.locator("#help-result")).to_contain_text("$1.60")
            origin.case = "stale"
            page.evaluate("dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
            expect(page.locator("#help-result")).to_contain_text("Refresh the directory")
            expect(field).to_be_hidden()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=["chromium","firefox","webkit"], required=True)
    engine = parser.parse_args().engine
    with ThreadingHTTPServer(("127.0.0.1",0), partial(Origin,directory=dist)) as origin:
        origin.case, origin.reads = "valid", 0
        Thread(target=origin.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as pw:
                options = {"ignore_default_args":["--disable-back-forward-cache"]} if engine == "chromium" else {}
                browser = getattr(pw,engine).launch(**options)
                try:
                    qualify(browser, engine, origin)
                finally:
                    browser.close()
        finally:
            origin.shutdown()
