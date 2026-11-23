# 004E independent MCP transport qualification

**Verdict.** The 004D Worker passed HTTP/1.1 framing under both MCP revisions on native Linux workerd. The five-byte Windows failure occurs between the sending application's socket write and the receiving application's socket read. It reproduces with an ordinary Python TCP server and with Node's built-in HTTP server. The affected Windows path still delivers invalid HTTP to strict clients. Changing Atlasade's response encoding would leave the underlying defect in place.

## Paired wire evidence

Both fixture servers wrote this response for the uncompressed, fixed-length case. The client requested `/mcp` on IPv4 loopback. The following blocks show literal CRLF boundaries as escape sequences.

```text
HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nConnection: close\r\nContent-Length: 5\r\n\r\nhello
```

The Windows raw socket received:

```text
HTTP/1.1 200 OK\r\ntransfer-encoding: chunked\r\nContent-Type: application/json\r\nConnection: close\r\n\r\nhello
```

The received body was exactly `68 65 6c 6c 6f`. The advertised framing requires a chunk size, delimiters and a terminating zero chunk. The Linux raw socket received the sender's bytes unchanged. The Python fixture records the exact buffer passed to `sendall`. The Node fixture records the buffers passed to `socket.write`. The real Worker cases capture the receiving side separately and validate a complete JSON-RPC capability response. [HTTP/1.1 message body length and chunked coding](https://www.rfc-editor.org/rfc/rfc9112.html#section-6.3)

| HTTP/1.1 check | Windows host | Ubuntu WSL2 |
| --- | ---: | ---: |
| Python TCP server, raw client | 14/24 valid | 24/24 byte-identical |
| Node HTTP server, raw client | 14/24 valid | 24/24 byte-identical |
| curl, fixed-length responses at `/mcp`, both servers | 0/12 decoded | 12/12 decoded |
| Actual workerd, identity, one fetch per revision | 0/2 decoded | 2/2 decoded |
| Actual workerd, gzip, one fetch per revision | 2/2 decoded | 2/2 decoded |

Each fixture crossed two paths, three version-header settings, two content encodings and two transfer framings. On Windows, all originally chunked responses were valid. Fixed-length responses failed on `/mcp` with or without the version header. On `/plain` they failed with either version header and passed with no version header. Gzip with a fixed content length reproduced the mismatch too. In the successful real-Worker gzip cases the received body contained valid chunks. Linux workerd returned identity JSON with content lengths of 2,630 and 2,756 bytes for the legacy and modern results respectively.

