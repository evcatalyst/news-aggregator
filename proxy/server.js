import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

const users = [
  {
    username: 'superUser',
    password: 'superpass', // In production, use hashed passwords!
    role: 'super_user',
    company: null,
    whitelabel: null
  },
  {
    username: 'admin_user',
    password: 'adminpass',
    role: 'admin_user',
    company: 'Vandelay Industries',
    whitelabel: {
      logo: '/static/vandelay_logo.png',
      theme: 'default'
    }
  },
  {
    username: 'test_user',
    password: 'testpass',
    role: 'test_user',
    company: 'Vandelay Industries',
    whitelabel: {
      logo: '/static/vandelay_logo.png',
      theme: 'default'
    }
  }
];

const sessions = {};

app.use('/static', express.static('/app/static'));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  // Simple session token
  const token = Math.random().toString(36).slice(2) + Date.now();
  sessions[token] = { username: user.username, role: user.role, company: user.company, whitelabel: user.whitelabel };
  res.json({ token, user: { username: user.username, role: user.role, company: user.company, whitelabel: user.whitelabel } });
});

app.post('/me', (req, res) => {
  const token = req.headers['authorization'];
  if (!token || !sessions[token]) return res.status(401).json({ error: 'Not authenticated' });
  res.json(sessions[token]);
});

// In-memory cache for news API responses
const newsCache = {
  data: new Map(),
  maxAge: 5 * 60 * 1000, // 5 minutes cache duration
  
  // Set item in cache
  set: function(key, value) {
    console.log(`[Cache] Setting cache for key: ${key}`);
    this.data.set(key, {
      timestamp: Date.now(),
      value: value
    });
  },
  
  // Get item from cache
  get: function(key) {
    const entry = this.data.get(key);
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      console.log(`[Cache] Expired cache for key: ${key}`);
      this.data.delete(key);
      return null;
    }
    
    console.log(`[Cache] Cache hit for key: ${key}`);
    return entry.value;
  }
};

app.get('/news', async (req, res) => {
  try {
    const q = req.query.q;
    const from = req.query.from;
    const to = req.query.to;
    const sources = req.query.sources;
    // Enhanced pagination params
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    
    // Generate cache key based on query params
    const cacheKey = `news_${q || ''}_${from || ''}_${to || ''}_${sources || ''}_${page}_${pageSize}`;
    
    // Check cache first
    const cachedData = newsCache.get(cacheKey);
    if (cachedData) {
      console.log(`[News API] Serving from cache for page ${page}, size ${pageSize}`);
      return res.json(cachedData);
    }
    
    // Only allow NewsAPI-supported params
    const params = {
      apiKey: NEWS_API_KEY,
      page,
      pageSize
    };
    if (q) params.q = q;
    if (from) params.from = from;
    if (to) params.to = to;
    if (sources) params.sources = sources;
    
    // Remove unsupported params (sortBy, language) for /v2/everything fallback
    // If no q, fallback to /v2/top-headlines with country: 'us'
    let url = 'https://newsapi.org/v2/everything';
    if ((!q || q.trim() === '') && !from && !to && !sources) {
      url = 'https://newsapi.org/v2/top-headlines';
      params.country = 'us';
    }
    
    console.log(`[News API] Fetching from API for page ${page}, size ${pageSize}`);
    const response = await axios.get(url, { 
      params,
      timeout: 10000 // 10 second timeout
    });
    
    // Process response for Tabulator
    const totalResults = response.data.totalResults || 0;
    const lastPage = Math.ceil(totalResults / pageSize);
    
    // Prepare result
    const result = {
      data: response.data.articles || [],
      last_page: lastPage,
      total_count: totalResults
    };
    
    // Save to cache
    newsCache.set(cacheKey, result);
    
    // Send response
    res.json(result);
  } catch (error) {
    console.error('[News API Error]', error?.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch news', 
      details: error?.response?.data || error.message || error,
      timestamp: new Date().toISOString()
    });
  }
});

