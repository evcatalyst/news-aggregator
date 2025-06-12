import { useState, useEffect, useRef } from 'react';
import HelpTooltip from './HelpTooltip';
import '../styles/chat-sidebar.css';
import { makeChatRequest } from '../utils/apiHelper';

// ChatSidebar: Grok-inspired conversational UI for news card management
const ChatSidebar = ({ isOpen, toggleSidebar, onCreateCard, onUpdateCard, onDeleteCard }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'AI', text: 'Hey there! Ask about news or create a card to get started.', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatHistoryRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to bottom on new messages and track scroll position
  useEffect(() => {
    const chatHistory = chatHistoryRef.current;
    if (chatHistory) {
      // Use a more compatible way to scroll that works in JSDOM for tests
      try {
        if (typeof chatHistory.scrollTo === 'function') {
          chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
        } else {
          // Fallback for JSDOM in tests
          chatHistory.scrollTop = chatHistory.scrollHeight;
        }
      } catch (error) {
        // Silent fail in test environment
        console.debug('[ChatSidebar] Error scrolling chat:', error.message);
      }
      
      const handleScroll = () => {
        const isAtBottom = chatHistory.scrollHeight - chatHistory.scrollTop <= chatHistory.clientHeight + 10;
        setShowScrollButton(!isAtBottom);
      };
      
      try {
        chatHistory.addEventListener('scroll', handleScroll);
        return () => chatHistory.removeEventListener('scroll', handleScroll);
      } catch (error) {
        // Silent fail in test environment
        console.debug('[ChatSidebar] Error with scroll listener:', error.message);
      }
    }
  }, [messages]);

  // Focus input when sidebar opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Handle sending messages and parsing commands
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: messages.length + 1, sender: 'User', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      console.log('Making chat request with input:', input);
      const data = await makeChatRequest(input);
      console.log('API response data:', data);
      const { response: explanation, newsResults } = data;
      
      // Always show Grok's response
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: explanation, timestamp: new Date() }
      ]);

      if (newsResults?.length > 0) {
        // Add debugging for the specific issue with "dogs" queries
        console.log(`Creating card for search: "${input}", found ${newsResults.length} results:`, 
          newsResults.map(a => a.title).join(', '));
        
        // Log raw results for inspection
        console.log('Raw newsResults:', JSON.stringify(newsResults, null, 2));
          
        // Simple card creation - just format the articles with careful validation
        const formattedArticles = newsResults
          .filter(article => article && typeof article === 'object')  // Ensure each article is valid
          .map(article => {
            console.log('Processing article:', article);
            return {
              title: article.title || 'Untitled Article',
              url: article.url || '#',
              source: article.source?.name || 'News',
              date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              summary: article.description || ''
            };
          })
          .filter(a => a.title && a.url); // Only keep articles with title and URL
        
        console.log('Formatted articles:', formattedArticles);
        
        // Create card with default category and current timestamp
        const card = {
          id: Date.now().toString(),
          title: input.slice(0, 50),
          category: input.toLowerCase().includes('dog') ? 'Pets' : 'Other', // Special handling for dogs
          timestamp: new Date().toISOString(),
          articles: formattedArticles
        };

        console.log('Attempting to create card:', card);
        console.log('onCreateCard function exists:', Boolean(onCreateCard));

        // Try to create the card
        const success = onCreateCard(card);
        console.log('Card creation result:', success);
        
        // Show the result
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'AI',
            text: success ? 
              `✅ Created card with ${card.articles.length} articles` :
              `❌ Could not create card, try a different search (${card.articles.length} articles found)`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }
      ]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Handle command parsing for card management
  const handleCommands = (text) => {
    const commands = {
      delete: /(delete|remove)\s+(the\s+)?(new|last|latest|this)?\s*card/i,
      minimize: /(minimize|collapse)\s+(the\s+)?(new|last|latest|this)?\s*card/i,
      expand: /(expand|maximize)\s+(the\s+)?(new|last|latest|this)?\s*card/i,
      resize: /(resize|make)\s+(the\s+)?(new|last|latest|this)?\s*card\s+(compact|normal|expanded)/i
    };

    // Check if text matches any command pattern
    for (const [action, pattern] of Object.entries(commands)) {
      if (pattern.test(text)) {
        // Get the most recent card by default
        const recentCard = AppState.searchResults[AppState.searchResults.length - 1];
        if (!recentCard) {
          return {
            response: "I don't see any cards to manage. Try searching for something first!",
            handled: true
          };
        }

        switch (action) {
          case 'delete':
            onDeleteCard(recentCard.id);
            return {
              response: `✅ Deleted card "${recentCard.title}"`,
              handled: true
            };
          case 'minimize':
            onUpdateCard(recentCard.id, { isMinimized: true });
            return {
              response: `✅ Minimized card "${recentCard.title}"`,
              handled: true
            };
          case 'expand':
            onUpdateCard(recentCard.id, { isMinimized: false });
            return {
              response: `✅ Expanded card "${recentCard.title}"`,
              handled: true
            };
          case 'resize':
            const size = text.match(/(compact|normal|expanded)/i)[0].toLowerCase();
            onUpdateCard(recentCard.id, { cardSize: size });
            return {
              response: `✅ Resized card "${recentCard.title}" to ${size}`,
              handled: true
            };
        }
      }
    }
    return { handled: false };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const newUserMessage = { 
      id: messages.length + 1, 
      sender: 'You', 
      text: input.trim(), 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsThinking(true);

    // Check if the message is a card management command
    const commandResult = handleCommands(newUserMessage.text);
    if (commandResult.handled) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        sender: 'AI',
        text: commandResult.response,
        timestamp: new Date()
      }]);
      setIsThinking(false);
      return;
    }

    // If not a command, proceed with normal chat handling
    try {
      const response = await makeChatRequest(newUserMessage.text);
      console.log('API response data:', response);
      const { response: explanation, newsResults } = response;
      
      // Always show Grok's response
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: explanation, timestamp: new Date() }
      ]);

      if (newsResults?.length > 0) {
        // Add debugging for the specific issue with "dogs" queries
        console.log(`Creating card for search: "${input}", found ${newsResults.length} results:`, 
          newsResults.map(a => a.title).join(', '));
        
        // Log raw results for inspection
        console.log('Raw newsResults:', JSON.stringify(newsResults, null, 2));
          
        // Simple card creation - just format the articles with careful validation
        const formattedArticles = newsResults
          .filter(article => article && typeof article === 'object')  // Ensure each article is valid
          .map(article => {
            console.log('Processing article:', article);
            return {
              title: article.title || 'Untitled Article',
              url: article.url || '#',
              source: article.source?.name || 'News',
              date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              summary: article.description || ''
            };
          })
          .filter(a => a.title && a.url); // Only keep articles with title and URL
        
        console.log('Formatted articles:', formattedArticles);
        
        // Create card with default category and current timestamp
        const card = {
          id: Date.now().toString(),
          title: input.slice(0, 50),
          category: input.toLowerCase().includes('dog') ? 'Pets' : 'Other', // Special handling for dogs
          timestamp: new Date().toISOString(),
          articles: formattedArticles
        };

        console.log('Attempting to create card:', card);
        console.log('onCreateCard function exists:', Boolean(onCreateCard));

        // Try to create the card
        const success = onCreateCard(card);
        console.log('Card creation result:', success);
        
        // Show the result
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'AI',
            text: success ? 
              `✅ Created card with ${card.articles.length} articles` :
              `❌ Could not create card, try a different search (${card.articles.length} articles found)`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }
      ]);
    } finally {
      setIsThinking(false);
    }
  };
  
  // Helper functions to categorize content
  const getCategoryFromInput = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.match(/tech|apple|google|ai|robot|computer|software|hardware|programming/i)) {
      return 'Tech';
    } else if (lowerInput.match(/sport|game|team|player|match|tournament|basketball|football|soccer|nba|nfl/i)) {
      return 'Sports';
    } else if (lowerInput.match(/movie|film|tv|television|actor|actress|director|show|series|music|celebrity|entertainment/i)) {
      return 'Entertainment';
    }
    return 'Other';
  };
  
  const getCategoryFromArticle = (article) => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;
    
    if (content.match(/tech|apple|google|ai|robot|computer|software|hardware|programming/i)) {
      return 'Tech';
    } else if (content.match(/sport|game|team|player|match|tournament|basketball|football|soccer|nba|nfl/i)) {
      return 'Sports';
    } else if (content.match(/movie|film|tv|television|actor|actress|director|show|series|music|celebrity|entertainment/i)) {
      return 'Entertainment';
    }
    return 'Other';
  };

  // Scroll to bottom when button clicked
  const scrollToBottom = () => {
    chatHistoryRef.current?.scrollTo({ top: chatHistoryRef.current.scrollHeight, behavior: 'smooth' });
  };

  // Handle keyboard shortcuts to send
  const handleKeyDown = (e) => {
    // Send on Enter (without Shift for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Autofocus input when messages change
  useEffect(() => {
    if (textareaRef.current && messages.length > 0 && !isThinking) {
      textareaRef.current.focus();
    }
  }, [messages, isThinking]);

  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="chat-header">
        <div className="flex items-center">
          <h2 className="chat-title">Chat</h2>
          <HelpTooltip />
        </div>
        <button onClick={toggleSidebar} className="close-button">
          <span className="sr-only">Close sidebar</span>
          &times;
        </button>
      </div>
      
      <div
        ref={chatHistoryRef}
        className="flex-grow overflow-y-auto p-3 space-y-2"
        aria-live="polite"
      >
        {messages.map(msg => (
          <article
            key={msg.id}
            className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] p-2 rounded-lg text-xs border border-gray-600 shadow-sm flex items-start gap-2 ${
                msg.sender === 'User' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-gray-500 flex-shrink-0" />
              <div>
                <p className="font-semibold flex items-center gap-1">
                  {msg.sender === 'User' ? (
                    <span className="material-icons text-base align-middle">person</span>
                  ) : (
                    <span className="material-icons text-base align-middle">smart_toy</span>
                  )}
                  {msg.sender === 'User' ? 'You' : 'Grok'}
                </p>
                <p>{msg.text}</p>
                {msg.timestamp && (
                  <time className="text-[10px] text-gray-400">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                )}
              </div>
            </div>
          </article>
        ))}
        {isThinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] p-2 rounded-lg text-xs bg-gray-700 text-gray-200 flex items-center gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-700">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 text-xs bg-gray-900 text-gray-200 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask about news or create a card..."
          disabled={isThinking}
          rows={2}
          aria-label="Chat input"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">Press Enter to send (Shift+Enter for new line)</span>
          <button
            onClick={handleSend}
            disabled={isThinking}
            className={`py-1.5 px-3 text-xs bg-yellow-300 text-gray-900 rounded hover:bg-yellow-400 transition-colors ${
              isThinking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Send message"
          >
            {isThinking ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
      
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-4 w-8 h-8 rounded-full bg-yellow-300 text-gray-900 flex items-center justify-center text-lg shadow-md"
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </div>
  );
};

export default ChatSidebar;

// Simple string hash function for generating unique IDs
function hashCode(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
}