The Windows OS reported the same Python process as owner of both connected TCP endpoints in a failing exchange. That observation cannot identify a transparent driver or inspection provider. A published Avast support discussion describes a similar MCP framing failure during HTTPS inspection. It is supporting context for an investigation, not attribution of this loopback flow. Keep the provider unresolved pending a trace identifying it. [Related Avast support discussion](https://community.avast.com/t/invalid-http-chunked-framing-observed-during-mcp-oauth-discovery-with-avast-https-inspection/921781)

## Reproduce

From the website worktree, use the approved local 004D Worker setup in the [Worker guide](../worker/README.md). Run the probe on each OS with a native Node executable, native Python and curl. Omit `--worker-port` for the self-contained two-server reproduction. The optional `--node` argument selects a specific Node binary.

```sh
python mcp/qualification/framing.py --worker-port 18750 --output wire.json --require-valid
```

The strict command exits nonzero on a failed raw or curl case. Its JSON includes exact sent/received hex for the fixtures, raw Worker response hex, decoded-result validity, curl diagnostics and platform versions. On Linux the clients and servers all ran inside Ubuntu's kernel on loopback, including the native workerd executable. WSL2 shares the physical machine with Windows. The exercise used no remote server, public URL or Cloudflare account.

The qualified workerd version was 1.20261023.1 on both platforms. Windows used Python 3.11.9 and curl 8.22.0. Ubuntu used Python 3.12.3 and curl 8.5.0. Both Worker runtimes used the same 004D implementation and independently pinned 004C release. For the three-client check:

- The TypeScript SDK 2.4.0 pinned 2026-07-28 discovery. Inspector 2.16.0 and Python SDK 1.26.0 negotiated 2025-11-25. Each listed the same four tools and invoked search, fetch, comparison and relationship retrieval against port 18750 on each OS.
- The TypeScript and Inspector Linux runs requested identity encoding. Their results agreed on the release, synthetic inventory scope, commercial uncertainty and cited walkthrough. The Python client used its normal transport settings.
- The Windows website suite passed 35 tests, the MCP suite passed four, and the two-instance workerd regression passed on both operating systems. It exercised correction, withdrawal, expiry, failed validation, rollback after restart, timeouts, recovery, input limits and overload. Sixteen held operations were admitted on one isolate and the next received 429. This qualifies local admission control. Hosted per-caller rate limits still require a separate test.

## Checkpoint protection assessment

| Question | Evidence and conclusion |
| --- | --- |
| Who can mutate state through MCP? | The four tool contracts are read-only. The public Worker has a private service binding to the checkpoint reader. The reader exposes one GET operation. Local workerd rejected POST, PUT and DELETE at that operation, retained the same generation and rejected the public `/current` path. The reader implementation itself holds an R2 binding, so the integrity of its deployment and bindings is part of the trust boundary. |
| What does the publisher enforce? | The operator helper checks the expected predecessor, inspects lineage, rejects reuse of an old release ID and conditionally creates the next key. In the concurrent publication test exactly one publisher won. Those checks apply to calls through that helper. Direct object-write authority carries wider privileges. |
| Can an existing generation be overwritten or deleted? | Cloudflare documents an enabled indefinite bucket lock for the exact `knowledge-checkpoints/v1/` prefix as protecting existing and future matching objects from overwrite, deletion and lifecycle removal. The writer must lack bucket-configuration authority. The disposable emulator allowed a test operator to delete its deliberately invalid latest object, after which the previous head became visible again. This directly demonstrates the boundary of application-only protection. Hosted lock enforcement was not exercised. [Bucket lock behavior](https://developers.cloudflare.com/r2/buckets/bucket-locks/) |
| Can an earlier checkpoint be restored? | An intact, indefinitely locked history retains the newer keys. Copying an old backup into the same protected prefix cannot replace them. A lock allows new keys and does not authenticate the semantic meaning of a new checkpoint. A stale replacement bucket, a changed binding or an unauthorized higher generation can make an obsolete release appear current if the origin agrees. The current cold reader has no separate high-water mark outside its trusted bucket. |
| Which permissions matter? | Keep public clients away from R2. Limit the publisher identity to the dedicated bucket, restrict who may execute or change publisher code, and separate it from lock administrators, Worker deployers and restore operators. Cloudflare distinguishes bucket-scoped object access from authority to edit bucket configuration. The latter can change or remove retention rules. [R2 token permissions](https://developers.cloudflare.com/r2/api/tokens/) |

Before allowing a hosted preview to answer, inspect the actual binding target, effective identity scopes, lock configuration and deployment roles. In a separately authorized disposable preview, use an object writer to verify denial of single-object overwrite and delete on a protected test key. Cloudflare documents HTTP 409 with `ObjectLockedByBucketPolicy`; batch deletion can return HTTP 200 with per-key errors. Verify the bytes and latest generation after each attempt. Verify the publisher cannot alter locks or bindings and ordinary clients cannot publish. Preserve the approved generation, digest and bucket identity outside the restore domain, and compare them before enabling a restored or rebound reader. Arbitrary storage writers in the threat model also require independent authorization of each new checkpoint.

**Readiness.** The transport evidence supports a separately authorized, Access-protected preview on the independently qualified path. Broad client acceptance still requires a hosted HTTPS run through the intended Access/CDN path and verification of the affected Windows path after remediation. The permission and restore controls above remain hosted acceptance gates. All work in 004E was local.
