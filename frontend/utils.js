// Utilities module for news aggregator

/**
 * Format date safely with fallbacks
 * @param {string|Date} dateStr - Date string or object to format
 * @returns {string} - Formatted date string
 */
function formatDateSafe(dateStr) {
  if (!dateStr) return "";
  
  try {
    // Try with Luxon first if available
    if (window.luxon && window.luxon.DateTime) {
      const dt = window.luxon.DateTime.fromISO(dateStr);
      if (dt.isValid) {
        return dt.toFormat("dd MMM yyyy HH:mm");
      }
    }
    
    // Fallback to native Date
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "" : date.toLocaleString();
  } catch (e) {
    console.error("Date formatting error:", e);
    return "";
  }
}

/**
 * Debug logging helper
 * @param {Array} args - Arguments to log
 */
function debugLog(...args) {
  const debug = (window.localStorage.getItem('debug') === 'true') || true;
  if (debug) console.log('[DEBUG]', ...args);
}

/**
 * Generate a unique ID
 * @returns {string} - Unique ID
 */
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Extract keywords from text (for search fallback)
 * @param {string} text - Text to extract keywords from
 * @param {number} maxWords - Maximum number of keywords to return
 * @returns {string} - Keywords string
 */
function extractKeywords(text, maxWords = 3) {
  if (!text) return '';
  
  // Common stop words to filter out
  const stopWords = new Set([
    'about', 'after', 'all', 'also', 'an', 'and', 'another', 'any', 'are', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by',
    'came', 'can', 'come', 'could', 'did', 'do', 'does', 'each', 'else', 'for', 'from',
    'get', 'got', 'has', 'had', 'he', 'have', 'her', 'here', 'him', 'himself', 'his',
    'how', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'like', 'make', 'many',
    'me', 'might', 'more', 'most', 'much', 'must', 'my', 'never', 'now', 'of', 'on',
    'only', 'or', 'other', 'our', 'out', 'over', 'said', 'same', 'see', 'should',
    'since', 'some', 'still', 'such', 'take', 'than', 'that', 'the', 'their', 'them',
    'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
    'up', 'very', 'was', 'way', 'we', 'well', 'were', 'what', 'where', 'which', 'while',
    'who', 'with', 'would', 'you', 'your',
    // Additional news-related stop words
    'news', 'article', 'articles', 'latest', 'today', 'yesterday', 'week', 'month', 'year'
  ]);

  // Extract words, filter by length and stop words, and return a limited number
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, maxWords)
    .join(' ');
}

// Export utility functions
export {
  formatDateSafe,
  debugLog,
  generateUniqueId,
  extractKeywords
};