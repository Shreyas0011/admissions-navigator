import { useEffect, useRef } from "react";

type Props = {
  active: boolean;
  onResult: (text: string) => void;
};

const REGION_ID = "ground-qr-region";

/** Thin wrapper around html5-qrcode; loaded lazily so SSR never touches it. */
export function QrScanner({ active, onResult }: Props) {
  const handler = useRef(onResult);
  handler.current = onResult;

  useEffect(() => {
    if (!active) return;
    let stop: (() => Promise<void>) | null = null;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      stop = async () => {
        try {
          await scanner.stop();
          scanner.clear();
        } catch {
          /* already stopped */
        }
      };
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => handler.current(decoded),
        () => undefined,
      );
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      void stop?.();
    };
  }, [active]);

  return (
    <div
      id={REGION_ID}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface-container"
    />
  );
}
