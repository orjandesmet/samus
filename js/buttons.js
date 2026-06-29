import { renderStoredProducts } from "./product-utils.js";

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const clearBtn = document.getElementById("clear");

export function bootstrapButtons(startCamera, stopCamera, setStatus) {
  startBtn.addEventListener("click", startCamera);
  stopBtn.addEventListener("click", stopCamera);
  clearBtn.addEventListener("click", () => {
    renderStoredProducts({});
    setStatus("Stored products cleared.");
  });
}

export function enableStartBtn() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

export function disableStartBtn() {
  startBtn.disabled = true;
  stopBtn.disabled = false;
}
