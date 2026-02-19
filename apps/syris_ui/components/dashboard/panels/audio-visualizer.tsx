"use client";

import * as React from "react";
import { Panel } from "./base-panel";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AudioVisualizerProps = {
  mode?: "spectrum" | "waveform";
  fftSize?: number; // power of 2
  smoothing?: number;
  bars?: number;
};

function getCssVar(el: HTMLElement, name: string, fallback = "#ffffff") {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value.length ? value : fallback;
}

export function AudioVisualizer({
  mode = "spectrum",
  fftSize = 2048,
  smoothing = 0.85,
  bars = 128,
}: AudioVisualizerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const sourceRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);

  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stop = React.useCallback(() => {
    setRunning(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // stop tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // disconnect nodes
    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;

    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;

    // close context
    if (audioCtxRef.current) {
      // Safari sometimes throws if already closed
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  const start = React.useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;

      const src = ctx.createMediaStreamSource(stream);
      sourceRef.current = src;

      // connect mic -> analyser (no output to speakers)
      src.connect(analyser);

      setRunning(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to access microphone.");
      stop();
    }
  }, [fftSize, smoothing, stop]);

  // Resize canvas to device pixel ratio for crisp lines
  const resizeCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  React.useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  // Render loop
  React.useEffect(() => {
    if (!running) return;

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const parent = canvas.parentElement as HTMLElement | null;
    const fill = parent ? getCssVar(parent, "--primary") : "#fff";

    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear
      ctx2d.clearRect(0, 0, w, h);

      // Subtle baseline grid (terminal vibe)
      ctx2d.globalAlpha = 0.2;
      ctx2d.fillRect(0, h - 1 * dpr, w, 1 * dpr);
      ctx2d.globalAlpha = 1;

      if (mode === "waveform") {
        const bufferLen = analyser.fftSize;
        const data = new Uint8Array(bufferLen);
        analyser.getByteTimeDomainData(data);

        // Draw waveform
        ctx2d.beginPath();
        const midY = h / 2;
        for (let i = 0; i < bufferLen; i++) {
          const x = (i / (bufferLen - 1)) * w;
          const v = (data[i] - 128) / 128; // -1..1
          const y = midY + v * (h * 0.35);

          if (i === 0) ctx2d.moveTo(x, y);
          else ctx2d.lineTo(x, y);
        }
        ctx2d.lineWidth = 2 * dpr;
        ctx2d.strokeStyle = "currentColor"; // uses CSS currentColor
        ctx2d.stroke();
      } else {
        // Spectrum bars
        const freqBins = analyser.frequencyBinCount;
        const data = new Uint8Array(freqBins);
        analyser.getByteFrequencyData(data);

        const barCount = Math.max(8, bars);
        const step = Math.floor(freqBins / barCount);
        const gap = 2 * dpr;

        const barW = (w - gap * (barCount - 1)) / barCount;

        for (let i = 0; i < barCount; i++) {
          const bin = i * step;
          const v = data[bin] / 255; // 0..1

          const barH = barW + v * (h * 0.95 - barW);
          const x = i * (barW + gap);
          const y = (h - barH) / 2;

          ctx2d.globalAlpha = 0.75;
          ctx2d.fillStyle = fill;
          ctx2d.beginPath();
          ctx2d.roundRect(x, y, barW, barH, barW / 2);
          ctx2d.fill();
        }
        ctx2d.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [running, mode, bars]);

  // Clean up on unmount
  React.useEffect(() => () => stop(), [stop]);

  return (
    <Panel
      title={`Mic Visualizer • ${running ? "LIVE" : "OFF"}`}
      actions={
        !running ? (
          <Button size="sm" onClick={start}>
            Enable Mic
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={stop}>
            Stop
          </Button>
        )
      }
    >
      <div className="relative flex-1 rounded-md border bg-background/30 overflow-hidden h-full">
        {/* Set text color to control bar color via currentColor */}
        <div className="absoluter inset-0 text-primary">
          <canvas ref={canvasRef} className="h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] text-primary mx-auto p-2" />
        </div>

        {!running ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-muted-foreground bg-background">
            Click “Enable Mic” to preview waveform.
          </div>
        ) : null}
      </div>
    </Panel>
    // <div className={cn("flex h-full w-full flex-col gap-2")}>
    //   <div className="flex items-center justify-between gap-2">
    //     <div className="font-mono text-xs text-muted-foreground">

    //     </div>
    //     <div className="flex items-center gap-2">
    //   {!running ? (
    //     <Button size="sm" onClick={start}>
    //       Enable Mic
    //     </Button>
    //   ) : (
    //     <Button size="sm" variant="secondary" onClick={stop}>
    //       Stop
    //     </Button>
    //   )}
    //     </div>
    //   </div>

    //   {error ? (
    //     <div className="rounded-md border border-dashed p-3 text-xs font-mono text-muted-foreground">
    //       {error}
    //     </div>
    //   ) : null}

    // </div>
  );
}
