let lastNewsData = null;
let chatHistory = [];
let currentUser = null;

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';
  // User info
  if (currentUser) {
    sidebar.innerHTML += `<div class="mb-4"><b>User:</b> ${currentUser.username} <span class="text-xs text-gray-500">(${currentUser.role})</span><br><b>Company:</b> ${currentUser.company || ''}</div>`;
    if (currentUser.whitelabel && currentUser.whitelabel.logo) {
      sidebar.innerHTML += `<img src="${currentUser.whitelabel.logo}" alt="logo" class="mb-4 w-32 h-auto">`;
    }
  }
  // Chat history
  sidebar.innerHTML += '<div class="mb-2 font-semibold">Chat History</div>';
  sidebar.innerHTML += '<div id="chat-history" class="mb-4 space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded p-2">' +
    chatHistory.map(h => `<div class="mb-1"><b>You:</b> ${h.input}<br><b>Grok:</b> ${h.response}</div>`).join('') + '</div>';
  // Chat input
  sidebar.innerHTML += `<textarea id="grok-input" class="w-full border rounded p-2 mb-2" rows="3" placeholder="Ask a question..."></textarea>`;
  sidebar.innerHTML += `<button id="grok-btn" class="px-4 py-2 bg-blue-600 text-white rounded mb-2 w-full">Ask</button>`;
  sidebar.innerHTML += `<div id="grok-response" class="mt-2 text-gray-700"></div>`;
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
    console.log('Fetching news with filter:', filter);
  }
  const res = await fetch(url);
  const data = await res.json();
  console.log('News API response:', data);
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
  }
}

async function askGrok() {
  const input = document.getElementById('grok-input').value;
  const responseDiv = document.getElementById('grok-response');
  responseDiv.textContent = 'Thinking...';
  console.log('--- GROK DEBUG START ---');
  console.log('User input:', input);
  try {
    const payload = { messages: [{ role: 'user', content: input }], model: 'grok-3-latest', stream: false, temperature: 0.7 };
    console.log('Request payload:', payload);
    const res = await fetch('http://localhost:3000/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Fetch response object:', res);
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Raw response text:', text);
    let data;
    try {
      data = JSON.parse(text);
      console.log('Parsed JSON:', data);
    } catch (jsonErr) {
      console.error('Failed to parse response as JSON:', jsonErr);
      responseDiv.textContent = 'Invalid JSON response from Grok.';
      console.log('--- GROK DEBUG END ---');
      return;
    }
    // Try to extract the machine-readable NewsAPI query from Grok's response
    let newsapiQuery = null;
    let explanation = '';
    try {
      // Try to parse the content as JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = content.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonString);
          newsapiQuery = parsed.newsapi_query;
          explanation = parsed.explanation || '';
        }
      }
    } catch (e) {
      console.error('Failed to extract newsapi_query from Grok response:', e);
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
      fetchNewsWithParams(params);
    } else {
      responseDiv.textContent = 'No machine-readable news query found. Full data: ' + JSON.stringify(data);
    }
    // After getting Grok response:
    chatHistory.push({ input, response: explanation || '...' });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    renderSidebar();
    console.log('--- GROK DEBUG END ---');
  } catch (e) {
    console.error('Error contacting Grok:', e);
    responseDiv.textContent = 'Error contacting Grok.';
    console.log('--- GROK DEBUG END ---');
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
async function fetchNewsWithParams(params) {
  let url = 'http://localhost:3000/news';
  const search = new URLSearchParams(params).toString();
  if (search) url += '?' + search;
  console.log('Fetching news with params:', params);
  const res = await fetch(url);
  const data = await res.json();
  console.log('News API response:', data);
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
  }
}

window.onload = async () => {
  // Sidebar layout (use CSS flex for true sidebar)
  document.body.innerHTML = `
    <div class="flex flex-row max-w-5xl mx-auto py-8">
      <aside id="sidebar" class="w-80 min-h-[80vh] bg-white rounded shadow p-4 mr-8 flex flex-col h-fit"></aside>
      <main class="flex-1">
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
        fetchNews();
      } catch (e) {
        document.getElementById('login-error').textContent = 'Login failed.';
      }
    };
    return;
  }
  fetchNews();
  renderSidebar();
  document.getElementById('sidebar').addEventListener('click', e => {
    if (e.target && e.target.id === 'grok-btn') askGrok();
  });
};
