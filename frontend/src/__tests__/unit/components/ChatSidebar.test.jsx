import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatSidebar from '../../../components/ChatSidebar';
import { makeChatRequest } from '../../../utils/apiHelper';

// Mock the apiHelper module
jest.mock('../../../utils/apiHelper', () => ({
  makeChatRequest: jest.fn()
}));

describe('ChatSidebar Component', () => {
  const mockOnCreateCard = jest.fn();
  const mockOnUpdateCard = jest.fn();
  const mockOnDeleteCard = jest.fn();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock response
    makeChatRequest.mockResolvedValue({
      response: 'Mock response',
      newsResults: [
        {
          title: 'Test Article',
          source: { name: 'Test Source' },
          description: 'Test description',
          url: 'https://test.com',
          publishedAt: '2025-06-10T12:00:00Z'
        }
      ]
    });
  });
  
  test('renders initial welcome message', () => {
    render(
      <ChatSidebar
        isOpen={true}
        toggleSidebar={() => {}}
        onCreateCard={mockOnCreateCard}
        onUpdateCard={mockOnUpdateCard}
        onDeleteCard={mockOnDeleteCard}
      />
    );
    
    expect(screen.getByText(/Hey there! Ask about news or create a card to get started./i)).toBeInTheDocument();
  });
  
  test('allows user to send a message', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatSidebar
        isOpen={true}
        toggleSidebar={() => {}}
        onCreateCard={mockOnCreateCard}
        onUpdateCard={mockOnUpdateCard}
        onDeleteCard={mockOnDeleteCard}
      />
    );
    
    // Type a message
    const input = screen.getByPlaceholderText(/Ask about news or create a card/i);
    await user.type(input, 'Tell me about AI news');
    
    // Click the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Check if the user message is displayed
    expect(screen.getByText('Tell me about AI news')).toBeInTheDocument();
    
    // Wait for API response and check if AI response is displayed
    await waitFor(() => {
      expect(makeChatRequest).toHaveBeenCalledWith('Tell me about AI news', expect.any(Object));
      expect(screen.getByText('Mock response')).toBeInTheDocument();
    });
  });
  
  test('creates a card when valid news results are returned', async () => {
    const user = userEvent.setup();
    
    // Mock successful card creation
    mockOnCreateCard.mockReturnValue(true);
    
    render(
      <ChatSidebar
        isOpen={true}
        toggleSidebar={() => {}}
        onCreateCard={mockOnCreateCard}
        onUpdateCard={mockOnUpdateCard}
        onDeleteCard={mockOnDeleteCard}
      />
    );
    
    // Type a message
    const input = screen.getByPlaceholderText(/Ask about news or create a card/i);
    await user.type(input, 'News about technology');
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Wait for the card creation to happen and success message to appear
    await waitFor(() => {
      expect(mockOnCreateCard).toHaveBeenCalled();
      expect(screen.getByText(/New card created with 1 article/i)).toBeInTheDocument();
    });
    
    // Verify the card was created with the right data structure
    expect(mockOnCreateCard).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.any(String),
      category: expect.any(String),
      articles: expect.arrayContaining([
        expect.objectContaining({
          title: 'Test Article',
          source: 'Test Source',
          url: 'https://test.com'
        })
      ])
    }));
  });
  
  test('shows error message when card creation fails', async () => {
    const user = userEvent.setup();
    
    // Mock failed card creation
    mockOnCreateCard.mockReturnValue(false);
    
    render(
      <ChatSidebar
        isOpen={true}
        toggleSidebar={() => {}}
        onCreateCard={mockOnCreateCard}
        onUpdateCard={mockOnUpdateCard}
        onDeleteCard={mockOnDeleteCard}
      />
    );
    
    // Type a message
    const input = screen.getByPlaceholderText(/Ask about news or create a card/i);
    await user.type(input, 'News about technology');
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(mockOnCreateCard).toHaveBeenCalled();
      expect(screen.getByText(/There was a problem creating the card/i)).toBeInTheDocument();
    });
  });
  
  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    makeChatRequest.mockRejectedValue(new Error('API request failed: 500 Internal Server Error'));
    
    render(
      <ChatSidebar
        isOpen={true}
        toggleSidebar={() => {}}
        onCreateCard={mockOnCreateCard}
        onUpdateCard={mockOnUpdateCard}
        onDeleteCard={mockOnDeleteCard}
      />
    );
    
    // Type a message
    const input = screen.getByPlaceholderText(/Ask about news or create a card/i);
    await user.type(input, 'News about technology');
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Grok returned a 500 error/i)).toBeInTheDocument();
    });
  });
});
