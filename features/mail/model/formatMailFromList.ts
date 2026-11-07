/** « de Paul », « de Paul et de Kozy », « de A, de B et de C ». */
export function formatMailFromList(names: readonly string[]): string {
  if (names.length === 0) {
    return "";
  }
  if (names.length === 1) {
    return `de ${names[0]}`;
  }
  if (names.length === 2) {
    return `de ${names[0]} et de ${names[1]}`;
  }
  const head = names
    .slice(0, -1)
    .map((name) => `de ${name}`)
    .join(", ");
  return `${head} et de ${names[names.length - 1]}`;
}
