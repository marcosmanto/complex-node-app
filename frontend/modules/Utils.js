export function normalizeSpaces(str) {
  if(typeof(str) === 'string') {
    str = str.trim().replace(/ {2,}/g,' ')
  }
  return str
}
