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
    card.className = 'bg-white rounded shadow p-2 mb-2 flex flex-col';
    card.style.position = 'relative';
    card.style.fontSize = '0.92em';
    card.style.overflow = 'visible';

    // Card header with rename, save, and expand/collapse actions
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <div class="font-semibold text-xs" id="card-title-${idx}">${result.title || `Search #${idx + 1}`}</div>
        <div class="flex gap-1">
          <button class="text-xs text-gray-500 hover:text-blue-600" data-toggle="${idx}" title="Expand/collapse grid">${result.expandedGrid ? '▴' : '▾'}</button>
          <button class="text-xs text-blue-600 hover:underline" data-rename="${idx}" title="Rename">✏️</button>
          <button class="text-xs text-green-600 hover:underline" data-save="${idx}" title="Save">💾</button>
          <button class="text-xs text-purple-600 hover:underline" data-refine="${idx}" title="Refine">🔍</button>
          <button class="text-xs text-blue-600 hover:underline" data-pin="${idx}">Pin</button>
          <button class="text-xs text-red-600 hover:underline" data-remove="${idx}">Remove</button>
        </div>
      </div>`;

    // Explanation (if any)
    if (result.explanation) {
      card.innerHTML += `<div class="mb-1 text-gray-700 text-xs">${result.explanation}</div>`;
    }

    // ag-Grid container
    const gridDiv = document.createElement('div');
    gridDiv.style.height = result.expandedGrid ? 'auto' : '220px';
    gridDiv.style.minHeight = '80px';
    gridDiv.style.overflow = 'visible';
    gridDiv.className = 'ag-theme-alpine w-full tight-grid';
    card.appendChild(gridDiv);

    // ag-Grid columns
    const columnDefs = [
      { headerName: 'Title', field: 'title', flex: 3, minWidth: 120, sortable: true, filter: true, cellRenderer: params => `<a href=\"${params.data.url}\" target=\"_blank\" class=\"text-blue-700 hover:underline\">${params.value}</a>` },
      { headerName: 'Source', field: 'source.name', flex: 1, minWidth: 60, sortable: true, filter: true },
      { headerName: 'Published', field: 'publishedAt', flex: 0.7, minWidth: 80, maxWidth: 110, sortable: true, filter: 'agDateColumnFilter', valueFormatter: p => {
        if (!p.value) return '';
        const d = new Date(p.value);
        // Format: 'Jun 8, 14:23'
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      } },
      { headerName: 'Description', field: 'description', flex: 4, minWidth: 140, sortable: false, filter: true }
    ];

    // Initialize ag-Grid
    try {
      if (gridDiv.__agGridInstance) {
        gridDiv.__agGridInstance.destroy();
        gridDiv.innerHTML = '';
      }
      const rowData = Array.isArray(result.articles) ? result.articles : [];
      const gridOptions = {
        columnDefs,
        rowData,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: false,
        defaultColDef: { resizable: true, filter: true, sortable: true, cellStyle: { fontSize: '11px', padding: '2px 4px' } },
        getRowStyle: () => ({ fontSize: '11px', padding: '2px 4px', lineHeight: '1.2' }),
        headerHeight: 26,
        rowHeight: 22,
        pagination: !result.expandedGrid,
        paginationPageSize: 8,
        onGridReady: params => {
          params.api.sizeColumnsToFit();
          setTimeout(() => { card.style.width = gridDiv.offsetWidth + 'px'; }, 0);
        }
      };
      const agGridGlobal = window.agGrid || window.agGridCommunity || agGrid;
      gridDiv.__agGridInstance = agGridGlobal.createGrid(gridDiv, gridOptions);
      gridDiv.querySelectorAll('.ag-root, .ag-header-cell, .ag-cell').forEach(el => {
        el.style.fontSize = '11px';
        el.style.padding = '2px 4px';
        el.style.lineHeight = '1.2';
      });
    } catch (err) {
      gridDiv.innerHTML = `<div class=\"bg-red-50 border border-red-200 text-red-700 px-2 py-2 rounded\"><p class=\"font-bold\">Failed to load news grid</p><p>${err.message}</p></div>`;
    }

    // Card search attributes (low profile, small text at bottom)
    const attrDiv = document.createElement('div');
    attrDiv.className = 'mt-1 text-[10px] text-gray-400 flex flex-wrap gap-2';
    const params = result.params || {};
    attrDiv.innerHTML = Object.entries(params).map(([k, v]) => v ? `<span><b>${k}:</b> ${v}</span>` : '').join(' ');
    card.appendChild(attrDiv);

    // Action handlers (rename, save, refine, toggle)
    setTimeout(() => {
      // Rename
      const renameBtn = card.querySelector(`[data-rename='${idx}']`);
      if (renameBtn) {
        renameBtn.onclick = () => {
          const titleDiv = card.querySelector(`#card-title-${idx}`);
          const current = titleDiv.textContent;
          const input = document.createElement('input');
          input.type = 'text';
          input.value = current;
          input.className = 'border rounded px-1 text-xs';
          input.onkeydown = e => {
            if (e.key === 'Enter') {
              result.title = input.value;
              titleDiv.textContent = input.value;
            }
          };
          input.onblur = () => {
            result.title = input.value;
            titleDiv.textContent = input.value;
          };
          titleDiv.textContent = '';
          titleDiv.appendChild(input);
          input.focus();
        };
      }
      // Save
      const saveBtn = card.querySelector(`[data-save='${idx}']`);
      if (saveBtn) {
        saveBtn.onclick = () => {
          let saved = JSON.parse(localStorage.getItem('savedCards') || '[]');
          saved = saved.filter(c => c.fetchedAt !== result.fetchedAt); // avoid dupes
          saved.unshift(result);
          localStorage.setItem('savedCards', JSON.stringify(saved));
          saveBtn.textContent = '✅';
          setTimeout(() => { saveBtn.textContent = '💾'; }, 1200);
        };
      }
      // Refine
      const refineBtn = card.querySelector(`[data-refine='${idx}']`);
      if (refineBtn) {
        refineBtn.onclick = () => {
          // Pre-fill sidebar input with current params for user to edit
          const sidebarInput = document.getElementById('grok-input');
          sidebarInput.value = `Refine card: ${result.title || `Search #${idx + 1}`}. Current search: ${JSON.stringify(params)}`;
          sidebarInput.focus();
        };
      }
      // Toggle expand/collapse
      const toggleBtn = card.querySelector(`[data-toggle='${idx}']`);
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          result.expandedGrid = !result.expandedGrid;
          renderNewsCards();
        };
      }
    }, 0);

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
  if (!token) return false;
  try {
    const res = await fetch('http://localhost:3000/me', {
      method: 'POST',
      headers: { 'Authorization': token }
    });
    if (!res.ok) return false;
    const data = await res.json();
    AppState.currentUser = data;
    return true;
  } catch {
    return false;
  }
}

function renderLoginSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `<div class="mb-4 font-bold text-lg">Login</div>
    <input id="login-username" class="w-full border rounded p-2 mb-2" placeholder="Username" value="test_user">
    <input id="login-password" class="w-full border rounded p-2 mb-2" placeholder="Password" type="password" value="testpass">
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

// After Grok/LLM response, check if a new card was created and show confirmation
async function askGrok() {
  const input = document.getElementById('grok-input').value.trim();
  const responseDiv = document.getElementById('grok-response');
  if (!input) {
    responseDiv.textContent = 'Please enter a question.';
    return;
  }
  AppState.isLoading = true;
  updateUIState();
  responseDiv.textContent = '';
  const prevCardCount = AppState.searchResults.length;
  try {
    // Call backend LLM (Grok) endpoint
    const res = await fetch('http://localhost:3000/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') || '' },
      body: JSON.stringify({ prompt: input })
    });
    if (!res.ok) throw new Error('Grok API error');
    const data = await res.json();
    let explanation = '';
    let newsapiQuery = null;
    // --- PATCH: Handle Grok returning JSON as a string in choices[0].message.content ---
    if (data.choices && data.choices[0]?.message?.content) {
      try {
        const parsed = JSON.parse(data.choices[0].message.content);
        explanation = parsed.explanation || '';
        newsapiQuery = parsed.newsapi_query || parsed.query || null;
      } catch (err) {
        debugLog('Failed to parse Grok content as JSON:', err, data.choices[0].message.content);
        explanation = data.choices[0].message.content || '';
      }
    } else {
      // fallback to old structure
      explanation = data.explanation || '';
      newsapiQuery = data.newsapi_query || data.query || null;
      if (!newsapiQuery && data && typeof data === 'object') {
        for (const k of Object.keys(data)) {
          if (k.toLowerCase().includes('query')) newsapiQuery = data[k];
        }
      }
    }
    if (newsapiQuery) {
      const params = typeof newsapiQuery === 'string' ? { q: newsapiQuery } : newsapiQuery;
      await fetchNewsWithParams(params, explanation);
      responseDiv.textContent = explanation || 'Showing filtered news...';
    } else {
      responseDiv.textContent = 'No machine-readable news query found.';
    }
    AppState.chatHistory.push({ input, response: explanation || '...' });
    localStorage.setItem('chatHistory', JSON.stringify(AppState.chatHistory));
    renderSidebar();
  } catch (e) {
    responseDiv.textContent = 'Error contacting Grok.';
    debugLog('Grok error:', e);
  } finally {
    AppState.isLoading = false;
    updateUIState();
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
  }
}

// Fetch news from backend and update state
async function fetchNewsWithParams(params, explanation = '') {
  AppState.isLoading = true;
  AppState.hasError = false;
  AppState.errorMessage = '';
  updateUIState();
  lastOperation = async () => fetchNewsWithParams(params, explanation);
  try {
    // Build query string
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`http://localhost:3000/news?${query}`, {
      headers: { 'Authorization': localStorage.getItem('token') || '' }
    });
    if (!res.ok) throw new Error('Failed to fetch news');
    const data = await res.json();
    // Attach explanation to result for card display
    const card = {
      articles: data.articles || [],
      explanation: explanation || '',
      params: params,
      fetchedAt: new Date().toISOString()
    };
    AppState.searchResults.unshift(card);
    // Limit to last 10 cards
    if (AppState.searchResults.length > 10) AppState.searchResults.length = 10;
    AppState.isLoading = false;
    AppState.hasError = false;
    updateUIState();
  } catch (err) {
    AppState.isLoading = false;
    AppState.hasError = true;
    AppState.errorMessage = err.message || 'Unknown error fetching news';
    updateUIState();
    debugLog('fetchNewsWithParams error:', err);
  }
}