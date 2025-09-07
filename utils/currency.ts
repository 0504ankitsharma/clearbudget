// Utility functions for Indian currency formatting

/**
 * Format number as Indian Rupees with proper comma placement
 * @param amount - The amount to format
 * @param showSymbol - Whether to include ₹ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatINR(amount: number, showSymbol: boolean = true): string {
  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formattedAmount}` : formattedAmount;
}

/**
 * Format number as Indian Rupees without decimal places for whole numbers
 * @param amount - The amount to format
 * @param showSymbol - Whether to include ₹ symbol (default: true)
 * @returns Formatted currency string
 */
export function formatINRCompact(amount: number, showSymbol: boolean = true): string {
  const isWholeNumber = amount % 1 === 0;
  
  const formattedAmount = amount.toLocaleString('en-IN', {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formattedAmount}` : formattedAmount;
}

/**
 * Parse Indian currency string to number
 * @param currencyString - String like "₹1,25,000.50" or "125000.50"
 * @returns Parsed number
 */
export function parseINR(currencyString: string): number {
  // Remove currency symbol and commas, then parse
  const cleanedString = currencyString.replace(/[₹$,]/g, '');
  return parseFloat(cleanedString) || 0;
}

/**
 * Format large amounts with Indian units (Lakh, Crore)
 * @param amount - The amount to format
 * @param showSymbol - Whether to include ₹ symbol (default: true)
 * @returns Formatted currency string with units
 */
export function formatINRWithUnits(amount: number, showSymbol: boolean = true): string {
  const symbol = showSymbol ? '₹' : '';
  
  if (amount >= 10000000) { // 1 Crore
    const crores = amount / 10000000;
    return `${symbol}${crores.toFixed(2)} Cr`;
  } else if (amount >= 100000) { // 1 Lakh
    const lakhs = amount / 100000;
    return `${symbol}${lakhs.toFixed(2)} L`;
  } else if (amount >= 1000) { // 1 Thousand
    const thousands = amount / 1000;
    return `${symbol}${thousands.toFixed(1)}K`;
  } else {
    return formatINR(amount, showSymbol);
  }
}

/**
 * Convert dollars to rupees (approximate conversion for migration)
 * @param dollarAmount - Amount in dollars
 * @param exchangeRate - USD to INR rate (default: 83)
 * @returns Amount in rupees
 */
export function dollarToRupee(dollarAmount: number, exchangeRate: number = 83): number {
  return Math.round(dollarAmount * exchangeRate);
}

/**
 * Get currency symbol for India
 * @returns Indian Rupee symbol
 */
export function getCurrencySymbol(): string {
  return '₹';
}
