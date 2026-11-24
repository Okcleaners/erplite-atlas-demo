"""Render the isolated SVG with an existing Playwright Chromium and psutil installation."""
import argparse
import base64
import gzip
import hashlib
import json
from contextlib import ExitStack
from pathlib import Path
from statistics import median
from time import perf_counter

import psutil
from playwright.sync_api import sync_playwright


def webp(page, png, quality):
    data = base64.b64encode(png).decode("ascii")
    result = page.evaluate("""async ([b64, quality]) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const canvas = document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const uri = canvas.toDataURL('image/webp', quality);
      if (!uri.startsWith('data:image/webp;')) throw Error('Missing WebP encoder');
      return [uri.split(',')[1], ctx.getImageData(0, 0, 1, 1).data[3]];
    }""", [data, quality])
    return base64.b64decode(result[0]), result[1]


def snapshot():
    sample = {}
    for child in psutil.Process().children(recursive=True):
        try:
            cpu = child.cpu_times()
            sample[child.pid] = (child.ppid(), child.name(), cpu.user + cpu.system,
                                 child.memory_info().rss, child.create_time())
        except psutil.NoSuchProcess:
            continue
    return sample


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Directory for visual evidence")
    parser.add_argument("--windows-gpu", action="store_true", help="Use Windows GPU Engine counters via pywin32")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    src = Path(__file__).with_name("connected-business.svg")
    times, samples, hashes = [], [], []
    requests = []
    with ExitStack() as stack:
        driver = stack.enter_context(sync_playwright())
        browser = driver.chromium.launch()
        try:
            print("Chromium", browser.version)
            page = browser.new_page(viewport={"width": 1040, "height": 600},
                                    device_scale_factor=1, reduced_motion="reduce")
            page.context.set_offline(True)
            page.on("request", lambda req: requests.append(req.url.split(":")[0]))
            samples.append(snapshot())
            if args.windows_gpu:
                import win32pdh
                query = win32pdh.OpenQuery()
                stack.callback(win32pdh.CloseQuery, query)
                counter = win32pdh.AddCounter(query, r"\GPU Engine(*)\Running Time")

                def gpu_times():
                    win32pdh.CollectQueryData(query)
                    return win32pdh.GetFormattedCounterArray(counter, win32pdh.PDH_FMT_LARGE)

                start_gpu = gpu_times()
            for index in range(5):
                start = perf_counter()
                page.goto(src.as_uri())
                title = page.locator("svg > title").text_content()
                assert title == "A connected business"
                png = page.screenshot(omit_background=True)
                times.append(round((perf_counter() - start) * 1000, 2))
                samples.append(snapshot())
                hashes.append(hashlib.sha256(png).hexdigest())
            if args.windows_gpu:
                end_gpu = gpu_times()
                active = [v - start_gpu.get(k, 0) for k, v in end_gpu.items()
                          if int(k.split("_")[1]) in samples[-1]]
                print("PID-matched engine counters", len(active),
                      "running time delta (100 ns)", sum(active) if active else "unavailable")
            (args.output / "connected-business.png").write_bytes(png)
            full, alpha = webp(page, png, .88)
            (args.output / "connected-business.webp").write_bytes(full)
            print("full image corner alpha", alpha)
            page.evaluate("""() => {
              for (const child of document.documentElement.children) {
                if (!['defs','style','title','desc'].includes(child.localName) && child.id !== 'river')
                  child.style.display = 'none';
              }
              document.querySelectorAll('#river text').forEach(t => t.style.display='none');
            }""")
            crop = page.screenshot(clip={"x": 68, "y": 151, "width": 268, "height": 180},
                                   omit_background=True)
            storefront, alpha = webp(page, crop, .88)
            assert alpha == 0
            (args.output / "river-storefront.webp").write_bytes(storefront)
            page.set_viewport_size({"width": 390, "height": 225})
            page.goto(src.as_uri())
            page.locator("svg").evaluate("el => {el.style.width='100%'; el.style.height='auto'}")
            (args.output / "mobile-review.png").write_bytes(page.screenshot(omit_background=True))
        finally:
            browser.close()
    pids = {pid: row for sample in samples for pid, row in sample.items()}
    print("owned processes", [(pid, row[0], row[1]) for pid, row in sorted(pids.items())])
    print("survivors", [pid for pid, row in pids.items() if psutil.pid_exists(pid)
                        and psutil.Process(pid).create_time() == row[4]])
    print("sampled aggregate working set MiB",
          round(max(sum(row[3] for row in s.values()) for s in samples) / 2**20, 2))
    before = samples[0]
    print("child CPU seconds over five captures",
          round(sum(row[2] - (before[pid][2] if pid in before else 0)
                    for pid, row in samples[-1].items()), 3))
    print("navigation plus screenshot ms", times, "median", median(times))
    print("distinct PNG hashes", set(hashes), "request schemes", set(requests))
    print("SVG bytes", src.stat().st_size, "gzip -9", len(gzip.compress(src.read_bytes(), mtime=0)))
    print(json.dumps({f.name: f.stat().st_size for f in args.output.iterdir()
                      if f.name in ('connected-business.png', 'connected-business.webp',
                                    'river-storefront.webp')}))


if __name__ == "__main__":
    main()
