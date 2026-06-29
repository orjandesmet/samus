
const productInfo = document.getElementById('productInfo');
const storedProducts = document.getElementById('storedProducts');

const STORAGE_KEY = 'barcodeShortcutProducts';

export function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    return {};
  }
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  renderStoredProducts(products);
}

export function renderStoredProducts(products = loadProducts()) {
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

export function showProduct(name, code) {
  productInfo.textContent = `Product: ${name} (${code})`;
}