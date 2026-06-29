import { DEBUG_MODE, logDebug } from './logger.js';
import { setStatus } from './status-bar.js';

const updateBanner = document.getElementById('updateBanner');
const reloadBtn = document.getElementById('reloadBtn');
let refreshing = false;


function showUpdatePrompt(worker) {
  waitingWorker = worker;
  if (updateBanner) updateBanner.classList.add('show');
}

function hideUpdatePrompt() {
  waitingWorker = null;
  if (updateBanner) updateBanner.classList.remove('show');
}


function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  }).catch(error => {
    logDebug(`SW unregister failed: ${error.message || error}`);
  });
}

export function registerServiceWorker() {
  if (DEBUG_MODE) {
    setStatus('Debug mode: service worker disabled.');
    unregisterServiceWorker();
    return;
  }

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


if (reloadBtn) {
  reloadBtn.addEventListener('click', () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    hideUpdatePrompt();
    setStatus('Updating to latest version...');
    window.location.reload();
  });
}