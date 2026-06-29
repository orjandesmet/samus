/*global ZXing*/
/**
 * Creates a ZXing barcode reader instance.
 * @param {{formats: string[]}} options
 * @returns
 */
export function zxingFactory(options) {
  const hints = new Map();
  hints.set(
    ZXing.DecodeHintType.POSSIBLE_FORMATS,
    options.formats.map((format) => ZXing.BarcodeFormat[format.toUpperCase()])
  );
  const detector = new ZXing.BrowserMultiFormatReader(hints);
  const detectFromVideo = async (video, callback) => {
    detector.decodeFromVideoContinuously(video, '', (result, error) => {
      if (result) {
        callback([
          {
            rawValue: result.getText(),
            boundingBox: null, // ZXing does not provide bounding box information
          },
        ]);
      }
      if (error && !(error instanceof ZXing.NotFoundException)) {
        console.warn('ZXing detection error:', error);
      }
    });
    return [];
  };

  return {
    detectFromVideo,
    reset() {
      detector.stopContinuousDecode();
      detector.reset();
    },
  };
}
