import "server-only";

const OFF_BASE = process.env.NEXT_PUBLIC_OFF_BASE
const OFF_UA = process.env.OFF_UA

type FetchJsonOptions = Omit<RequestInit, "body"> & { body?: unknown }

export async function offFetchJson<T>(path: string, init: FetchJsonOptions = {}): Promise<T> {
    if (!OFF_BASE || !OFF_UA) {
        throw new Error(`Base or User-Agent not loaded from .env.`)
    }

    const url = `${OFF_BASE}${path}`

    const response = await fetch(url, {
        ...init,
        headers: {
            "User-Agent": OFF_UA,
            "content-type": "application/json",
            ...(init.headers || {})
        },
        body: init.body ? JSON.stringify(init.body) : undefined
    })

    if (!response.ok) {
        throw new Error(`OFF request failed ${response.status}`)
    }

    return (await response.json()) as T;
}