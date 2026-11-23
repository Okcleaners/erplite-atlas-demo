"""Portable loopback wire comparison. Writes synthetic HTTP evidence to the requested directory."""
import argparse
import contextlib
import gzip
import hashlib
import http.client
import io
import itertools
import json
from pathlib import Path
import platform
import queue
import shutil
import socket
import socketserver
import subprocess
import threading

REVISIONS = (None, "2025-11-25", "2026-07-28")
BODY = b"hello"


def headers(encoding, framing, version, port):
    values = {"Host": f"127.0.0.1:{port}", "Content-Type": "application/json",
              "Accept": "application/json, text/event-stream", "Connection": "close",
              "Accept-Encoding": encoding, "X-Fixture-Framing": framing}
    if version:
        values["MCP-Protocol-Version"] = version
    return values


def encode_headers(values):
    return "".join(f"{k}: {v}\r\n" for k, v in values.items()).encode("ascii")


def exchange(port, path, values, body):
    request = b"POST " + path.encode() + b" HTTP/1.1\r\n" + encode_headers(
        {**values, "Content-Length": len(body)}) + b"\r\n" + body
    with socket.create_connection(("127.0.0.1", port), timeout=15) as client:
        client.sendall(request)
        with client.makefile("rb") as reader:
            received = reader.read(128 * 1024)
    return received


def parse(wire):
    class MemorySocket:
        def makefile(self, *_):
            return io.BytesIO(wire)
    response = http.client.HTTPResponse(MemorySocket())
    response.begin()
    length = response.getheader("Content-Length")
    transfer = response.getheader("Transfer-Encoding")
    payload = wire.split(b"\r\n\r\n", 1)[1]
    if length is not None and (transfer or len(payload) != int(length)):
        raise ValueError("Invalid length-delimited response")
    if transfer and (transfer.lower() != "chunked" or not payload.endswith(b"0\r\n\r\n")):
        raise ValueError("Invalid chunk terminator")
    body = response.read()
    if response.getheader("Content-Encoding") == "gzip":
        body = gzip.decompress(body)
    return response.status, body


def python_reply(values):
    encoded = BODY
    out = {"Content-Type": "application/json", "Connection": "close"}
    if values.get("Accept-Encoding") == "gzip":
        encoded = gzip.compress(BODY, mtime=0)
        out["Content-Encoding"] = "gzip"
    if values.get("X-Fixture-Framing") == "chunked":
        out["Transfer-Encoding"] = "chunked"
        encoded = f"{len(encoded):x}\r\n".encode() + encoded + b"\r\n0\r\n\r\n"
    else:
        out["Content-Length"] = len(encoded)
    return b"HTTP/1.1 200 OK\r\n" + encode_headers(out) + b"\r\n" + encoded


@contextlib.contextmanager
def synthetic_server(node):
    if node:
        proc = subprocess.Popen([node, Path(__file__).with_name("framing-server.mjs")],
                                stdout=subprocess.PIPE, text=True)
        try:
            yield int(proc.stdout.readline()), lambda: bytes.fromhex(json.loads(proc.stdout.readline())["sent"])
        finally:
            proc.terminate()
            proc.wait(timeout=5)
            proc.stdout.close()
        return
    sent = queue.Queue()

    class Handler(socketserver.StreamRequestHandler):
        def handle(self):
            self.rfile.readline(1024)
            values = http.client.parse_headers(self.rfile)
            self.rfile.read(int(values["Content-Length"]))
            wire = python_reply(values)
            self.request.sendall(wire)
            sent.put(wire)

    with socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler) as server:
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            yield server.server_address[1], lambda: sent.get(timeout=5)
        finally:
            server.shutdown()
            thread.join()


def run_fixtures(node, curl):
    results = []
    with synthetic_server(node) as (port, emitted):
        for path, encoding, framing, version in itertools.product(
                ("/plain", "/mcp"), ("identity", "gzip"), ("length", "chunked"), REVISIONS):
            values = headers(encoding, framing, version, port)
            wire = exchange(port, path, values, b"{}")
            sent = emitted()
            assert parse(sent) == (200, BODY), "Invalid server fixture"
            try:
                valid = parse(wire) == (200, BODY)
            except (http.client.HTTPException, EOFError, ValueError, OSError):
                valid = False
            row = dict(path=path, acceptEncoding=encoding, framing=framing, version=version,
                       valid=valid, identical=sent == wire, sent=sent.hex(), received=wire.hex())
            if curl and path == "/mcp" and framing == "length":
                args = [curl, "-q", "--noproxy", "*", "--http1.1", "--silent", "--show-error",
                        "--max-time", "15", "--compressed", "--data-binary", "{}"]
                for key, value in values.items():
                    args.extend(["--header", f"{key}: {value}"])
                run = subprocess.run(args + [f"http://127.0.0.1:{port}{path}"], capture_output=True)
                assert parse(emitted()) == (200, BODY)
                row.update(curlExit=run.returncode, curlValid=run.returncode == 0 and run.stdout == BODY,
                           curlError=run.stderr.decode(errors="replace").strip())
            results.append(row)
    return results


def worker_cases(port):
    rows = []
    for encoding, version in itertools.product(("identity", "gzip"), REVISIONS[1:]):
        h = headers(encoding, "length", version, port)
        params = {"name": "fetch", "arguments": {"id": "location-stock"}}
        if version == "2026-07-28":
            params["_meta"] = {"io.modelcontextprotocol/protocolVersion": version,
                               "io.modelcontextprotocol/clientCapabilities": {}}
            h.update({"Mcp-Method": "tools/call", "Mcp-Name": "fetch"})
        data = json.dumps(dict(jsonrpc="2.0", id=1, method="tools/call", params=params)).encode()
        wire = exchange(port, "/mcp", h, data)
        info = dict(version=version, acceptEncoding=encoding, received=wire.hex(),
                    sha256=hashlib.sha256(wire).hexdigest())
        try:
            status, body = parse(wire)
            record = json.loads(body)["result"]["structuredContent"]
            info["valid"] = (status == 200 and record["id"] == "location-stock" and
                             record["claimScope"] == "synthetic_demo" and bool(record["citations"]))
            info["releaseId"] = record["releaseId"]
        except (http.client.HTTPException, ValueError, KeyError, EOFError, OSError):
            info["valid"] = False
        rows.append(info)
    return rows


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--node", default=shutil.which("node"))
    parser.add_argument("--worker-port", type=int)
    parser.add_argument("--require-valid", action="store_true", help="fail if any client receives invalid framing")
    args = parser.parse_args()
    evidence = {"system": platform.platform(), "python": platform.python_version()}
    curl = shutil.which("curl.exe" if platform.system() == "Windows" else "curl")
    if curl:
        evidence["curl"] = subprocess.check_output([curl, "-q", "--version"], text=True).splitlines()[0]
    for name, binary in [("pythonServer", None), ("nodeServer", args.node)]:
        if name == "nodeServer" and not binary:
            continue
        evidence[name] = run_fixtures(binary, curl)
    if args.worker_port:
        evidence["worker"] = worker_cases(args.worker_port)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(evidence, indent=2), encoding="utf-8")
    failures = 0
    for name, rows in evidence.items():
        if isinstance(rows, list):
            invalid = sum(not r["valid"] for r in rows)
            print(f"{name}: {len(rows)-invalid}/{len(rows)} valid raw responses")
            failures += invalid + sum(not r["curlValid"] for r in rows if "curlValid" in r)
    if args.require_valid and failures:
        raise SystemExit(1)
