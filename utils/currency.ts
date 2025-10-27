export function formatCurrency(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

export function formatPrice(price: number): string {
  return `₱${price.toFixed(2)}`;
}