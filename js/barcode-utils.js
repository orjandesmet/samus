export function normalizeBarcode(raw) {
  if (!raw) return '';
  let code = String(raw).trim();

  const digitGroups = code.match(/\d+/g);
  if (digitGroups && digitGroups.length) {
    const preferred =
      digitGroups.find((group) => group.length === 13) ||
      digitGroups.find((group) => group.length === 12) ||
      digitGroups.reduce((a, b) => (a.length >= b.length ? a : b), '');
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
