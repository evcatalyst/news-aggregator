import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { makeChatRequest } from '../../utils/apiHelper';

// Mock the API helper
jest.mock('../../utils/apiHelper', () => ({
  makeChatRequest: jest.fn()
}));

// Mock fetch API for initial news load
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        {
          title: 'Initial News Article',
          source: { name: 'Test Source' },
          description: 'Initial description',
          publishedAt: '2025-06-10T12:00:00Z', 
          url: 'https://example.com/initial'
        }
      ]
    })
  })
);

// Mock matchMedia
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock AppState
window.AppState = {
  searchResults: [],
  updateUIState: jest.fn()
};

describe('Chat to Card Creation Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.AppState.searchResults = [];
    
    // Default mock response for chat
    makeChatRequest.mockResolvedValue({
      response: 'Here are the latest tech news articles',
      newsResults: [
        {
          title: 'New AI Development',
          source: { name: 'Tech News' },
          description: 'Breakthrough in AI technology',
          publishedAt: '2025-06-10T12:00:00Z',
          url: 'https://technews.com/ai-breakthrough'
        },
        {
          title: 'Quantum Computing Advances',
          source: { name: 'Science Daily' },
          description: 'New quantum computing milestone',
          publishedAt: '2025-06-09T14:30:00Z',
          url: 'https://sciencedaily.com/quantum'
        }
      ]
    });
  });
  
  test('complete flow: chat query to card creation', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // Wait for initial news to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading news/i)).not.toBeInTheDocument();
    });
    
    // Open the sidebar on mobile view
    const menuButton = screen.getByLabelText(/Toggle sidebar/i);
    await user.click(menuButton);
    
    // Type a message in the chat
    // First check the mobile sidebar since it's opened when we click the toggle button
    // Get the input in the mobile sidebar (the one in a div with fixed position)
    const mobileInput = screen.getAllByPlaceholderText(/Ask about news or create a card/i)
      .find(input => {
        const parent = input.closest('.z-60') || input.closest('.fixed');
        return parent !== null;
      });
      
    await user.type(mobileInput || screen.getAllByPlaceholderText(/Ask about news or create a card/i)[0], 'Show me the latest tech news');
    
    // Send the message - find the send button in the active sidebar
    // First try to find the send button in the same container as the input we just used
    const inputElement = mobileInput || screen.getAllByPlaceholderText(/Ask about news or create a card/i)[0];
    const closestSidebar = inputElement.closest('aside') || inputElement.closest('.z-60') || inputElement.closest('.fixed');
    
    let sendButton;
    if (closestSidebar) {
      // Look for the send button within the sidebar container
      sendButton = within(closestSidebar).getByRole('button', { name: /send/i, exact: false });
    } else {
      // Fallback to any send button
      sendButton = screen.getByRole('button', { name: /send/i, exact: false });
    }
    
    await user.click(sendButton);
    
    // Check that the message was sent
    expect(screen.getByText('Show me the latest tech news')).toBeInTheDocument();
    
    // Wait for API response and success message
    await waitFor(() => {
      expect(makeChatRequest).toHaveBeenCalledWith('Show me the latest tech news', expect.any(Object));
      expect(screen.getByText(/Here are the latest tech news articles/i)).toBeInTheDocument();
      expect(screen.getByText(/New card created with 2 articles/i)).toBeInTheDocument();
    });
    
    // Check that the card was added to AppState
    expect(window.AppState.searchResults.length).toBe(2); // Initial + new card
    expect(window.AppState.searchResults[1].articles.length).toBe(2);
    expect(window.AppState.searchResults[1].articles[0].title).toBe('New AI Development');
  });
  
  test('handles empty news results properly', async () => {
    const user = userEvent.setup();
    
    // Mock empty news results
    makeChatRequest.mockResolvedValue({
      response: 'I couldn\'t find any news about that topic',
      newsResults: []
    });
    
    render(<App />);
    
    // Wait for initial news to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading news/i)).not.toBeInTheDocument();
    });
    
    // Open the sidebar on mobile view
    const menuButton = screen.getByLabelText(/Toggle sidebar/i);
    await user.click(menuButton);
    
    // Type a message in the chat
    // First check the mobile sidebar since it's opened when we click the toggle button
    // Get the input in the mobile sidebar (the one in a div with fixed position)
    const mobileInput = screen.getAllByPlaceholderText(/Ask about news or create a card/i)
      .find(input => {
        const parent = input.closest('.z-60') || input.closest('.fixed');
        return parent !== null;
      });
      
    await user.type(mobileInput || screen.getAllByPlaceholderText(/Ask about news or create a card/i)[0], 'Show me news about unicorns');
    
    // Send the message - find the send button in the active sidebar
    // First try to find the send button in the same container as the input we just used
    const inputElement = mobileInput || screen.getAllByPlaceholderText(/Ask about news or create a card/i)[0];
    const closestSidebar = inputElement.closest('aside') || inputElement.closest('.z-60') || inputElement.closest('.fixed');
    
    let sendButton;
    if (closestSidebar) {
      // Look for the send button within the sidebar container
      sendButton = within(closestSidebar).getByRole('button', { name: /send/i, exact: false });
    } else {
      // Fallback to any send button
      sendButton = screen.getByRole('button', { name: /send/i, exact: false });
    }
    
    await user.click(sendButton);
    
    // Wait for API response and no results message
    await waitFor(() => {
      expect(makeChatRequest).toHaveBeenCalledWith('Show me news about unicorns', expect.any(Object));
      expect(screen.getByText(/I couldn't find any news about that topic/i)).toBeInTheDocument();
      expect(screen.getByText(/No news articles found for that topic/i)).toBeInTheDocument();
    });
    
    // Check that no new card was added
    expect(window.AppState.searchResults.length).toBe(1); // Initial only
  });
  
  test('prevents duplicate card creation', async () => {
    const user = userEvent.setup();
    
    render(<App />);
    
    // Wait for initial news to load
    await waitFor(() => {
      expect(screen.queryByText(/Loading news/i)).not.toBeInTheDocument();
    });
    
    // Open the sidebar
    const menuButton = screen.getByLabelText(/Toggle sidebar/i);
    await user.click(menuButton);
    
    // First query
    // First check the mobile sidebar since it's opened when we click the toggle button
    // Get the input in the mobile sidebar (the one in a div with fixed position)
    const mobileInput = screen.getAllByPlaceholderText(/Ask about news or create a card/i)
      .find(input => {
        const parent = input.closest('.z-60') || input.closest('.fixed');
        return parent !== null;
      });
      
    const inputElement = mobileInput || screen.getAllByPlaceholderText(/Ask about news or create a card/i)[0];
    await user.type(inputElement, 'Tech news');
    
    // Send the message - find the send button in the active sidebar
    const closestSidebar = inputElement.closest('aside') || inputElement.closest('.z-60') || inputElement.closest('.fixed');
    
    let sendButton;
    if (closestSidebar) {
      // Look for the send button within the sidebar container
      sendButton = within(closestSidebar).getByRole('button', { name: /send/i, exact: false });
    } else {
      // Fallback to any send button
      sendButton = screen.getByRole('button', { name: /send/i, exact: false });
    }
    
    await user.click(sendButton);
    
    // Wait for first card to be created
    await waitFor(() => {
      expect(screen.getByText(/New card created with 2 articles/i)).toBeInTheDocument();
    });
    
    // Clear the input and try the same query again with the same mobile input
    await user.clear(inputElement);
    await user.type(inputElement, 'Tech news');
    await user.click(sendButton);
    
    // Wait for error message (duplicate card)
    await waitFor(() => {
      expect(screen.getAllByText(/There was a problem creating the card/i).length).toBeGreaterThan(0);
    });
    
    // Check that only one new card was added (plus the initial)
    expect(window.AppState.searchResults.length).toBe(2);
  });
});
