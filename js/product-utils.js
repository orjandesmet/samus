const productInfo = document.getElementById('productInfo');
const storedProducts = document.getElementById('storedProducts');

const STORAGE_KEY = 'barcodeShortcutProducts';

export function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.error('Error loading products:', error);
    return {};
  }
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  renderStoredProducts(products);
  return products;
}

export function removeStoredProduct(code) {
  const products = loadProducts();
  if (!products[code]) {
    renderStoredProducts(products);
    return false;
  }

  delete products[code];
  saveProducts(products);
  return true;
}

export function renderStoredProducts(products = loadProducts()) {
  if (!storedProducts) return;

  const entries = Object.entries(products);
  if (!entries.length) {
    storedProducts.innerHTML = '';
    const emptyState = document.createElement('div');
    emptyState.className = 'small';
    emptyState.textContent = 'No products stored yet.';
    storedProducts.appendChild(emptyState);
    return;
  }

  storedProducts.innerHTML = '';
  entries
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, name]) => {
      const container = document.createElement('div');
      container.className = 'product-item';

      const meta = document.createElement('div');
      meta.className = 'product-meta';
      const label = document.createElement('div');
      label.textContent = name;
      const value = document.createElement('div');
      value.textContent = code;
      value.className = 'small';
      meta.append(label, value);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-product-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.setAttribute('data-remove-code', code);

      container.append(meta, removeBtn);
      storedProducts.appendChild(container);
    });
}

export function showProduct(name, code) {
  if (!productInfo) return;
  productInfo.textContent = `Product: ${name} (${code})`;
}
