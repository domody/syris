"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageWrap } from "@/components/ui/page-wrap";

function normalizeBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (![8, 12, 13, 14].includes(digits.length)) return null;
  return digits;
}

export default function BarcodeScanPage() {
  const router = useRouter();
  const params = useSearchParams();

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const controlsRef = React.useRef<{ stop: () => void } | null>(null);

  const [error, setError] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        setError(null);
        setScanning(true);

        const [
          { BrowserMultiFormatReader },
          { BarcodeFormat, DecodeHintType },
        ] = await Promise.all([
          import("@zxing/browser"),
          import("@zxing/library"),
        ]);

        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.UPC_A,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
          BarcodeFormat.RSS_14,
          BarcodeFormat.RSS_EXPANDED,
        ]);

        const codeReader = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 200,
          delayBetweenScanSuccess: 1000, // avoid multiple alerts if the code stays in view
        });

        const videoElement = videoRef.current;
        if (!videoElement) throw new Error("Video Element is not ready.");

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const controls = await codeReader.decodeFromConstraints(
          constraints,
          videoElement,
          (result, err, controlsFromCb) => {
            if (!mounted) return;

            if (result) {
              const raw = result.getText();
              //   console.log("ZXing decoded:", {
              //     text: raw,
              //     format: result.getBarcodeFormat(),
              //   });

              const code = normalizeBarcode(raw);
              if (!code) {
                console.warn("Decoded but filtered by normalizeBarcode:", raw);
                return;
              }

              controlsFromCb.stop();
              controlsRef.current = null;
              setScanning(false);

              //   window.alert(`Found code: ${code}`);
              router.push(`/add/product/${code}`);
              return;
            }

            if (err && err.name !== "NotFoundException") {
              console.error("ZXing error:", err);
            }
          },
        );

        controlsRef.current = controls;

        await videoElement.play().catch(() => {});
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to start scanner");
        setScanning(false);
      }
    }

    start();

    return () => {
      mounted = false;
      try {
        controlsRef.current?.stop();
      } catch {}
      controlsRef.current = null;
    };
  }, []);

  return (
    <PageWrap className="relative">
      <video
        ref={videoRef}
        className="w-full h-full object-fill"
        muted
        playsInline
        autoPlay
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-72 rounded-xl border border-white/60" />
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
        <button
          className="rounded-lg bg-black/60 px-3 py-2 text-white"
          onClick={() => {
            controlsRef.current?.stop();
            router.back();
          }}
        >
          Cancel
        </button>

        <div className="text-sm text-white">
          {error ? error : scanning ? "Scanning…" : "Ready"}
        </div>
      </div>
    </PageWrap>
  );
}
