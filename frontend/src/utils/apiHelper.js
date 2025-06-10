// API Helper functions for handling errors and retries
// Provides better resilience for the news aggregator application

/**
 * Makes a request to the Grok chat API with retry and fallback logic
 * @param {string} prompt - The user prompt to send
 * @param {Object} options - Additional options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 2)
 * @param {number} options.timeout - Request timeout in ms (default: 20000)
 * @param {boolean} options.useSimplification - Whether to try simplifying the prompt on retry
 * @returns {Promise<Object>} - The API response data
 */
export const makeChatRequest = async (prompt, options = {}) => {
  const {
    maxRetries = 2,
    timeout = 20000,
    useSimplification = true
  } = options;
  
  let attempts = 0;
  let currentPrompt = prompt;
  let lastError = null;
  
  while (attempts <= maxRetries) {
    try {
      console.log(`API attempt ${attempts + 1}/${maxRetries + 1} with prompt: "${currentPrompt.substring(0, 50)}${currentPrompt.length > 50 ? '...' : ''}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch('http://localhost:3000/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: currentPrompt,
          model: 'grok-3-latest', 
          temperature: 0.5
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} ${errorData.error || ''}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      attempts++;
      
      // If we have retries left, try again with a simplified prompt
      if (attempts <= maxRetries && useSimplification) {
        currentPrompt = simplifyPrompt(currentPrompt, attempts);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }
  }
  
  // If all attempts failed, throw the last error
  throw lastError || new Error('Request failed after multiple attempts');
};

/**
 * Simplifies a prompt to increase chances of success on retry
 * @param {string} prompt - The original prompt
 * @param {number} attempt - The current attempt number
 * @returns {string} - A simplified version of the prompt
 */
function simplifyPrompt(prompt, attempt) {
  if (attempt === 1) {
    // First retry - remove complex parts and make more direct
    return extractMainTopic(prompt);
  } else {
    // Second retry - just ask for top headlines
    return "Show me today's top headlines";
  }
}

/**
 * Extracts the main topic from a prompt
 * @param {string} prompt - The original prompt
 * @returns {string} - A simplified prompt with just the main topic
 */
function extractMainTopic(prompt) {
  // Try to extract main topic using common patterns
  const aboutMatch = prompt.match(/about\s+([^.!?]+)/i);
  if (aboutMatch && aboutMatch[1]) {
    return `Show me news about ${aboutMatch[1].trim()}`;
  }
  
  const showMatch = prompt.match(/show\s+(?:me|us)?\s+([^.!?]+?)\s+(?:news|articles|information)/i);
  if (showMatch && showMatch[1]) {
    return `Show me ${showMatch[1].trim()} news`;
  }
  
  // Remove filler words and simplify
  const simplifiedPrompt = prompt
    .replace(/(?:can you|could you|please|i'd like|i would like|i want|get me|find me)/gi, '')
    .replace(/(?:some|the latest|recent|current)/gi, '')
    .trim();
  
  if (simplifiedPrompt.length < 10) {
    // If prompt is too short after simplification, ask for general news
    return "Show me today's top news";
  }
  
  return simplifiedPrompt;
}

/**
 * Makes a direct request to the news endpoint with fallback handling
 * @param {Object} params - Query parameters for the news API
 * @returns {Promise<Object>} - The API response with news articles
 */
export const getNewsDirectly = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`http://localhost:3000/news?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`News API request failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching news directly:', error);
    
    // Try fetching top headlines as a last resort
    console.log('Falling back to top headlines...');
    const fallbackResponse = await fetch(`http://localhost:3000/news?`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!fallbackResponse.ok) {
      throw new Error('Failed to fetch even fallback news');
    }
    
    return await fallbackResponse.json();
  }
};
