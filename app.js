const video = document.getElementById('video');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const clearBtn = document.getElementById('clear');
const statusEl = document.getElementById('status');
const debugEl = document.getElementById('debug');
const productInfo = document.getElementById('productInfo');
const storedProducts = document.getElementById('storedProducts');
const updateBanner = document.getElementById('updateBanner');
const reloadBtn = document.getElementById('reloadBtn');
const reticule = document.getElementById('reticule');

let stream = null;
let detector = null;
let rafId = null;
let lastHandled = null;
let lastHandledTime = 0;
let waitingWorker = null;
let refreshing = false;

const STORAGE_KEY = 'barcodeShortcutProducts';
const SHORTCUT_NAME = 'Neo';

function logDebug(message) {
  console.log(message);
  if (debugEl) {
    debugEl.textContent = `${message}\n${debugEl.textContent}`;
  }
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  renderStoredProducts(products);
}

function renderStoredProducts(products = loadProducts()) {
  const entries = Object.entries(products);
  if (!entries.length) {
    storedProducts.textContent = 'No products stored yet.';
    return;
  }

  storedProducts.innerHTML = '';
  entries.sort(([a], [b]) => a.localeCompare(b)).forEach(([code, name]) => {
    const container = document.createElement('div');
    container.className = 'product-item';
    const label = document.createElement('div');
    label.textContent = name;
    const value = document.createElement('div');
    value.textContent = code;
    value.className = 'small';
    container.append(label, value);
    storedProducts.appendChild(container);
  });
}

function normalizeBarcode(raw) {
  if (!raw) return '';
  let code = String(raw).trim();

  const digitGroups = code.match(/\d+/g);
  if (digitGroups && digitGroups.length) {
    const preferred = digitGroups.find(group => group.length === 13)
      || digitGroups.find(group => group.length === 12)
      || digitGroups.reduce((a, b) => (a.length >= b.length ? a : b), '');
    code = preferred;
  }

  if (/^\d+$/.test(code)) {
    if (code.length === 12) {
      code = '0' + code;
    }
    return code;
  }

  return code.toUpperCase();
}

function showProduct(name, code) {
  productInfo.textContent = `Product: ${name} (${code})`;
}

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

  const name = prompt('Product not found. Enter a name to save and run shortcut:', '');
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

async function scanLoop() {
  if (!detector) return;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  async function step() {
    if (!stream) return;
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const bitmap = await createImageBitmap(canvas);
      const results = await detector.detect(bitmap);
      if (results.length) {
        const result = results[0];
        console.log('Detected barcode:', result);
        handleCode(result.rawValue || result.rawData);
        drawReticule(result.boundingBox || result.boundingBox || null);
      } else {
        hideReticule();
      }
    } catch (error) {
      logDebug(`Scan error: ${error.message || error}`);
      hideReticule();
    }
    rafId = requestAnimationFrame(step);
  }

  step();
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setStatus('Camera access is not supported in this browser.');
    return;
  }

  if (!('BarcodeDetector' in window)) {
    setStatus('BarcodeDetector is not available. Enable Shape Detection or use a supported browser.');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    video.srcObject = stream;
    await video.play();
    setStatus('Camera started. Point at a barcode.');
    startBtn.disabled = true;
    stopBtn.disabled = false;

    detector = new BarcodeDetector({ formats: ['ean_13', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    scanLoop();
  } catch (error) {
    setStatus(`Camera error: ${error.message || error}`);
    logDebug(`startCamera error: ${error.message || error}`);
  }
}

function stopCamera() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus('Camera stopped.');
}

function showUpdatePrompt(worker) {
  waitingWorker = worker;
  if (updateBanner) updateBanner.classList.add('show');
}

function hideUpdatePrompt() {
  waitingWorker = null;
  if (updateBanner) updateBanner.classList.remove('show');
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    logDebug('Service worker not supported.');
    return;
  }

  navigator.serviceWorker.register('sw.js').then(registration => {
    logDebug('Service worker registered.');

    if (registration.waiting) {
      showUpdatePrompt(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            showUpdatePrompt(installingWorker);
          } else {
            logDebug('Service worker installed for the first time. App is ready offline.');
          }
        }
      });
    });
  }).catch(error => {
    logDebug(`SW registration failed: ${error.message || error}`);
  });

  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
      if (updateBanner) updateBanner.classList.add('show');
      setStatus('Update available. Reload to refresh cached assets.');
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    if (!waitingWorker) return;
    refreshing = true;
    window.location.reload();
  });
}

startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);
clearBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderStoredProducts({});
  setStatus('Stored products cleared.');
});

if (reloadBtn) {
  reloadBtn.addEventListener('click', () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    hideUpdatePrompt();
    setStatus('Updating to latest version...');
    window.location.reload();
  });
}

window.addEventListener('load', () => {
  renderStoredProducts();
  registerServiceWorker();
});
