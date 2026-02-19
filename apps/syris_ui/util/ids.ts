export function shortId(id: string | null | undefined, n = 8): string {
  if (!id) return "—";
  return id.length <= n ? id : id.slice(0, n);
}

export function shortRequestId(requestId: string | null | undefined): string {
  // Your request_ids are like "req_test_1" or "req_<hex>"
  if (!requestId) return "—";
  return requestId.startsWith("req_") ? requestId : `req_${shortId(requestId, 8)}`;
}
