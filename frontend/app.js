// Import Luxon and expose it globally for Tabulator
import * as luxon from 'luxon';

// Make sure Luxon is available in all the ways Tabulator might look for it
window.luxon = luxon;
window.DateTime = luxon.DateTime;

// Check if Tabulator module variable exists (for ES module version)
if (typeof TabulatorFull !== 'undefined') {
  // Set datetime formatter for Tabulator if using ES modules
  TabulatorFull.prototype.extendModule("format", "formatters", {
    datetime: function(cell, formatterParams) {
      // Implementation would be here
    }
  });
}

// Debug logging to help troubleshoot
if (AppState && AppState.debug) {
  console.debug('[app.js] Luxon setup complete:', { 
    luxonAvailable: !!window.luxon,
    dateTimeAvailable: !!window.DateTime,
    version: window.luxon?.VERSION || 'unknown' 
  });
}

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

/**
 * Utility function for formatting dates safely, with fallbacks
 * @param {string|Date} dateStr - The date string or object to format
 * @returns {string} Formatted date string or empty string if invalid
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

// Show loading/error states and track unique card rendering
function updateUIState() {
  if (!AppState.currentUser) {
    // Not authenticated, don't render news/cards
    return;
  }
  const newsDiv = document.getElementById('news');
  renderNewsViewToggle();
  if (!newsDiv) return;

  // Track rendered cards to prevent duplicates
  window.renderedCardIds = window.renderedCardIds || new Set();
  
  if (AppState.debug) {
    console.debug('[app.js] updateUIState called with', { 
      cards: AppState.searchResults?.length || 0,
      loading: AppState.isLoading,
      error: AppState.hasError
    });
  }

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

  if (newsViewMode === 'paginated') {
    renderNewsTablePaginated();
  } else {
    renderNewsCards();
  }
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

// --- News loading and rendering
async function renderNewsCard(result, idx, container) {
  try {
    // Track rendered cards to prevent duplicates
    window.renderedCardIds = window.renderedCardIds || new Set();
    
    // Ensure card has a unique ID
    const cardId = result.id || Date.now() + Math.floor(Math.random() * 1000);
    
    // Skip if we've already rendered this card (prevents duplicate cards)
    if (window.renderedCardIds.has(String(cardId))) {
      console.debug(`[renderNewsCard] Skipping duplicate card ID ${cardId}`);
      return;
    }
    window.renderedCardIds.add(String(cardId));
    
    // Debug logging
    if (AppState.debug) {
      console.debug('[renderNewsCard]', { 
        cardId, 
        title: result.title, 
        articles: result.articles?.length || 0,
        timestamp: result.timestamp || new Date().toISOString()
      });
    }
    
    // Card container with proper spacing for pagination
    const card = document.createElement('div');
    card.className = 'bg-white rounded shadow p-2 mb-4'; // Increased bottom margin
    card.style.position = 'relative';
    card.style.fontSize = '0.92em';
    card.style.marginBottom = '3rem'; // Extra margin for pagination controls
    
    // Set data attributes for tracking and debugging
    card.dataset.cardId = cardId;
    card.dataset.cardIndex = idx;
    card.dataset.cardTimestamp = result.timestamp || new Date().toISOString();

    // Card header with a more descriptive title and creation time
    const cardTimestamp = result.timestamp ? 
      new Date(result.timestamp).toLocaleTimeString() : 
      new Date().toLocaleTimeString();
    const cardTitle = result.title || `Search #${idx + 1}`;
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <div class="font-semibold text-xs">
          ${cardTitle}
          <span class="text-gray-400 text-xs ml-1">(${cardTimestamp})</span>
        </div>
        <div class="flex gap-1">
          <button class="text-xs text-blue-600 hover:underline" data-pin="${idx}">Pin</button>
          <button class="text-xs text-red-600 hover:underline" data-remove="${idx}">Remove</button>
        </div>
      </div>`;

    // Explanation (if any)
    if (result.explanation || result.summary) {
      const explanation = result.explanation || result.summary;
      card.innerHTML += `<div class="mb-1 text-gray-700 text-xs">${explanation}</div>`;
    }

    // Tabulator container
    const tableDiv = document.createElement('div');
    tableDiv.style.height = '300px'; // Further increased height for pagination
    // Add extra bottom margin and padding to card for pagination controls
    card.style.marginBottom = '3rem';
    card.style.paddingBottom = '1rem';
    tableDiv.className = 'tabulator-table w-full';
    // Add a debug data attribute to help troubleshoot card issues
    tableDiv.dataset.cardId = result.id;
    tableDiv.dataset.cardTitle = result.title;
    tableDiv.dataset.cardTimestamp = result.timestamp || new Date().toISOString();
    card.appendChild(tableDiv);

    // Make sure we have articles and they're in an array
    const articles = Array.isArray(result.articles) ? result.articles : [];
    
    if (articles.length === 0) {
      tableDiv.innerHTML = '<div class="p-2 text-gray-500">No articles found</div>';
      container.appendChild(card);
      return;
    }

    // Tabulator columns - adapt based on the article structure
    const columns = [
      { 
        title: 'Title', 
        field: 'title', 
        widthGrow: 2, 
        formatter: (cell) => {
          const data = cell.getRow().getData();
          const url = data.url || '#';
          return `<a href="${url}" target="_blank" class="text-blue-700 hover:underline">${cell.getValue()}</a>`;
        }
      },
      { 
        title: 'Source', 
        field: 'source', 
        widthGrow: 1,
        formatter: (cell) => {
          const value = cell.getValue();
          // Handle both string sources and object sources
          return typeof value === 'object' && value?.name ? value.name : value;
        }
      },
      { 
        title: 'Published', 
        field: 'date', 
        widthGrow: 1, 
        formatter: "luxonDatetime",  // Use our custom formatter
        formatterParams: {
          inputFormat: "iso",
          outputFormat: "dd MMM yyyy HH:mm",
          invalidPlaceholder: "(unknown)"
        },
        accessorFunc: (row) => {
          // Try to get date from either date field or publishedAt
          return row.date || row.publishedAt || "";
        }
      },
      { 
        title: 'Description', 
        field: 'summary', 
        widthGrow: 3,
        formatter: (cell) => {
          // Try to get description from either summary or description field
          const row = cell.getRow().getData();
          return cell.getValue() || row.description || '';
        }
      }
    ];

    // Initialize Tabulator with the article data
    try {
      if (AppState.debug) {
        console.debug(`[renderNewsCard] Initializing Tabulator for card ${result.id || idx} with ${articles.length} articles`);
      }
      
      new Tabulator(tableDiv, {
        data: articles,
        columns: columns,
        layout: 'fitColumns',
        height: 250, // Increased height for better pagination visibility
        minHeight: 200,
        responsiveLayout: 'collapse', // Better mobile support
        pagination: 'local', // Enable pagination for all tables
        paginationSize: 5, // Default page size
        paginationSizeSelector: [5, 10, 20], // Let users choose page size
        movableColumns: true, // Better user experience
        tooltips: true, // More accessible
        placeholder: 'No articles available', // Friendlier message
        footerElement: `<div class="tabulator-footer-label">Card ID: ${result.id || idx}</div>`,
      });
      
      // Add an observer to ensure pagination controls are visible
      if (window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) {
              // If pagination is hidden, add more space
              card.style.marginBottom = '4rem';
              card.style.paddingBottom = '2rem';
            }
          });
        }, { threshold: 0.9 });
        
        // Observe pagination controls after a delay to ensure they're rendered
        setTimeout(() => {
          const paginationControls = tableDiv.querySelector('.tabulator-footer');
          if (paginationControls) {
            observer.observe(paginationControls);
          }
        }, 300);
      }
    } catch (err) {
      console.error('[renderNewsCard] Tabulator initialization failed:', err);
      showErrorNotification('Failed to load news table: ' + err.message);
      tableDiv.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 px-2 py-2 rounded"><p class="font-bold">Failed to load news table</p><p>${err.message}</p></div>`;
    }

    container.appendChild(card);
  } catch (err) {
    console.error('[renderNewsCard Error]', err);
    container.innerHTML += `<div class="bg-red-50 border border-red-200 text-red-700 px-2 py-2 rounded mb-2"><p class="font-bold">Error rendering news card</p><p>${err.message}</p></div>`;
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

    // Reset card tracking for a fresh render
    window.renderedCardIds = new Set();
    
    // Check for potentially duplicate cards in AppState
    if (AppState.debug) {
      const cardIds = AppState.searchResults.map(card => card.id);
      const uniqueCardIds = [...new Set(cardIds)];
      if (cardIds.length !== uniqueCardIds.length) {
        console.warn('[renderNewsCards] Potential duplicate card IDs detected in AppState', 
          { total: cardIds.length, unique: uniqueCardIds.length });
      }
    }
    
    // Render each card with tracking
    let renderedCount = 0;
    for (let i = 0; i < AppState.searchResults.length; i++) {
      const card = AppState.searchResults[i];
      if (!card) {
        console.warn(`[renderNewsCards] Invalid card at index ${i}`);
        continue;
      }
      
      // Skip cards with no articles or empty title
      if (!card.articles || !Array.isArray(card.articles) || card.articles.length === 0) {
        if (AppState.debug) {
          console.debug(`[renderNewsCards] Skipping card at index ${i} with no articles`);
        }
        continue;
      }
      
      // Add index reference to card for tracking
      card._index = i;
      
      await renderNewsCard(card, i, newsDiv);
      renderedCount++;
    }
    
    if (AppState.debug) {
      console.debug(`[renderNewsCards] Rendered ${renderedCount} cards out of ${AppState.searchResults.length} total`);
    }

    // Add event listeners for pin/remove buttons
    attachCardEventListeners(newsDiv);
  } catch (err) {
    console.error('[renderNewsCards Error]', err);
    showErrorNotification('Error rendering news cards: ' + err.message);
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

// Add event listeners for pin/remove buttons in news cards
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
        showErrorNotification('Failed to remove card. Please try again.');
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
        showErrorNotification('Failed to pin card. Please try again.');
        console.error('[Pin Card Error]', err);
        alert('Failed to pin card. Please try again.');
      }
    };
  });
}

// Server-side pagination Tabulator integration
async function renderNewsTablePaginated() {
  const newsDiv = document.getElementById('news');
  newsDiv.innerHTML = '';
  // Create table container
  const tableDiv = document.createElement('div');
  tableDiv.id = 'news-table';
  tableDiv.className = 'tabulator-table w-full';
  newsDiv.appendChild(tableDiv);

  // Tabulator columns
  const columns = [
    { title: 'Title', field: 'title', widthGrow: 2, formatter: (cell) => `<a href="${cell.getRow().getData().url}" target="_blank" class="text-blue-700 hover:underline">${cell.getValue()}</a>` },
    { title: 'Source', field: 'source.name', widthGrow: 1 },
    { 
      title: 'Published', 
      field: 'publishedAt', 
      widthGrow: 1, 
      formatter: "luxonDatetime",  // Use our custom formatter
      formatterParams: {
        inputFormat: "iso",
        outputFormat: "dd MMM yyyy HH:mm",
        invalidPlaceholder: "(unknown)"
      }
    },
    { title: 'Description', field: 'description', widthGrow: 3 }
  ];

  // DaisyUI/Tailwind styling for pagination controls
  function styleTabulatorPagination() {
    setTimeout(() => {
      document.querySelectorAll('.tabulator-paginator button').forEach(btn => {
        btn.classList.add('btn', 'btn-xs', 'btn-outline', 'mx-1');
      });
      document.querySelectorAll('.tabulator-paginator label').forEach(lbl => {
        lbl.classList.add('text-xs', 'mx-1');
      });
      document.querySelectorAll('.tabulator-paginator input').forEach(inp => {
        inp.classList.add('input', 'input-xs', 'input-bordered', 'w-16', 'mx-1');
      });
    }, 100);
  }

  // Initialize Tabulator with remote pagination
  try {
    const table = new Tabulator(tableDiv, {
      ajaxURL: 'http://localhost:3000/news',
      ajaxParams: {}, // Add search/filter params if needed
      ajaxConfig: 'GET',
      pagination: 'remote',
      paginationSize: 10,
      paginationDataSent: {
        page: 'page',
        size: 'pageSize',
      },
      paginationDataReceived: {
        last_page: 'last_page',
        data: 'data',
        total_count: 'total_count',
      },
      columns: columns,
      layout: 'fitColumns',
      height: 400,
      responsiveLayout: true,
      ajaxResponse: function(url, params, response) {
        // response: { data, last_page, total_count }
        styleTabulatorPagination();
        return response.data;
      },
      renderComplete: styleTabulatorPagination
    });
    styleTabulatorPagination();
  } catch (err) {
    showErrorNotification('Failed to load news table: ' + err.message);
    tableDiv.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-700 px-2 py-2 rounded"><p class="font-bold">Failed to load news table</p><p>${err.message}</p></div>`;
  }
}

// Call this instead of renderNewsCards for paginated table
// renderNewsTablePaginated();

// --- Debug mode toggle ---
function setDebugMode(on) {
  window.localStorage.setItem('debug', on ? 'true' : 'false');
  window.location.reload();
}

// Patch all console.log/debug output:
function debugLog(...args) {
  if (AppState.debug) console.log('[DEBUG]', ...args);
}

let sidebarMinimized = false;

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  // Minimize/expand button always visible
  sidebar.innerHTML += `<button id="sidebar-min-btn" class="absolute top-2 right-2 text-xs text-gray-400 hover:text-blue-600 z-10" title="${sidebarMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'}" style="background:none;border:none;">${sidebarMinimized ? '▶' : '◀'}</button>`;
  if (sidebarMinimized) {
    sidebar.style.width = '32px';
    sidebar.style.minWidth = '32px';
    sidebar.style.maxWidth = '32px';
    sidebar.style.padding = '0.5rem 0.2rem';
    sidebar.innerHTML = `<button id=\"sidebar-min-btn\" class=\"absolute top-2 right-2 text-xs text-gray-400 hover:text-blue-600 z-10\" title=\"Expand Sidebar\" style=\"background:none;border:none;\">▶</button>`;
    document.getElementById('sidebar-min-btn').onclick = () => { sidebarMinimized = false; renderSidebar(); };
    return;
  } else {
    sidebar.style.width = '180px';
    sidebar.style.minWidth = '120px';
    sidebar.style.maxWidth = '400px';
    sidebar.style.padding = '0.7rem 0.5rem';
  }
  // User info (minimal, no icon/company, smaller font)
  if (AppState.currentUser) {
    sidebar.innerHTML += `<div class="mb-1" style="font-size: 0.8em;"><b>User:</b> ${AppState.currentUser.username} <span class="text-xs text-gray-500">(${AppState.currentUser.role})</span></div>`;
  }
  // Debug toggle
  sidebar.innerHTML += `<div class="mb-1 text-xs"><label><input type="checkbox" id="debug-toggle" ${AppState.debug ? 'checked' : ''}/> Debug Mode</label></div>`;
  // Chat history
  sidebar.innerHTML += '<div class="mb-1 font-semibold text-xs">Chat History</div>';
  sidebar.innerHTML += '<div id="chat-history" class="mb-2 space-y-1 max-h-48 overflow-y-auto bg-gray-50 rounded p-1" style="font-size:0.8em;">' +
    AppState.chatHistory.map(h => `<div class="mb-1"><b>You:</b> ${h.input}<br><b>Grok:</b> ${h.response}</div>`).join('') + '</div>';
  // Chat input
  sidebar.innerHTML += `<textarea id="grok-input" class="w-full border rounded p-1 mb-1 text-xs" rows="2" placeholder="Ask a question or request a new card..."></textarea>`;
  sidebar.innerHTML += `<button id="grok-btn" class="px-2 py-1 bg-blue-600 text-white rounded mb-1 w-full text-xs">Ask</button>`;
  sidebar.innerHTML += `<div id="grok-response" class="mt-1 text-gray-700 text-xs"></div>`;
  // Guidance for card creation
  sidebar.innerHTML += `<div class="mt-2 text-xs text-gray-700">Type your request. To create a new card, just ask a new question or say 'new card about ...'. To update, reference an existing card or topic. The system will confirm new cards automatically.</div>`;
  document.getElementById('sidebar-min-btn').onclick = () => {
    sidebarMinimized = !sidebarMinimized;
    renderSidebar();
  };
  // Add this: wire up Ask button
  const grokBtn = document.getElementById('grok-btn');
  if (grokBtn) {
    grokBtn.onclick = async () => {
      await askGrok();
    };
  }
}

// Authentication check
async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    AppState.currentUser = null;
    return false;
  }
  try {
    const res = await fetch('http://localhost:3000/me', {
      method: 'POST',
      headers: { 'Authorization': token }
    });
    if (!res.ok) {
      AppState.currentUser = null;
      return false;
    }
    const data = await res.json();
    AppState.currentUser = data;
    return true;
  } catch {
    AppState.currentUser = null;
    return false;
  }
}

function renderLoginSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `<div class="mb-4 font-bold text-lg">Login</div>
    <input id="login-username" class="w-full border rounded p-2 mb-2" placeholder="Username" value="test_user">
    <input id="login-password" class="w-full border rounded p-2 mb-2" placeholder="Password" type="password" value="notasecret"> <!-- notasecret is a demo value, not a real secret -->
    <button id="login-btn" class="px-4 py-2 bg-blue-600 text-white rounded mb-2 w-full">Login</button>
    <div id="login-error" class="text-red-600 mt-2"></div>`;
  document.getElementById('login-btn').onclick = async () => {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      AppState.currentUser = data.user;
      renderSidebar();
      updateUIState();
    } catch (e) {
      showErrorNotification('Login failed.');
      document.getElementById('login-error').textContent = 'Login failed.';
    }
  };
}

window.onload = async () => {
  if (!(await checkAuth())) {
    renderLoginSidebar();
    // Optionally, clear main content
    document.getElementById('news').innerHTML = '';
    return;
  }
  renderSidebar();
  updateUIState();
};

// --- News view mode toggle ---
let newsViewMode = localStorage.getItem('newsViewMode') || 'cards'; // 'cards' or 'paginated'

function setNewsViewMode(mode) {
  newsViewMode = mode;
  localStorage.setItem('newsViewMode', mode);
  updateUIState();
}

function renderNewsViewToggle() {
  const toggleDiv = document.getElementById('news-view-toggle');
  if (!toggleDiv) return;
  toggleDiv.innerHTML = `
    <div class="flex gap-2 items-center mb-2">
      <span class="text-xs">View:</span>
      <button class="btn btn-xs ${newsViewMode === 'cards' ? 'btn-primary' : 'btn-outline'}" onclick="setNewsViewMode('cards')">Cards</button>
      <button class="btn btn-xs ${newsViewMode === 'paginated' ? 'btn-primary' : 'btn-outline'}" onclick="setNewsViewMode('paginated')">Paginated Table</button>
    </div>
  `;
}

// After Grok/LLM response, check if a new card was created and show confirmation
async function askGrok() {
  const inputElem = document.getElementById('grok-input');
  const responseElem = document.getElementById('grok-response');
  const prompt = inputElem.value.trim();
  if (!prompt) {
    responseElem.textContent = 'Please enter a question.';
    return;
  }
  responseElem.textContent = 'Thinking...';
  inputElem.disabled = true;
  const prevCardCount = AppState.searchResults.length;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/grok', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Grok request failed');
    const data = await res.json();
    // Assume response: { response: string, newsResults?: [...] }
    AppState.chatHistory.push({ input: prompt, response: data.response });
    if (data.newsResults && Array.isArray(data.newsResults)) {
      // --- FIX: Always create a full card object with id, title, etc. ---
      const cardId = Date.now() + Math.floor(Math.random() * 1000);
      const cardTitle = prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt;
      AppState.searchResults.push({
        id: cardId,
        title: cardTitle,
        articles: data.newsResults,
        explanation: data.response,
        originalQuery: prompt,
        timestamp: new Date().toISOString()
      });
      updateUIState();
    }
    renderSidebar();
    responseElem.textContent = '';
    inputElem.value = '';
    // Show confirmation if new card created
    setTimeout(() => {
      if (AppState.searchResults.length > prevCardCount) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebarMinimized) {
          const msg = document.createElement('div');
          msg.className = 'mt-2 text-green-700 text-xs';
          msg.textContent = '✅ New card created.';
          sidebar.appendChild(msg);
          setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 3000);
        }
      }
    }, 1000);
  } catch (err) {
    showErrorNotification('Error: ' + err.message);
    responseElem.textContent = 'Error: ' + err.message;
  } finally {
    inputElem.disabled = false;
  }
}

// Show error notification using DaisyUI alert
function showErrorNotification(message) {
  let alert = document.createElement('div');
  alert.className = 'alert alert-error shadow-lg fixed top-4 right-4 z-50 w-96';
  alert.innerHTML = `<span>${message}</span><button class="btn btn-sm btn-ghost ml-auto" onclick="this.parentNode.remove()">✕</button>`;
  document.body.appendChild(alert);
  setTimeout(() => { if (alert.parentNode) alert.parentNode.remove(); }, 6000);
}

// Enable server-side pagination in Tabulator (main app.js)
// This is a stub for future implementation; backend already supports page/pageSize
// Example usage:
// new Tabulator('#news-table', {
//   ajaxURL: '/news',
//   ajaxParams: { ... },
//   pagination: 'remote',
//   paginationSize: 10,
//   ...
// });