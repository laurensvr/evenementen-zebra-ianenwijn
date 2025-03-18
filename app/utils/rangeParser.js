/**
 * Parses a string input containing wine numbers in various formats:
 * - Individual numbers: "1,2,3"
 * - Ranges: "1-5"
 * - Mixed: "1-5,7,9-12"
 * 
 * @param {string} input - The input string to parse
 * @returns {number[]} Array of unique numbers
 */
export default function parseRangeInput(input) {
  // Remove all whitespace and split by commas
  const parts = input.replace(/\s/g, '').split(',');
  const numbers = new Set();

  parts.forEach(part => {
    if (part.includes('-')) {
      // Handle range (e.g., "1-5")
      const [start, end] = part.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          numbers.add(i);
        }
      }
    } else {
      // Handle single number
      const num = Number(part);
      if (!isNaN(num)) {
        numbers.add(num);
      }
    }
  });

  // Convert Set to sorted array
  return Array.from(numbers).sort((a, b) => a - b);
}
