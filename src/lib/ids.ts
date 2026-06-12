export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function orderNo(counter: number): string {
  return `KO-${new Date().getFullYear()}-${String(counter).padStart(3, '0')}`;
}

export function poNo(counter: number): string {
  return `IO-${new Date().getFullYear()}-${String(counter).padStart(3, '0')}`;
}
