import { HttpError } from "./http-client";

export function isNetworkError(err: unknown) {
  // fetch failed: server down, DNS, CORS, offline, etc etc etc
  if (err instanceof TypeError) return true;

  if (err instanceof Error) {
    console.log(`Error mesasge from backend: ${err.message} ${(err as any).code} ${typeof err}`)
  }
  
  return false;
}

export function getErrorSummary(err: unknown) {
  if (err instanceof HttpError) {
    return `API Error (${err.status})`;
  }

  if (err instanceof Error) return err.message;
  return "Unknown Error";
}
