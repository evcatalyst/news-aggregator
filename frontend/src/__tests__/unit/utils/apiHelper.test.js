import { makeChatRequest } from '../../../utils/apiHelper';

// Mock fetch API
global.fetch = jest.fn();
global.AbortController = jest.fn(() => ({
  abort: jest.fn(),
  signal: {}
}));

describe('API Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        response: 'Mock response',
        newsResults: [{ title: 'Article 1', url: 'https://example.com' }]
      })
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('makeChatRequest sends correct data to API', async () => {
    const prompt = 'Tell me about tech news';
    await makeChatRequest(prompt);
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/grok', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        model: 'grok-3-latest',
        temperature: 0.5
      }),
      signal: expect.any(Object)
    });
  });
  
  test('makeChatRequest returns parsed response data', async () => {
    const response = await makeChatRequest('Test prompt');
    
    expect(response).toEqual({
      response: 'Mock response',
      newsResults: [{ title: 'Article 1', url: 'https://example.com' }]
    });
  });
  
  test('makeChatRequest handles API errors', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Server error' })
    });
    
    // Mock setTimeout to execute immediately to avoid test timeouts
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
    
    await expect(makeChatRequest('Test prompt', { maxRetries: 0 })).rejects.toThrow('API request failed: 500 Internal Server Error Server error');
  }, 10000);
  
  test('makeChatRequest handles network errors', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    
    // Mock setTimeout to execute immediately to avoid test timeouts
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
    
    await expect(makeChatRequest('Test prompt', { maxRetries: 0 })).rejects.toThrow('Network error');
  }, 10000);
  
  test('makeChatRequest handles timeouts with AbortController', async () => {
    // Create a mock abort function
    const mockAbort = jest.fn();
    // Mock the AbortController
    global.AbortController = jest.fn(() => ({
      signal: { aborted: false },
      abort: mockAbort
    }));

    // Mock the fetch to simulate a call that will be aborted
    fetch.mockImplementation(() => {
      throw new DOMException('The operation was aborted', 'AbortError');
    });
    
    // Keep track of the setTimeout calls
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    
    // Call the function that should set up a timeout and then abort
    try {
      await makeChatRequest('Test prompt', { timeout: 100, maxRetries: 0 });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('aborted');
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    }
  }, 10000);
  
  test('makeChatRequest retries on failure', async () => {
    // Mock setTimeout to execute immediately
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
    
    // Fail first, succeed on second attempt
    fetch.mockRejectedValueOnce(new Error('API request failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Retry successful',
          newsResults: [{ title: 'Article 1', url: 'https://example.com' }]
        })
      });
    
    const response = await makeChatRequest('Test prompt', { maxRetries: 1 });
    
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(response).toEqual({
      response: 'Retry successful',
      newsResults: [{ title: 'Article 1', url: 'https://example.com' }]
    });
  }, 10000);
  
  test('makeChatRequest gives up after max retries', async () => {
    // Mock setTimeout to execute immediately
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb());
    
    // Fail on all attempts
    fetch.mockRejectedValue(new Error('API request failed'));
    
    await expect(makeChatRequest('Test prompt', { maxRetries: 1 })).rejects.toThrow('API request failed');
    expect(fetch).toHaveBeenCalledTimes(2); // Initial attempt + 1 retry
  }, 10000);
});
