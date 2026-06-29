// Abstraction layer for barcode detection so a fallback can be registered.
let _fallbackFactory = null;

export function registerFallback(factory) {
  _fallbackFactory = factory;
}

export function supportsNative() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export function hasFallback() {
  return typeof _fallbackFactory === 'function';
}

function createBarcodeDetectorFacade(options) {
  const detector = new BarcodeDetector(options);

  return {
    async detectFromCanvas(canvas) {
      const bitmap = await createImageBitmap(canvas);
      return detector.detect(bitmap);
    },
    reset() {
    }
  }
}

export async function createDetectorFacade(options = {}) {
  if (supportsNative()) {
    return new BarcodeDetector(options);
  }

  if (hasFallback()) {
    return _fallbackFactory(options);
  }

  // Minimal no-op detector to keep callers simple when no implementation exists.
  return {
    async detect() {
      console.warn('No barcode detector available; returning empty results.');
      return [];
    }
  };
}

export default {
  registerFallback,
  supportsNative,
  hasFallback,
  createDetectorFacade
};
