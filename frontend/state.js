// State management module for news aggregator

// Main application state
const AppState = {
  isLoading: false,
  hasError: false,
  errorMessage: '',
  searchResults: [],
  chatHistory: [],
  currentUser: null,
  debug: (window.localStorage.getItem('debug') === 'true') || true, // default to true in dev
};

// Event listeners for state changes
const listeners = [];

/**
 * Subscribe to state changes
 * @param {Function} listener - Callback function to be called when state changes
 * @returns {Function} - Unsubscribe function
 */
function subscribe(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Notify all listeners of state changes
 */
function notifyListeners() {
  listeners.forEach(listener => listener(AppState));
}

/**
 * Set application loading state
 * @param {boolean} isLoading - Whether the application is loading
 */
function setLoading(isLoading) {
  AppState.isLoading = isLoading;
  notifyListeners();
}

/**
 * Set application error state
 * @param {boolean} hasError - Whether the application has an error
 * @param {string} errorMessage - Error message
 */
function setError(hasError, errorMessage = '') {
  AppState.hasError = hasError;
  AppState.errorMessage = errorMessage;
  notifyListeners();
}

/**
 * Add a search result card
 * @param {Object} card - Search result card object
 */
function addSearchResult(card) {
  // Ensure card has a unique ID
  const cardId = card.id || Date.now() + Math.floor(Math.random() * 1000);
  
  // Generate a title if none provided
  const cardTitle = card.title || 
    (card.originalQuery ? 
      (card.originalQuery.length > 40 ? card.originalQuery.slice(0, 40) + '...' : card.originalQuery) 
      : `Search #${AppState.searchResults.length + 1}`);
  
  // Create a timestamp if none provided
  const timestamp = card.timestamp || new Date().toISOString();
  
  // Create a complete card object
  const completeCard = {
    id: cardId,
    title: cardTitle,
    articles: Array.isArray(card.articles) ? card.articles : [],
    explanation: card.explanation || '',
    originalQuery: card.originalQuery || '',
    timestamp: timestamp
  };
  
  // Add to search results
  AppState.searchResults.push(completeCard);
  notifyListeners();
  
  return completeCard;
}

/**
 * Remove a search result card by index
 * @param {number} index - Index of the card to remove
 */
function removeSearchResult(index) {
  if (index >= 0 && index < AppState.searchResults.length) {
    AppState.searchResults.splice(index, 1);
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Pin a search result card to the top
 * @param {number} index - Index of the card to pin
 */
function pinSearchResult(index) {
  if (index > 0 && index < AppState.searchResults.length) {
    const [card] = AppState.searchResults.splice(index, 1);
    AppState.searchResults.unshift(card);
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Add a chat message to history
 * @param {string} input - User input
 * @param {string} response - System response
 */
function addChatMessage(input, response) {
  AppState.chatHistory.push({ input, response });
  notifyListeners();
}

/**
 * Set current user
 * @param {Object|null} user - User object or null if not authenticated
 */
function setCurrentUser(user) {
  AppState.currentUser = user;
  notifyListeners();
}

/**
 * Reset application state
 */
function resetState() {
  AppState.isLoading = false;
  AppState.hasError = false;
  AppState.errorMessage = '';
  AppState.searchResults = [];
  AppState.chatHistory = [];
  AppState.currentUser = null;
  notifyListeners();
}

/**
 * Set debug mode
 * @param {boolean} enabled - Whether debug mode is enabled
 */
function setDebugMode(enabled) {
  AppState.debug = enabled;
  window.localStorage.setItem('debug', enabled ? 'true' : 'false');
  notifyListeners();
}

/**
 * Get the current state
 * @returns {Object} - Current application state
 */
function getState() {
  return { ...AppState };
}

/**
 * Update a search result card
 * @param {string} cardId - ID of the card to update
 * @param {Object} updates - Properties to update on the card
 */
function updateCard(cardId, updates) {
  AppState.searchResults = AppState.searchResults.map(card => 
    card.id === cardId ? { ...card, ...updates } : card
  );
  notifyListeners();
  if (AppState.debug) {
    console.debug(`[State] Updated card ${cardId}:`, updates);
  }
}

/**
 * Delete a search result card
 * @param {string} cardId - ID of the card to delete
 */
function deleteCard(cardId) {
  AppState.searchResults = AppState.searchResults.filter(card => card.id !== cardId);
  notifyListeners();
  if (AppState.debug) {
    console.debug(`[State] Deleted card ${cardId}`);
  }
}

// Export state management functions
export {
  AppState,
  subscribe,
  setLoading,
  setError,
  addSearchResult,
  removeSearchResult,
  pinSearchResult,
  addChatMessage,
  setCurrentUser,
  resetState,
  setDebugMode,
  getState,
  updateCard,
  deleteCard
};