import { createBarcodeDetectorFacade } from "./native-detector.js";

// Abstraction layer for barcode detection so a fallback can be registered.
let _fallbackFactory = null;

export function registerFallback(factory) {
  _fallbackFactory = factory;
}

export function supportsNative() {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function hasFallback() {
  return typeof _fallbackFactory === "function";
}

export async function createDetectorFacade(options = {}) {
  if (supportsNative()) {
    return createBarcodeDetectorFacade(options);
  }

  if (hasFallback()) {
    return _fallbackFactory(options);
  }

  // Minimal no-op detector to keep callers simple when no implementation exists.
  return {
    async detectFromVideo() {
      console.warn("No barcode detector available; returning empty results.");
      return [];
    },
    reset() {},
  };
}

export default {
  registerFallback,
  supportsNative,
  hasFallback,
  createDetectorFacade,
};
