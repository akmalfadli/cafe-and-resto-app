/**
 * Capitalizes the first character of each word in a string (Title Case / Capitalize Words).
 * Example: "ES TEH MANIS" -> "Es Teh Manis", "kopi susu gula aren" -> "Kopi Susu Gula Aren"
 */
export const toCapitalCase = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
