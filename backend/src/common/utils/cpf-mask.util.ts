/** Mask CPF for list responses — never expose full value. */
export function maskCpfFromDigits(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length < 11) return '***.***.***-**';
  return `***.***.***-${d.slice(-2)}`;
}

export function maskCpfDisplay(value?: string | null): string | undefined {
  if (!value) return undefined;
  return maskCpfFromDigits(value);
}
