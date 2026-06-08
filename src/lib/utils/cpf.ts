/** Masks CPF for display: ***.***.***-XX (last 2 digits visible) */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export function isValidCpfFormat(cpf: string): boolean {
  return normalizeCpf(cpf).length === 11;
}
