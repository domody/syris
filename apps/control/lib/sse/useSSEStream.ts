'use client';

import { useEffect, useRef } from 'react';
import { getActiveBaseUrl } from '@/lib/http/environments';
import { useSSEStore } from './store';

const RECONNECT_DELAY_MS = 3_000;

export function useSSEStream() {
  const addEvent = useSSEStore((s) => s.addEvent);
  const setStatus = useSSEStore((s) => s.setStatus);
  const esRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    function connect() {
      if (cancelled) return;

      setStatus('connecting');
      const es = new EventSource(`${getActiveBaseUrl()}/stream/events`);
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) setStatus('connected');
      };

      es.onmessage = (e: MessageEvent) => {
        if (cancelled) return;
        try {
          addEvent(JSON.parse(e.data as string));
        } catch {
          // ignore malformed messages
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setStatus('error');
        es.close();
        esRef.current = null;
        timerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      esRef.current?.close();
      esRef.current = null;
      setStatus('disconnected');
    };
  }, [addEvent, setStatus]);
}
