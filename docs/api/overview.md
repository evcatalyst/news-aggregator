# API Reference

## Overview

The News Aggregator API provides endpoints for news retrieval, content analysis, and card management.

## Base URL

```
Production: https://api.news-aggregator.com
Development: http://localhost:3000
```

## Authentication

API requests require authentication via API keys:

```bash
# Example request with authorization
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.news-aggregator.com/news
```

## Endpoints

### News Search

```http
GET /news
```

Query news articles with optional filters.

#### Parameters

| Parameter  | Type     | Description                    |
|------------|----------|--------------------------------|
| query      | string   | Search term                    |
| category   | string   | News category                  |
| limit      | number   | Maximum results (default: 10)  |

#### Response

```json
{
  "articles": [
    {
      "title": "Article Title",
      "url": "https://example.com/article",
      "source": {
        "name": "Source Name"
      },
      "publishedAt": "2025-06-11T00:00:00Z",
      "description": "Article description"
    }
  ],
  "total": 1
}
```

### AI Analysis

```http
POST /grok
```

Get AI-powered analysis of news content.

#### Request Body

```json
{
  "prompt": "Show me news about technology"
}
```

#### Response

```json
{
  "response": "Analysis of technology news...",
  "newsResults": [
    {
      "title": "Tech Article",
      "url": "https://example.com/tech",
      "source": {
        "name": "Tech News"
      },
      "publishedAt": "2025-06-11T00:00:00Z",
      "description": "Technology article description"
    }
  ]
}
```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Server Error

Error responses include:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per day per API key

Headers indicate rate limit status:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
```

## SDKs and Examples

### JavaScript

```javascript
import { NewsAggregatorClient } from '@news-aggregator/client';

const client = new NewsAggregatorClient('YOUR_API_KEY');

// Search news
const articles = await client.searchNews('technology');

// Get AI analysis
const analysis = await client.analyzeContent('Show me tech news');
```

### Python

```python
from news_aggregator import Client

client = Client('YOUR_API_KEY')

# Search news
articles = client.search_news('technology')

# Get AI analysis
analysis = client.analyze_content('Show me tech news')
```

## Best Practices

1. **Caching**
   - Cache responses when possible
   - Honor Cache-Control headers
   - Implement exponential backoff

2. **Error Handling**
   - Handle rate limits gracefully
   - Implement retry logic
   - Log errors appropriately

3. **Performance**
   - Use compression
   - Minimize request payload size
   - Batch requests when possible

## Support

For API support:

1. Check the [troubleshooting guide](/guide/troubleshooting)
2. Review [known issues](https://github.com/yourusername/news-aggregator/issues)
3. Contact [support](mailto:support@news-aggregator.com)
