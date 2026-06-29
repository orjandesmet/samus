/**
 * Creates a ZXing barcode reader instance.
 * @param {{formats: string[]}} options
 * @returns
 */
export function zxingFactory(options) {
  const detector = new ZXing.BrowserMultiFormatReader();
  const detectFromVideo = async (video, callback) => {
    detector.decodeFromVideoContinuously(video, "", (result, error) => {
      if (result) {
        callback([
          {
            rawValue: result.getText(),
            boundingBox: null, // ZXing does not provide bounding box information
          },
        ]);
      }
      if (error && !(error instanceof ZXing.NotFoundException)) {
        console.warn("ZXing detection error:", error);
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

async function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert canvas to blob."));
      }
    });
  });
}
