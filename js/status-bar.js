const statusEl = document.getElementById('status');

export function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}
