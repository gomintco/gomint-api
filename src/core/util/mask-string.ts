export function maskString(s: string) {
  return s.slice(0, -4).replace(/./g, '*') + s.slice(-4);
}
