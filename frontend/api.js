// API module for news aggregator

// Cache for news API calls
const newsCache = {
  data: new Map(),
  maxAge: 5 * 60 * 1000, // 5 minutes
  set: function(key, value) {
    this.data.set(key, {
      timestamp: Date.now(),
      value: value
    });
  },
  get: function(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  },
  clear: function() {
    this.data.clear();
  }
};

/**
 * Get authentication token
 * @returns {string|null} - Authentication token or null if not authenticated
 */
function getAuthToken() {
  return localStorage.getItem('token');
}

/**
 * Fetch data from the API
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - Response data
 * @throws {Error} - If the request fails
 */
async function fetchAPI(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': token } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} - User data
 */
async function login(username, password) {
  const response = await fetchAPI('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  localStorage.setItem('token', response.token);
  return response.user;
}

/**
 * Check authentication status
 * @returns {Promise<Object|null>} - User data or null if not authenticated
 */
async function checkAuth() {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  
  try {
    const data = await fetchAPI('http://localhost:3000/me', {
      method: 'POST'
    });
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch news articles with caching
 * @param {Object} params - Query parameters
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise<Object>} - News data
 */
async function fetchNews(params = {}, useCache = true) {
  const queryString = new URLSearchParams(params).toString();
  const cacheKey = `news_${queryString}`;
  
  // Try to get from cache first
  if (useCache) {
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // Fetch from API
  const data = await fetchAPI(`http://localhost:3000/news?${queryString}`);
  
  // Cache the results
  if (useCache) {
    newsCache.set(cacheKey, data);
  }
  
  return data;
}

/**
 * Send prompt to Grok API
 * @param {string} prompt - User prompt
 * @returns {Promise<Object>} - Grok response
 */
async function askGrok(prompt) {
  return fetchAPI('http://localhost:3000/grok', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });
}

// Export API functions
export {
  fetchAPI,
  login,
  checkAuth,
  fetchNews,
  askGrok,
  newsCache
};