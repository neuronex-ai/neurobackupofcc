export function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeBoletoInput(value: string) {
  const digits = onlyDigits(value);
  return {
    digits,
    kind: digits.length === 44 ? "barcode" : "identificationField",
    isValid: [44, 47, 48].includes(digits.length),
  } as const;
}

export function formatBoletoValue(value: string) {
  const digits = onlyDigits(value);
  if (digits.length <= 44) return digits;
  return digits.replace(/(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})/, "$1.$2 $3.$4 $5.$6 $7 $8");
}

export function findBoletoCandidate(text: string) {
  const compact = onlyDigits(text);
  const match48 = compact.match(/\d{48}/);
  if (match48) return match48[0];
  const match47 = compact.match(/\d{47}/);
  if (match47) return match47[0];
  const match44 = compact.match(/\d{44}/);
  return match44?.[0] || null;
}
