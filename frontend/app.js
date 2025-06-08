// Application state management
const AppState = {
  isLoading: false,
  hasError: false,
  errorMessage: '',
  searchResults: [],
  chatHistory: [],
  currentUser: null,
  debug: (window.localStorage.getItem('debug') === 'true') || true // default to true in dev
};

// Show loading/error states
function updateUIState() {
  const newsDiv = document.getElementById('news');
  if (!newsDiv) return;

  if (AppState.isLoading) {
    newsDiv.innerHTML = `
      <div class="flex items-center justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2">Loading news...</span>
      </div>`;
    return;
  }

  if (AppState.hasError) {
    newsDiv.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p class="font-bold">Error</p>
        <p>${AppState.errorMessage}</p>
        <button onclick="retryLastOperation()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>`;
    return;
  }

  if (AppState.searchResults.length === 0) {
    newsDiv.innerHTML = '<p class="text-gray-600">No news results yet.</p>';
    return;
  }

  renderNewsCards();
}

// Cache for news results
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
  }
};

// Retry mechanism
let lastOperation = null;
async function retryLastOperation() {
  if (!lastOperation) return;
  AppState.hasError = false;
  AppState.errorMessage = '';
  updateUIState();
  await lastOperation();
}

// Debug logging helper
function debugLog(...args) {
  if (AppState.debug) console.log('[DEBUG]', ...args);
}

let lastNewsData = null;
let chatHistory = [];
let currentUser = null;

// --- ag-Grid integration ---
// Ensure ag-Grid is loaded as a global before using
// News loading and rendering
async function renderNewsCard(result, idx, container) {
  try {
    // Card container
    const card = document.createElement('div');
    card.className = 'bg-white rounded shadow p-4 mb-6';
    card.style.position = 'relative';

    // Card header
    card.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="font-semibold text-lg">Search #${idx + 1}</div>
        <div class="flex gap-2">
          <button class="text-xs text-blue-600 hover:underline" data-pin="${idx}">Pin</button>
          <button class="text-xs text-red-600 hover:underline" data-remove="${idx}">Remove</button>
        </div>
      </div>`;

    // Explanation (if any)
    if (result.explanation) {
      card.innerHTML += `<div class="mb-2 text-gray-700 text-sm">${result.explanation}</div>`;
    }

    // ag-Grid container
    const gridDiv = document.createElement('div');
    gridDiv.style.height = '350px';
    gridDiv.className = 'ag-theme-alpine w-full';
    card.appendChild(gridDiv);

    // ag-Grid columns
    const columnDefs = [
      { 
        headerName: 'Title',
        field: 'title',
        flex: 2,
        sortable: true,
        filter: true,
        cellRenderer: params => `<a href="${params.data.url}" target="_blank" class="text-blue-700 hover:underline">${params.value}</a>`
      },
      { 
        headerName: 'Source',
        field: 'source.name',
        flex: 1,
        sortable: true,
        filter: true
      },
      { 
        headerName: 'Published',
        field: 'publishedAt',
        flex: 1,
        sortable: true,
        filter: 'agDateColumnFilter',
        valueFormatter: p => p.value ? new Date(p.value).toLocaleString() : ''
      },
      { 
        headerName: 'Description',
        field: 'description',
        flex: 3,
        sortable: false,
        filter: true
      }
    ];

    // Initialize ag-Grid
    try {
      await initializeAgGrid(gridDiv, columnDefs, result.articles);
    } catch (err) {
      gridDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p class="font-bold">Failed to load news grid</p>
          <p>${err.message}</p>
        </div>`;
    }

    container.appendChild(card);
  } catch (err) {
    console.error('[renderNewsCard Error]', err);
    container.innerHTML += `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        <p class="font-bold">Error rendering news card</p>
        <p>${err.message}</p>
      </div>`;
  }
}

