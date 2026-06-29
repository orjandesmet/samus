import { createDetectorFacade, hasFallback, registerFallback, supportsNative } from './barcode-detector.js';
import { normalizeBarcode } from './barcode-utils.js';
import { bootstrapButtons, disableStartBtn, enableStartBtn } from './buttons.js';
import { logDebug } from './logger.js';
import { loadProducts, renderStoredProducts, saveProducts, showProduct } from './product-utils.js';
import { setStatus } from './status-bar.js';
import { registerServiceWorker } from './sw-updater.js';

import { zxingFactory } from './zxing-detector.js';
registerFallback(zxingFactory);

const video = document.getElementById('video');

const reticule = document.getElementById('reticule');

let stream = null;
let detectorFacade = null;
let scanTimeoutId = null;
let lastHandled = null;
let lastHandledTime = 0;
let waitingWorker = null;

const SCAN_STOP_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function resetScanTimeout() {
  if (scanTimeoutId) {
    clearTimeout(scanTimeoutId);
  }
  scanTimeoutId = window.setTimeout(() => {
    if (stream) {
      setStatus('No barcode detected for 10 minutes. Camera stopped.');
      stopCamera();
    }
  }, SCAN_STOP_TIMEOUT);
}

function clearScanTimeout() {
  if (scanTimeoutId) {
    clearTimeout(scanTimeoutId);
    scanTimeoutId = null;
  }
}

const SHORTCUT_NAME = 'Neo';


function drawReticule(boundingBox) {
  if (!reticule || !boundingBox || !video.videoWidth || !video.videoHeight) {
    hideReticule();
    return;
  }

  const videoRect = video.getBoundingClientRect();
  const scaleX = videoRect.width / video.videoWidth;
  const scaleY = videoRect.height / video.videoHeight;
  const left = Math.max(0, boundingBox.x * scaleX);
  const top = Math.max(0, boundingBox.y * scaleY);
  const width = Math.max(1, boundingBox.width * scaleX);
  const height = Math.max(1, boundingBox.height * scaleY);

  reticule.style.left = `${left}px`;
  reticule.style.top = `${top}px`;
  reticule.style.width = `${width}px`;
  reticule.style.height = `${height}px`;
  reticule.classList.add('active');
}

function hideReticule() {
  if (!reticule) return;
  reticule.classList.remove('active');
}

function openShortcut(name) {
  const text = encodeURIComponent(name);
  const url = `shortcuts://run-shortcut?name=${SHORTCUT_NAME}&input=text&text=${text}`;
  window.open(url, '_blank');
}

function handleCode(rawCode) {
  if (!rawCode) return;

  const code = normalizeBarcode(rawCode);
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (!code) return;
  if (code === lastHandled && now - lastHandledTime < oneHour) return;

  lastHandled = code;
  lastHandledTime = now;
  setStatus(`Scanned: ${code}`);

  const products = loadProducts();
  if (products[code]) {
    showProduct(products[code], code);
    openShortcut(products[code]);
    return;
  }

  const name = prompt(`Product not found for ${code}. Enter a name to save and run shortcut:`, '');
  if (!name) {
    setStatus('No product added. Ready.');
    return;
  }

  products[code] = name.trim();
  saveProducts(products);
  showProduct(products[code], code);
  openShortcut(products[code]);
  setStatus('Product saved and shortcut launched.');
}

function resultsDetected(results) {
  if (results.length) {
    const result = results[0];
    console.log('Detected barcode:', result);
    resetScanTimeout();
    handleCode(result.rawValue || result.rawData);
    drawReticule(result.boundingBox || result.boundingBox || null);
  } else {
    hideReticule();
  }
}

async function scanLoop() {
  if (!detectorFacade) return;

  try {
    detectorFacade.detectFromVideo(video,resultsDetected);
  } catch (error) {
    logDebug(`Scan error: ${error.message || error}`);
    hideReticule();
  }
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Camera access is not supported in this browser.');
    return;
  }

  if (!supportsNative() && !hasFallback()) {
    setStatus('BarcodeDetector is not available. Enable Shape Detection or use a supported browser.');
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    // await video.play();
    setStatus('Camera started. Point at a barcode.');
    disableStartBtn();

    detectorFacade = await createDetectorFacade({ formats: ['ean_13', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    scanLoop();
    resetScanTimeout();
  } catch (error) {
    setStatus(`Camera error: ${error.message || error}`);
    logDebug(`startCamera error: ${error.message || error}`);
  }
}

function stopCamera() {

  if (detectorFacade) {
    detectorFacade.reset();
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  clearScanTimeout();

  enableStartBtn();
  setStatus('Camera stopped.');
}


window.addEventListener('load', () => {
  bootstrapButtons(startCamera, stopCamera, setStatus);
  renderStoredProducts();
  registerServiceWorker();
});