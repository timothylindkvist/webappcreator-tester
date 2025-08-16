export const cn = (...c: (string|false|undefined)[]) => c.filter(Boolean).join(' ');