async function renderNewsCards() {
  const newsDiv = document.getElementById('news');
  if (!newsDiv) return;

  try {
    newsDiv.innerHTML = '';

    if (AppState.isLoading) {
      newsDiv.innerHTML = `
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-2">Loading news...</span>
        </div>`;
      return;
    }

    if (AppState.hasError) {
      newsDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p class="font-bold">Error</p>
          <p>${AppState.errorMessage}</p>
          <button onclick="retryLastOperation()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>`;
      return;
    }

    if (AppState.searchResults.length === 0) {
      newsDiv.innerHTML = '<p class="text-gray-600">No news results yet.</p>';
      return;
    }

    // Render each card
    for (let i = 0; i < AppState.searchResults.length; i++) {
      await renderNewsCard(AppState.searchResults[i], i, newsDiv);
    }

    // Add event listeners for pin/remove buttons
    attachCardEventListeners(newsDiv);
  } catch (err) {
    console.error('[renderNewsCards Error]', err);
    newsDiv.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p class="font-bold">Error</p>
        <p>Failed to render news cards: ${err.message}</p>
        <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>`;
  }
}

function attachCardEventListeners(container) {
  // Remove card event
  container.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.onclick = e => {
      try {
        const idx = parseInt(btn.getAttribute('data-remove'));
        AppState.searchResults.splice(idx, 1);
        renderNewsCards();
        renderSidebar();
      } catch (err) {
        console.error('[Remove Card Error]', err);
        alert('Failed to remove card. Please try again.');
      }
    };
  });

  // Pin card event
  container.querySelectorAll('button[data-pin]').forEach(btn => {
    btn.onclick = e => {
      try {
        const idx = parseInt(btn.getAttribute('data-pin'));
        if (idx > 0) {
          const [card] = AppState.searchResults.splice(idx, 1);
          AppState.searchResults.unshift(card);
          renderNewsCards();
          renderSidebar();
        }
      } catch (err) {
        console.error('[Pin Card Error]', err);
        alert('Failed to pin card. Please try again.');
      }
    };
  });
}

// Store all search result sets for stacked cards
let searchResults = [];

// --- Debug mode toggle ---
const DEBUG = (window.localStorage.getItem('debug') === 'true') || true; // default to true in dev
function setDebugMode(on) {
  window.localStorage.setItem('debug', on ? 'true' : 'false');
  window.location.reload();
}

// Patch all console.log/debug output:
function debugLog(...args) {
  if (DEBUG) console.log('[DEBUG]', ...args);
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  // User info (minimal, no icon/company, smaller font)
  if (currentUser) {
    sidebar.innerHTML += `<div class="mb-2" style="font-size: 0.9em;"><b>User:</b> ${currentUser.username} <span class="text-xs text-gray-500">(${currentUser.role})</span></div>`;
  }
  // Debug toggle
  sidebar.innerHTML += `<div class="mb-2 text-xs"><label><input type="checkbox" id="debug-toggle" ${DEBUG ? 'checked' : ''}/> Debug Mode</label></div>`;
  // Chat history
  sidebar.innerHTML += '<div class="mb-2 font-semibold text-sm">Chat History</div>';
  sidebar.innerHTML += '<div id="chat-history" class="mb-4 space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded p-2">' +
    chatHistory.map(h => `<div class="mb-1" style="font-size:0.9em;"><b>You:</b> ${h.input}<br><b>Grok:</b> ${h.response}</div>`).join('') + '</div>';
  // Chat input
  sidebar.innerHTML += `<textarea id="grok-input" class="w-full border rounded p-2 mb-2" rows="3" placeholder="Ask a question..."></textarea>`;
  sidebar.innerHTML += `<button id="grok-btn" class="px-4 py-2 bg-blue-600 text-white rounded mb-2 w-full">Ask</button>`;
  sidebar.innerHTML += `<div id="grok-response" class="mt-2 text-gray-700"></div>`;
  // Card action suggestion
  if (AppState.searchResults.length > 0) {
    sidebar.innerHTML += `<div class="mt-4 text-xs text-gray-700">For each response, <b>create a new card</b> or <b>update an existing card</b>:</div>`;
    sidebar.innerHTML += `<div class="flex flex-col gap-2 mt-2">
      <button id="card-action-new" class="w-full px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Create New Card</button>
      <div class="flex items-center gap-1">
        <select id="card-select" class="flex-1 border rounded text-xs p-1">
          ${AppState.searchResults.map((r, i) => `<option value="${i}">Card #${i+1} (${r.explanation?.slice(0,30) || 'No desc'})</option>`).join('')}
        </select>
        <button id="card-action-update" class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Update</button>
      </div>
    </div>`;
  }
}

async function login(username, password) {
  const res = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  currentUser = data.user;
  renderSidebar();
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const res = await fetch('http://localhost:3000/me', {
    method: 'POST',
    headers: { 'Authorization': token }
  });
  if (!res.ok) return false;
  const data = await res.json();
  currentUser = data;
  renderSidebar();
  return true;
}

async function fetchNews(filter) {
  let url = 'http://localhost:3000/news';
  if (filter) {
    url += '?q=' + encodeURIComponent(filter);
    debugLog('Fetching news with filter:', filter);
  }
  console.log('[DEBUG] fetchNews url:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('[DEBUG] fetchNews response:', data);
  const newsDiv = document.getElementById('news');
  if (data.articles && data.articles.length > 0) {
    lastNewsData = data;
    newsDiv.innerHTML = '';
    data.articles.forEach(article => {
      const el = document.createElement('div');
      el.className = 'bg-white p-4 rounded shadow';
      el.innerHTML = `<a href="${article.url}" class="text-lg font-semibold text-blue-700 hover:underline" target="_blank">${article.title}</a><p class="text-gray-600 mt-1">${article.description || ''}</p>`;
      newsDiv.appendChild(el);
    });
  } else {
    if (lastNewsData && lastNewsData.articles && lastNewsData.articles.length > 0) {
      newsDiv.innerHTML = '<p class="text-red-600">No news found for this topic. Showing previous news.</p>';
      lastNewsData.articles.forEach(article => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded shadow';
        el.innerHTML = `<a href="${article.url}" class="text-lg font-semibold text-blue-700 hover:underline" target="_blank">${article.title}</a><p class="text-gray-600 mt-1">${article.description || ''}</p>`;
        newsDiv.appendChild(el);
      });
    } else {
      newsDiv.innerHTML = '<p class="text-red-600">Failed to load news.</p>';
    }
    console.warn('[DEBUG] No news found or failed to load news. Data:', data);
  }
}

async function askGrok() {
  const input = document.getElementById('grok-input').value;
  const responseDiv = document.getElementById('grok-response');
  responseDiv.textContent = 'Thinking...';
  debugLog('--- GROK DEBUG START ---');
  debugLog('User input:', input);
  try {
    const payload = { messages: [{ role: 'user', content: input }], model: 'grok-3-latest', stream: false, temperature: 0.7 };
    debugLog('Request payload:', payload);
    const res = await fetch('http://localhost:3000/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    debugLog('Fetch response object:', res);
    debugLog('Status:', res.status, res.statusText);
    const text = await res.text();
    debugLog('Raw response text:', text);
    let data;
    try {
      data = JSON.parse(text);
      debugLog('Parsed JSON:', data);
    } catch (jsonErr) {
      console.error('Failed to parse response as JSON:', jsonErr);
      responseDiv.textContent = 'Invalid JSON response from Grok.';
      debugLog('--- GROK DEBUG END ---');
      return;
    }
    // Try to extract the machine-readable NewsAPI query from Grok's response
    let newsapiQuery = null;
    let explanation = '';
    try {
      // Try to parse the content as JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        // Defensive: trim and parse only if it looks like JSON
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = content.substring(jsonStart, jsonEnd + 1);
          try {
            const parsed = JSON.parse(jsonString);
            newsapiQuery = parsed.newsapi_query;
            explanation = parsed.explanation || '';
          } catch (err) {
            debugLog('Failed to parse Grok content as JSON:', err, jsonString);
          }
        } else {
          debugLog('Grok content did not contain valid JSON:', content);
        }
      }
    } catch (e) {
      debugLog('Failed to extract newsapi_query from Grok response:', e);
    }
    if (newsapiQuery) {
      responseDiv.textContent = (explanation || 'Showing filtered news...') + '\n';
      // Only pass non-empty q to fetchNews
      const q = newsapiQuery.q && newsapiQuery.q.trim() ? newsapiQuery.q.trim() : null;
      const params = {};
      if (q) params.q = q;
      if (newsapiQuery.from && newsapiQuery.from.trim()) params.from = newsapiQuery.from.trim();
      if (newsapiQuery.to && newsapiQuery.to.trim()) params.to = newsapiQuery.to.trim();
      if (newsapiQuery.sources && newsapiQuery.sources.trim()) params.sources = newsapiQuery.sources.trim();
      // Show debug info in a collapsible section below the explanation
      let debugHtml = `<details style='margin-top:0.5em;'><summary style='cursor:pointer;'>Debug Info</summary><div style='font-size:0.9em;'>`;
      debugHtml += `<div><b>NewsAPI Request Params:</b> <pre>${JSON.stringify(params, null, 2)}</pre></div>`;
      debugHtml += `<div><b>Grok Response:</b> <pre>${JSON.stringify(newsapiQuery, null, 2)}</pre></div>`;
      debugHtml += `</div></details>`;
      responseDiv.innerHTML += debugHtml;
      // Use new stacked card grid
      fetchNewsWithParams(params, explanation, window.cardAction === 'update' ? window.cardUpdateIdx : null);
    } else {
      responseDiv.textContent = 'No machine-readable news query found. Full data: ' + JSON.stringify(data);
    }
    // After getting Grok response:
    chatHistory.push({ input, response: explanation || '...' });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    renderSidebar();
    debugLog('--- GROK DEBUG END ---');
  } catch (e) {
    console.error('Error contacting Grok:', e);
    responseDiv.textContent = 'Error contacting Grok.';
    debugLog('--- GROK DEBUG END ---');
  }
}

// Improved filter extraction: look for quoted phrases, or fallback to keywords
function extractNewsFilter(grokText) {
  // Try to find a quoted phrase (e.g., "school safety" or "budget updates")
  const phraseMatch = grokText.match(/"([^"]+)"/);
  if (phraseMatch) {
    return phraseMatch[1];
  }
  // Try to find a topic or school name in the response
  const match = grokText.match(/Schenectady|Niskayuna|school safety|school budget|STEM|after-school|diversity|test scores|extracurricular|mental health|facility|tax|community|parent|teacher|student|achievement|sports|arts|lab|enrollment|conference|policy|curriculum|funding|board|vote|event|workshop|initiative|project|collaborat|education|school/i);
  if (match) {
    return match[0];
  }
  return null;
}

// Helper to build query string and fetch news
async function fetchNewsWithParams(params, explanation = '', cardIndex = null) {
  const cacheKey = JSON.stringify(params);
  const cachedData = newsCache.get(cacheKey);
  if (cachedData) {
    console.log('[DEBUG] Using cached news data for:', params);
    processNewsData(cachedData, explanation, cardIndex);
    return;
  }

  lastOperation = () => fetchNewsWithParams(params, explanation, cardIndex);
  AppState.isLoading = true;
  updateUIState();

  try {
    const url = 'http://localhost:3000/news' + (new URLSearchParams(params).toString() ? '?' + new URLSearchParams(params).toString() : '');
    console.log('[DEBUG] Fetching news:', url, params);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log('[DEBUG] News API response:', data);

    if (!data.articles || data.articles.length === 0) {
      throw new Error('No articles found');
    }

    newsCache.set(cacheKey, data);
    processNewsData(data, explanation, cardIndex);
  } catch (error) {
    console.error('[ERROR] Failed to fetch news:', error);
    AppState.hasError = true;
    AppState.errorMessage = error.message || 'Failed to load news';
    updateUIState();
  } finally {
    AppState.isLoading = false;
    updateUIState();
  }
}

// Process news data and add to search results
function processNewsData(data, explanation = '', cardIndex = null) {
  try {
    const newsResult = {
      articles: data.articles,
      explanation: explanation,
      timestamp: Date.now()
    };

    if (cardIndex !== null && cardIndex < AppState.searchResults.length) {
      // Update existing card
      AppState.searchResults[cardIndex] = newsResult;
    } else {
      // Add new card
      AppState.searchResults.push(newsResult);
    }

    AppState.hasError = false;
    AppState.errorMessage = '';
    renderNewsCards();
  } catch (error) {
    console.error('[ERROR] Failed to process news data:', error);
    AppState.hasError = true;
    AppState.errorMessage = 'Failed to process news data';
    updateUIState();
  }
}

// ag-Grid initialization and error handling
function initializeAgGrid(gridDiv, columnDefs, rowData) {
  return new Promise((resolve, reject) => {
    try {
      // Check for modern ag-Grid API (v31+) or legacy API
      const hasModernAgGrid = window.agGrid && window.agGrid.createGrid;
      const hasLegacyAgGrid = window.agGrid && window.agGrid.Grid;
      
      if (!hasModernAgGrid && !hasLegacyAgGrid) {
        throw new Error('ag-Grid is not loaded');
      }

      const gridOptions = {
        columnDefs,
        rowData,
        defaultColDef: { resizable: true, filter: true },
        animateRows: true,
        groupDisplayType: 'multipleColumns',
        pagination: true,
        paginationPageSize: 10,
        onGridReady: () => {
          console.log('[DEBUG] ag-Grid ready');
          resolve(true);
        },
        onError: (err) => {
          console.error('[ag-Grid Error]', err);
          reject(err);
        }
      };

      // Use modern API if available, otherwise fall back to legacy
      if (hasModernAgGrid) {
        console.log('[DEBUG] Using modern ag-Grid API (createGrid)');
        window.agGrid.createGrid(gridDiv, gridOptions);
      } else {
        console.log('[DEBUG] Using legacy ag-Grid API (new Grid)');
        new window.agGrid.Grid(gridDiv, gridOptions);
      }
    } catch (err) {
      console.error('[ag-Grid Initialization Error]', err);
      reject(err);
    }
  });
}

// Enhanced waitForAgGrid with better error handling
function waitForAgGrid(callback, tries = 0) {
  // Check multiple possible ag-Grid global variables
  const hasAgGrid = (window.agGrid && (window.agGrid.Grid || window.agGrid.createGrid)) || 
                   window.agGrid || 
                   (typeof agGrid !== 'undefined');
  
  if (hasAgGrid) {
    try {
      console.log('[DEBUG] ag-Grid detected, initializing...');
      callback();
    } catch (err) {
      console.error('[waitForAgGrid Callback Error]', err);
      document.getElementById('news').innerHTML = `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p class="font-bold">Error</p>
          <p>${err.message}</p>
          <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Retry
          </button>
        </div>`;
    }
    return;
  }

  if (tries >= 20) {
    console.error('[ag-Grid Load Timeout]');
    console.log('[DEBUG] Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('ag')));
    document.getElementById('news').innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p class="font-bold">ag-Grid Failed to Load</p>
        <p>Please check your network connection and refresh the page.</p>
        <button onclick="window.location.reload()" class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Retry
        </button>
      </div>`;
    return;
  }

  console.log('[DEBUG] Waiting for ag-Grid, attempt:', tries + 1);
  setTimeout(() => waitForAgGrid(callback, tries + 1), 100);
}

