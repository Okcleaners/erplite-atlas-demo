// Enforce the ceiling on decoded bytes even for chunked or compressed responses.
export async function readBoundedBody(response, limit) {
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks, total);
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new Error("Body exceeds size limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}
