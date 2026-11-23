"""Loopback qualification with the official Python MCP SDK and measured modern HTTP calls."""
import asyncio
import json
import math
import time
from importlib.metadata import version
from statistics import median

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

URL = "http://127.0.0.1:18748/mcp"
QUESTION = "Does selling an oat bar change stock at another store?"
CALLS = {
    "search": {"query": QUESTION},
    "fetch": {"id": "location-stock"},
    "compare_requirements": {"requirements": [QUESTION, "Can I take cards offline?"]},
    "related_capabilities": {"id": "location-stock", "relation": "demonstrated_in"},
}


async def reference():
    async with streamable_http_client(URL) as (receive, send, _):
        async with ClientSession(receive, send) as session:
            hello = await session.initialize()
            tools = await session.list_tools()
            assert {t.name for t in tools.tools} == set(CALLS)
            release_ids = set()
            for name, args in CALLS.items():
                result = await session.call_tool(name, args)
                assert not result.isError, result.content
                data = json.loads(result.content[0].text)
                assert data == result.structuredContent
                release_ids.add(data["releaseId"])
                if name == "search":
                    assert data["results"][0]["id"] == "location-stock"
                elif name == "fetch":
                    assert data["claimScope"] == "synthetic_demo" and data["availabilityStatus"] == "unverified"
                    assert "Hill stays at 9" in data["text"] and data["citations"]
                elif name == "compare_requirements":
                    assert [r["outcome"] for r in data["assessments"]] == ["synthetic_demo_only", "unverified"]
                else:
                    assert data["edges"][0]["citation"].endswith("#walkthrough-follow-the-sale")
            assert len(release_ids) == 1
            print("Python MCP SDK", version("mcp"), "negotiated", hello.protocolVersion, release_ids.pop())


def benchmark():
    protocol = "2026-07-28"
    headers = {"accept": "application/json, text/event-stream", "mcp-method": "tools/call",
               "mcp-protocol-version": protocol}
    meta = {"io.modelcontextprotocol/protocolVersion": protocol, "io.modelcontextprotocol/clientCapabilities": {},
            "io.modelcontextprotocol/clientInfo": {"name": "local-qualification", "version": "1"}}
    with httpx.Client(trust_env=False, timeout=15) as client:
        for name, args in CALLS.items():
            times, sizes = [], []
            for i in range(32):
                body = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                        "params": {"name": name, "arguments": args, "_meta": meta}}
                start = time.perf_counter()
                reply = client.post(URL, json=body, headers={**headers, "mcp-name": name})
                elapsed = (time.perf_counter() - start) * 1000
                reply.raise_for_status()
                assert reply.headers["cache-control"] == "no-store"
                assert reply.json()["result"]["structuredContent"]["releaseId"]
                if i >= 2:
                    times.append(elapsed)
                    sizes.append(len(reply.content))
            p95 = sorted(times)[math.ceil(.95 * len(times)) - 1]
            print(f"{name:22} n={len(times)} p50={median(times):.2f}ms p95={p95:.2f}ms body={max(sizes)} bytes")


if __name__ == "__main__":
    asyncio.run(reference())
    benchmark()
