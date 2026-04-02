export type Environment = "dev" | "prod";

export const ENV_URLS: Record<Environment, string> = {
  dev: "http://127.0.0.1:8000",
  prod: "https://api.syris.uk",
};

const STORAGE_KEY = "syris_env";

export function getActiveEnvironment(): Environment {
  if (typeof window === "undefined") return "dev"; // SSR fallback
  return (localStorage.getItem(STORAGE_KEY) as Environment) ?? "dev";
}

export function setActiveEnvironment(env: Environment): void {
  localStorage.setItem(STORAGE_KEY, env);
}

export function getActiveBaseUrl(): string {
  return ENV_URLS[getActiveEnvironment()];
}
