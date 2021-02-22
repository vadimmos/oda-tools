export const htmlTag = /(?<=<\/?)[\w\d-]*(?=[ >])/;
export const importing = /(?<=['"`,]\s*)@[^@\/]*\/[^@"'`,]*(?=['"`,])/;
export const extending = /(?<=extends\s*:\s*['"`]([^,\s'"`]*,\s*)*)[^,\s'"`]*(?=["'`]|(,\s*))/;
export const odaPrefix = /^(oda(nt)?-)/;

const CP_REG_EXP_FULL_CACHE = new Map;
const CP_REG_EXP_SHORT_CACHE = new Map;

export function getCptDefRegExpFull(name: string): RegExp {
  if (!CP_REG_EXP_FULL_CACHE.get(name)) {
    CP_REG_EXP_FULL_CACHE.set(name, new RegExp(`(?<=oda(nt)?\\s*\\(\\s*{\\s*is\\s*:\\s*['"\`])(oda(nt)?-)?${name}(?=["'\`]\\s*,)`, 'ig'));
  }
  return CP_REG_EXP_FULL_CACHE.get(name);
}
export function getCptDefRegExpShort(name: string): RegExp {
  if (!CP_REG_EXP_SHORT_CACHE.get(name)) {
    CP_REG_EXP_SHORT_CACHE.set(name, new RegExp(`(?<=is\\s*:\\s*['"\`])(oda(nt)?-)?${name}(?=["'\`]\\s*,)`, 'ig'));
  }
  return CP_REG_EXP_SHORT_CACHE.get(name);
}