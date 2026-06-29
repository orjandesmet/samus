
const debugEl = document.getElementById('debug');
export const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';

export function logDebug(message) {
  console.log(message);
  if (debugEl) {
    debugEl.textContent = `${message}\n${debugEl.textContent}`;
  }
}