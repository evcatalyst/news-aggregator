import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
import cors from 'cors';

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

app.get('/news', async (req, res) => {
  try {
    const q = req.query.q;
    const from = req.query.from;
    const to = req.query.to;
    const sources = req.query.sources;
    // Only allow NewsAPI-supported params
    const params = {
      apiKey: NEWS_API_KEY
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
    const response = await axios.get(url, { params });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news', details: error?.response?.data || error.message || error });
  }
});

app.post('/grok', async (req, res) => {
  console.log('--- GROK PROXY DEBUG START ---');
  console.log('Incoming body:', req.body);
  try {
    // Refine user intent and instruct Grok to return a machine-readable NewsAPI query
    const userMessage = req.body.prompt || req.body.messages?.[0]?.content || '';
    const systemPrompt = `You are an assistant that helps users find relevant news articles.\n` +
      `Given the user's request, extract the main topic, location, and any relevant keywords.\n` +
      `Return your response as a JSON object with the following format:\n` +
      `{"newsapi_query": {"q": <keywords>, "from": <YYYY-MM-DD, optional>, "to": <YYYY-MM-DD, optional>, "sources": <comma-separated sources, optional>}, "explanation": <short explanation for the user>}` +
      `\nOnly return the JSON object, no extra text.`;
    const payload = {
      model: req.body.model || 'grok-3-latest',
      stream: false,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    };
    console.log('Outgoing payload to xAI:', JSON.stringify(payload, null, 2));
    const grokResponse = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.XAI_API_KEY}` } }
    );
    console.log('Grok API response:', grokResponse.data);
    res.json(grokResponse.data);
    console.log('--- GROK PROXY DEBUG END ---');
  } catch (error) {
    console.error('Error contacting Grok:', error?.response?.data || error.message || error);
    res.status(500).json({ error: 'Failed to contact Grok', details: error?.response?.data || error.message || error });
    console.log('--- GROK PROXY DEBUG END ---');
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
