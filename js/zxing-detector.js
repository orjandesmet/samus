
/**
 * Creates a ZXing barcode reader instance.
 * @param {{formats: string[]}} options 
 * @returns 
 */
export function zxingFactory(options) {
  const detector = new ZXing.BrowserMultiFormatReader();
  
  return {
    /**
     * 
     * @param {HTMLCanvasElement} canvas 
     * @returns 
    */
   async detectFromCanvas(canvas) {
     const img = document.createElement('img');
     img.style.position = 'absolute';
     img.style.pointerEvents = 'none';
     img.style.opacity = '0';
     try {
       img.src = URL.createObjectURL(await canvasToBlob(canvas));
       document.body.appendChild(img);
        const result = await detector.decodeFromImage(img);
        if (result) {
          console.log('Result detected:', result);
          return [{
            rawValue: result.getText(),
            boundingBox: null // ZXing does not provide bounding box information
          }];
        }
      } catch (error) {
        // console.warn('ZXing detection error:', error);
      } finally {
        document.body.removeChild(img);
        URL.revokeObjectURL(img.src);
      }
      return [];
    },
    reset() {
      detector.reset();
    }
  }
}

async function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob.'));
      }
    });
  });
}