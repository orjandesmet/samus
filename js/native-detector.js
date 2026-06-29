export function createBarcodeDetectorFacade(options) {
  const detector = new BarcodeDetector(options);

  return {
    async detectFromCanvas(canvas) {
      const bitmap = await createImageBitmap(canvas);
      return detector.detect(bitmap);
    },
    reset() {
    }
  };
}