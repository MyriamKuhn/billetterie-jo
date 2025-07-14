import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { logError } from "../utils/logger";

export function useQrScanner(
  containerId: string,
  onDecode: (decodedText: string) => void,
  onError: (error: Error) => void
) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.clear();
    } catch {}
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onDecode,
        () => {}
      );
      startedRef.current = true;
    } catch (e) {
      logError("ScannerError", e);
      onError(e as Error);
    }
  }, [onDecode, onError]);

  const stop = useCallback(async () => {
    if (startedRef.current && scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      startedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (scannerRef.current) return;
    scannerRef.current = new Html5Qrcode(containerId);
    start();
    return () => { stop(); };
  }, [containerId, start, stop]);

  return { start, stop };
}