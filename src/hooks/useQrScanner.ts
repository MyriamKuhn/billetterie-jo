import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { logError } from "../utils/logger";

/**
 * Custom hook to initialize and control an HTML5 QR code scanner.
 *
 * @param containerId - The DOM element ID where the scanner will render.
 * @param onDecode    - Callback invoked when a QR code is successfully decoded.
 * @param onError     - Callback invoked on scanner initialization or runtime error.
 * @returns An object with `start` and `stop` methods to control the scanner.
 */
export function useQrScanner(
  containerId: string,
  onDecode: (decodedText: string) => void,
  onError: (error: Error) => void
) {
  // Holds the scanner instance
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Tracks whether scanning is currently active
  const startedRef = useRef(false);

  /**
   * Starts the QR code scanner in the environment-facing camera.
   * Clears any previous instance, then begins decoding at 10 FPS with a 250px box.
   */
  const start = useCallback(async () => {
    if (!scannerRef.current) return;

    // Clear any previous scanning session
    try {
      await scannerRef.current.clear();
    } catch {
      // ignore errors on clear
    }
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        onDecode, // success callback
        () => {}  // ignore per-frame errors
      );
      startedRef.current = true;
    } catch (e) {
      // Log and report initialization error
      logError("ScannerError", e);
      onError(e as Error);
    }
  }, [onDecode, onError]);

  /**
   * Stops the QR code scanner if it is currently running.
   */
  const stop = useCallback(async () => {
    if (startedRef.current && scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore errors on stop
      }
      startedRef.current = false;
    }
  }, []);

  // Initialize scanner on first render and cleanup on unmount
  useEffect(() => {
    if (scannerRef.current) return;
    // Create Html5Qrcode instance bound to the container
    scannerRef.current = new Html5Qrcode(containerId);
    // Start scanning immediately
    start();
    // Stop scanner when component unmounts or containerId changes
    return () => { stop(); };
  }, [containerId, start, stop]);

  return { start, stop };
}