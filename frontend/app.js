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

// --- News loading and rendering
async function renderNewsCard(result, idx, container) {
  try {
    // Card container
    const card = document.createElement('div');
    card.className = 'bg-white rounded shadow p-2 mb-2';
    card.style.position = 'relative';
    card.style.fontSize = '0.92em';

    // Card header
    card.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <div class="font-semibold text-xs">Search #${idx + 1}</div>
        <div class="flex gap-1">
          <button class="text-xs text-blue-600 hover:underline" data-pin="${idx}">Pin</button>
          <button class="text-xs text-red-600 hover:underline" data-remove="${idx}">Remove</button>
        </div>
      </div>`;

    // Explanation (if any)
    if (result.explanation) {
      card.innerHTML += `<div class="mb-1 text-gray-700 text-xs">${result.explanation}</div>`;
    }

    // Tabulator container
    const tableDiv = document.createElement('div');
    tableDiv.style.height = '220px';
    tableDiv.className = 'tabulator-table w-full';
    card.appendChild(tableDiv);

    // Tabulator columns
    const columns = [
      { title: 'Title', field: 'title', widthGrow: 2, formatter: (cell) => `<a href="${cell.getRow().getData().url}" target="_blank" class="text-blue-700 hover:underline">${cell.getValue()}</a>` },
      { title: 'Source', field: 'source.name', widthGrow: 1 },
      { title: 'Published', field: 'publishedAt', widthGrow: 1, formatter: (cell) => cell.getValue() ? new Date(cell.getValue()).toLocaleString() : '' },
      { title: 'Description', field: 'description', widthGrow: 3 }
    ];

    // Initialize Tabulator
    try {
      new Tabulator(tableDiv, {
        data: result.articles,
        columns: columns,
        layout: 'fitColumns',
        height: 200,
        responsiveLayout: true,
      });
    } catch (err) {
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
      AppState.searchResults.push({ articles: data.newsResults, explanation: data.response });
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
    responseElem.textContent = 'Error: ' + err.message;
  } finally {
    inputElem.disabled = false;
  }
}