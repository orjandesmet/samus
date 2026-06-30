import {
  loadProducts,
  removeStoredProduct,
  renderStoredProducts,
} from './product-utils.js';

const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const showProductsBtn = document.getElementById('showProductsBtn');
const closeProductsBtn = document.getElementById('closeProductsBtn');
const storedProductsPanel = document.getElementById('storedProductsPanel');

export function bootstrapButtons(startCamera, stopCamera, setStatus) {
  if (startBtn) startBtn.addEventListener('click', startCamera);
  if (stopBtn) stopBtn.addEventListener('click', stopCamera);

  if (showProductsBtn && storedProductsPanel) {
    showProductsBtn.addEventListener('click', () => {
      storedProductsPanel.showModal();
      renderStoredProducts(loadProducts());
    });
  }

  if (closeProductsBtn && storedProductsPanel) {
    closeProductsBtn.addEventListener('click', () => {
      storedProductsPanel.close();
    });
  }

  if (storedProductsPanel) {
    storedProductsPanel.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const removeBtn = target.closest('[data-remove-code]');
      if (!removeBtn) return;

      const code = removeBtn.getAttribute('data-remove-code');
      removeStoredProduct(code);
      renderStoredProducts(loadProducts());
      setStatus('Stored product removed.');
    });
  }
}

export function enableStartBtn() {
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
}

export function disableStartBtn() {
  if (startBtn) startBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = false;
}
