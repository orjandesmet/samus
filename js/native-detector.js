let rafId = null;

export function createBarcodeDetectorFacade(options) {
  let isRunning = false;
  const detector = new BarcodeDetector(options);

  return {
    async detectFromVideo(video, callback) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      await video.play();

      async function step() {
        if (!isRunning) return;
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const bitmap = await createImageBitmap(video);
          const results = detector.detect(bitmap);
          callback(results);
        }
        catch (error) {
          console.warn('Barcode detection error:', error);
          throw error;
        }
        rafId = requestAnimationFrame(step);
      }
      step();
    },
    reset() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isRunning = false;
    }
  };
}