export function tokenize(text) {
  return text.split(/\s+/).filter(token => token.length > 0);
}
