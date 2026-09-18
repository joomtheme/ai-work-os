// Deliberately incorrect benchmark fixture. Not application code.
export function totalCents(items) {
  return items.reduce((total, item) => total + item.priceCents, 0);
}