// /grok endpoint: Receives a user prompt, sends it to xAI Grok, parses the structured JSON response, and fetches news from NewsAPI using the generated query. Returns the explanation, query, and news results to the frontend.
app.post('/grok', async (req, res) => {
  console.log('--- GROK PROXY DEBUG START ---');
  console.log('Incoming body:', req.body);
  try {
    // Use prompt from frontend, not req.body.messages
    const userPrompt = req.body.prompt || '';
    
    // Extract keywords directly from the user prompt as a fallback
    const extractKeywords = (prompt) => {
      // Improved keyword extraction with better stop word filtering
      const stopWords = ['about', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 
                        'could', 'would', 'should', 'news', 'articles', 'latest', 
                        'can', 'find', 'tell', 'me', 'please', 'get', 'show'];
                        
      const words = prompt.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .filter(w => !stopWords.includes(w));
      
      // Ensure we always get at least one keyword, even if it's short
      if (words.length === 0) {
        return prompt.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length >= 2)
          .filter(w => !['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of'].includes(w))
          .slice(0, 3)
          .join(' ');
      }
      
      return words.slice(0, 3).join(' ');
    };
    
    // Always initialize with a fallback query from extracted keywords
    // This ensures we always have a query even if the API call fails
    let newsapi_query = {
      q: extractKeywords(userPrompt)
    };
    let explanation = `Here are news results about "${newsapi_query.q}"`;
    
    try {
      // Don't attempt to call Grok API if no valid API key is provided
      if (!XAI_API_KEY || XAI_API_KEY === 'your_xai_grok_key_here') {
        throw new Error('No valid Grok API key provided. Please add your key to .env file.');
      }
      // Enhanced system prompt for Grok
      const systemPrompt = `You are an assistant that helps users find relevant news articles.\n` +
        `Given the user's request, extract the main topic, location, and any relevant keywords.\n` +
        `IMPORTANT: Always return a specific search query in the "q" field.\n` +
        `Return your response as a JSON object with the following format:\n` +
        `{"newsapi_query": {"q": <keywords>, "from": <YYYY-MM-DD, optional>, "to": <YYYY-MM-DD, optional>, "sources": <comma-separated sources, optional>}, "explanation": <short explanation for the user>}` +
        `\nOnly return the JSON object, no extra text.`;
      // Payload for the Grok API
      const payload = {
        model: req.body.model || 'grok-3-latest',
        stream: false,
        temperature: typeof req.body.temperature === 'number' ? req.body.temperature : 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      };
      console.log('Outgoing payload to xAI:', payload);
      // Try to connect to Grok with a 10 second timeout
      const grokResponse = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${XAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000, // 10 second timeout
          validateStatus: status => true // Accept any status code and handle errors manually
        }
      );
      // Check the status code before proceeding
      if (grokResponse.status >= 400) {
        console.error(`Grok API returned status ${grokResponse.status}:`, grokResponse.data);
        throw new Error(`Grok API returned status ${grokResponse.status}: ${JSON.stringify(grokResponse.data || {})}`);
      }
      console.log('Grok API response:', grokResponse.data);
      // Extract and parse Grok's answer
      const content = grokResponse.data?.choices?.[0]?.message?.content;
      let parsed = {};
      try {
        if (content && typeof content === 'string' && content.trim().startsWith('{')) {
          parsed = JSON.parse(content);
        } else {
          parsed = { explanation: content || 'No response from Grok.' };
        }
      } catch (e) {
        parsed = { explanation: content || 'No response from Grok.' };
      }
      newsapi_query = parsed.newsapi_query || {};
      explanation = parsed.explanation || '';
    } catch (grokError) {
      // If Grok fails, return error to client and do NOT fallback
      console.error('Error contacting Grok API:', grokError.message);
      return res.status(503).json({ error: 'Grok is unavailable. Please try again later.', details: grokError.message });
    }
    // Cache key for this query
    const newsCacheKey = `grok_news_${JSON.stringify(newsapi_query)}`;
    
    let newsResults = [];
    try {
      // Check if we have cached results first
      const cachedResults = newsCache.get(newsCacheKey);
      if (cachedResults) {
        console.log('[Grok] Using cached news results');
        newsResults = cachedResults;
      } else {
        console.log('[Grok] Fetching fresh news results');
        const params = { apiKey: NEWS_API_KEY };
        
        // Always ensure we have a query parameter
        if (newsapi_query.q) {
          params.q = newsapi_query.q;
        } else {
          params.q = extractKeywords(userPrompt);
          console.log(`[Grok] No query provided, using extracted keywords: ${params.q}`);
        }
        
        if (newsapi_query.from) params.from = newsapi_query.from;
        if (newsapi_query.to) params.to = newsapi_query.to;
        if (newsapi_query.sources) params.sources = newsapi_query.sources;
        
        let url = 'https://newsapi.org/v2/everything';
        if ((!params.q || params.q.trim() === '') && !params.from && !params.to && !params.sources) {
          url = 'https://newsapi.org/v2/top-headlines';
          params.country = 'us';
        }
        
        // Sanitize query parameter to avoid errors
        if (params.q) {
          params.q = params.q.replace(/[^\w\s]/g, ' ').trim();
          if (params.q.length > 100) {
            params.q = params.q.substring(0, 100);
          }
        }
        
        console.log(`[Grok] Fetching news with params:`, params);
        
        const newsResp = await axios.get(url, { 
          params,
          timeout: 10000 // 10 second timeout
        });
        
        newsResults = newsResp.data.articles || [];
        
        // Cache the results if we got some
        if (newsResults.length > 0) {
          newsCache.set(newsCacheKey, newsResults);
        }
      }
    } catch (err) {
      console.error('Failed to fetch news for Grok:', err?.response?.data || err.message || err);
      
      // Send a more informative error message but still return what we have
      explanation += `. Note: There was an issue fetching the latest news articles, but I'll show you what I can.`;
    }
    
    // Enhanced response with better metadata
    const response = {
      response: explanation,
      newsQuery: newsapi_query,
      newsResults,
      metadata: {
        timestamp: new Date().toISOString(),
        querySuccessful: true,
        resultCount: newsResults.length,
        originalPrompt: userPrompt
      }
    };
    
    console.log(`[Grok] Returning ${newsResults.length} results`);
    res.json(response);
    console.log('--- GROK PROXY DEBUG END ---');
  } catch (error) {
    console.error('Error contacting Grok:', error?.response?.data || error.message || error);
    
    // Try to provide a more helpful error message based on error type
    let errorMessage = 'Failed to process your request';
    let errorDetails = error?.response?.data || error.message || error;
    let statusCode = 500;
    
    // Check for specific error conditions to provide better messages
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      errorMessage = 'Unable to connect to news service (connection issue)';
      statusCode = 503; // Service Unavailable
    } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
      errorMessage = 'Request timed out while processing';
      statusCode = 504; // Gateway Timeout
    } else if (error.message && error.message.includes('API key')) {
      errorMessage = 'Authentication error with news service';
      statusCode = 401; // Unauthorized
    } else if (error.response && error.response.status === 429) {
      errorMessage = 'Rate limit exceeded for news service';
      statusCode = 429; // Too Many Requests
    }
    
    // Send the error response with appropriate status code
    res.status(statusCode).json({ 
      error: errorMessage, 
      details: errorDetails,
      timestamp: new Date().toISOString(),
      fallbackAvailable: true // Indicate to client that fallback might be available
    });
    
    console.log('--- GROK PROXY DEBUG END ---');
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Non-blocking rebuild endpoint
app.post('/rebuild', (req, res) => {
  const scriptPath = path.join(__dirname, 'rebuild_nonblocking.sh');
  console.log(`Running rebuild script: ${scriptPath}`);
  
  exec(scriptPath, { 
    cwd: __dirname,
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Rebuild error: ${error}`);
    }
  });
  
  // Respond immediately
  res.json({ status: 'rebuild initiated' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
