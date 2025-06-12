/**
 * Date formatting utilities
 * Created: June 11, 2025
 * Updated: June 11, 2025 - Fixed Luxon dependency issues
 * 
 * Provides robust date formatting with fallbacks
 * All date formatting is now handled natively in JavaScript. No Luxon or external libraries required.
 */

/**
 * Safely formats a date string with multiple fallback methods
 * @param {string|Date} dateStr - The date string or object to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDateSafe(dateStr) {
  if (!dateStr) return "";
  
  try {
    // Fallback to native Date without depending on Luxon
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return "";
    }
    
    // Format the date as "DD MMM YYYY HH:MM"
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return "";
  }
}

/**
 * Formats a date for tabulator with proper error handling
 * Used by custom luxonDatetime formatter
 * @param {string} dateStr - The date string to format
 * @param {object} format - Format options (inputFormat, outputFormat)
 * @returns {string} Formatted date string
 */
export function formatTabulatorDate(dateStr, format = {}) {
  if (!dateStr) return format.invalidPlaceholder || "";
  
  try {
    // Use our basic formatter without Luxon dependency
    const formatted = formatDateSafe(dateStr);
    return formatted || format.invalidPlaceholder || dateStr;
  } catch (e) {
    console.error("Date formatting error:", e);
    return format.invalidPlaceholder || dateStr;
  }
}

export default {
  formatDateSafe,
  formatTabulatorDate
};
