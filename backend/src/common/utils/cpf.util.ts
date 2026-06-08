export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export function hasValidCpfLength(cpf: string): boolean {
  return normalizeCpf(cpf).length === 11;
}
