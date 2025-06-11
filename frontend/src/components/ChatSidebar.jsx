import { useState, useEffect, useRef } from 'react';
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
      // Only use Grok, no fallback extraction
      const data = await makeChatRequest(input, {
        maxRetries: 2,
        timeout: 20000,
        useSimplification: true
      });
      
      const { response: explanation, newsResults } = data;
      
      // Format the response message
      const responseText = explanation || "I couldn't find any specific information about that.";
      
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: responseText, timestamp: new Date() },
      ]);
      
      // Debug log: Card creation attempt
      console.debug('[ChatSidebar] handleSend: newsResults', newsResults);
      // If we got news results, create a new card only if there are valid articles
      if (newsResults && Array.isArray(newsResults) && newsResults.length > 0) {
        // Filter out articles with missing or empty titles/urls
        const validArticles = newsResults.filter(
          a => a && a.title && a.url
        );
        console.debug('[ChatSidebar] handleSend: validArticles', validArticles);
        if (validArticles.length > 0) {
          // Create a unique ID using a timestamp + random suffix to ensure uniqueness
          const cardId = Date.now() + Math.floor(Math.random() * 1000);
          console.debug('[ChatSidebar] handleSend: generated cardId', cardId);
          
          // Format articles for compatibility with both React and vanilla JS
          const formattedArticles = validArticles.map((article, i) => {
            const articleId = cardId + i + 1; // Ensure unique IDs for each article
            console.debug('[ChatSidebar] handleSend: formatting article', { index: i, id: articleId });
            return {
              id: articleId,
              title: article.title,
              category: getCategoryFromArticle(article),
              source: article.source?.name || 'Unknown',
              date: article.publishedAt ? new Date(article.publishedAt).toISOString().split('T')[0] : '',
              summary: article.description || 'No description available',
              url: article.url,
              publishedAt: article.publishedAt,
              // Add a reference to the parent card to help with debugging
              cardRef: cardId,
              queryText: input.slice(0, 50)
            };
          });
          
          // Extract a more meaningful title from the input
          const extractedTitle = input.match(/about\s+(.+)/i)?.[1] || // "Tell me about X" -> "X"
                               input.match(/news\s+(?:about|on)\s+(.+)/i)?.[1] || // "news about X" -> "X"
                               input.match(/show\s+me\s+(?:news\s+)?(?:about|on)\s+(.+)/i)?.[1] || // "show me news about X" -> "X"
                               input.slice(0, 40); // Fallback to truncated input
          
          // Create a distinctive title by adding the timestamp
          const distinctTitle = `${extractedTitle} (${new Date().toLocaleTimeString()})`;
          
          // Create a properly structured card for both React and vanilla JS
          const newCard = {
            id: cardId,
            title: distinctTitle,
            category: getCategoryFromInput(input),
            source: 'News API',
            date: new Date().toISOString().split('T')[0],
            summary: explanation || 'Created from chat query',
            articles: formattedArticles,
            originalQuery: input,
            timestamp: new Date().toISOString()
          };
          console.debug('[ChatSidebar] handleSend: prepared newCard', newCard);
          
          // Try to add the card and only show success if it is actually added
          const addResult = onCreateCard(newCard);
          console.debug('[ChatSidebar] handleSend: onCreateCard result', addResult);
          // If onCreateCard returns false or undefined, do not show success
          if (addResult === false) {
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                {
                  id: prev.length + 1,
                  sender: 'AI',
                  text: `There was a problem creating the card. Please try again!`,
                  timestamp: new Date()
                },
              ]);
            }, 500);
          } else {
            setTimeout(() => {
              setMessages(prev => [
                ...prev,
                {
                  id: prev.length + 1,
                  sender: 'AI',
                  text: `✅ New card created with ${formattedArticles.length} article${formattedArticles.length !== 1 ? 's' : ''}!`,
                  timestamp: new Date()
                },
              ]);
            }, 500);
          }
        } else {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: prev.length + 1,
                sender: 'AI',
                text: `No news articles found for that topic. Try a different search!`,
                timestamp: new Date()
              },
            ]);
          }, 500);
        }
      } else {
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              id: prev.length + 1,
              sender: 'AI',
              text: `No news articles found for that topic. Try a different search!`,
              timestamp: new Date()
            },
          ]);
        }, 500);
      }
    } catch (error) {
      console.error('Error in chat request after all retries:', error);
      let errorMessage = "Sorry, I couldn't process your request. Grok may be unavailable or returned an error.";
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = `The request timed out. The server might be busy or Grok is not responding. Please try again later.`;
      } else if (error.message.includes('500')) {
        errorMessage = `Grok returned a 500 error. Please try again later.`;
      } else if (error.message.includes('429')) {
        errorMessage = `Grok rate limit reached. Please try again in a moment.`;
      }
      setMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'AI', text: errorMessage, timestamp: new Date() },
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
    <aside
      className="flex flex-col h-full w-full bg-gray-800 text-gray-200"
      aria-label="Chat with Grok"
    >
      <div className="p-2 bg-gray-900 text-gray-200 text-sm font-medium flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="material-icons text-base">smart_toy</span>
          Grok Assistant
        </span>
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white md:hidden"
            aria-label="Close sidebar"
          >
            <span className="material-icons text-base">close</span>
          </button>
        )}
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
    </aside>
  );
};

export default ChatSidebar;