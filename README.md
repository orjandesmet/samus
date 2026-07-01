# samus

A tool to run as a PWA on an old phone, fixed to the wall in the storage room. It scans a barcode and uses iOS Shortcuts to add a product to the grocery list.

## External technologies used

- ZXing as barcode scanner, because the browser API BarcodeDetector is not available on the target device.
- Vite to create versioned builds
- VitePWA to generate service worker registration and manifest.