// Add global error handlers for better diagnostics
window.onerror = function(message, source, lineno, colno, error) {
  console.error('[Global Error Handler]', { message, source, lineno, colno, error });
};
window.onunhandledrejection = function(event) {
  console.error('[Global Unhandled Promise Rejection]', event.reason);
};

// Replace window.onload with ag-Grid wait
window.onload = () => {
  waitForAgGrid(async () => {
    // Sidebar layout (use CSS flex for true sidebar)
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: row; max-width: 80vw; margin: 2rem auto; min-height: 80vh;">
        <aside id="sidebar" style="width: 320px; min-width: 240px; max-width: 400px; background: #fff; border-radius: 0.5rem; box-shadow: 0 2px 8px #0001; padding: 1.5rem; margin-right: 2rem; display: flex; flex-direction: column; height: fit-content;"></aside>
        <main style="flex: 1;">
          <h1 class="text-3xl font-bold mb-4 text-center">Schenectady News</h1>
          <div id="news" class="space-y-4"></div>
        </main>
      </div>
    `;
    // Restore chat history
    chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    // Show login form if not authenticated
    if (!(await checkAuth())) {
      document.getElementById('sidebar').innerHTML = `
        <div class="mb-4 font-bold text-lg">Login</div>
        <input id="login-username" class="w-full border rounded p-2 mb-2" placeholder="Username" value="test_user">
        <input id="login-password" class="w-full border rounded p-2 mb-2" placeholder="Password" type="password" value="testpass">
        <button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded mb-2 w-full">Login</button>
        <div id="login-error" class="text-red-600 mt-2"></div>
      `;
      document.getElementById('login-btn').onclick = async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
          await login(username, password);
          // After login, fetch top news and render
          await fetchNewsWithParams({ q: '', sortBy: 'publishedAt', language: 'en' }, 'Top News Headlines', null);
          renderNewsCards();
          renderSidebar();
        } catch (e) {
          const errDiv = document.getElementById('login-error');
          if (errDiv) {
            errDiv.textContent = 'Login failed.';
          } else {
            alert('Login failed.');
          }
        }
      };
      return;
    }
    // On default load, show a top news card (e.g., top headlines for US)
    if (AppState.searchResults.length === 0) {
      await fetchNewsWithParams({ q: '', sortBy: 'publishedAt', language: 'en' }, 'Top News Headlines', null);
    }
    renderNewsCards();
    renderSidebar();
    document.getElementById('sidebar').addEventListener('click', e => {
      if (e.target && e.target.id === 'grok-btn') askGrok();
      if (e.target && e.target.id === 'card-action-new') {
        window.cardAction = 'new';
        document.getElementById('grok-response').textContent = 'Next response will create a new card.';
      }
      if (e.target && e.target.id === 'card-action-update') {
        window.cardAction = 'update';
        window.cardUpdateIdx = parseInt(document.getElementById('card-select').value);
        document.getElementById('grok-response').textContent = `Next response will update Card #${window.cardUpdateIdx+1}.`;
      }
    });
    document.getElementById('sidebar').addEventListener('change', e => {
      if (e.target && e.target.id === 'debug-toggle') {
        setDebugMode(e.target.checked);
      }
    });
  });
};
