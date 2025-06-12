import { useState, useEffect } from 'react';
import ChatSidebar from './components/ChatSidebar';
import NewsCard from './components/NewsCard';
import NewsGrid from './components/NewsGrid';
import RebuildButton from './components/RebuildButton';
import './styles/chat-sidebar-clean.css';

const App = () => {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [pinnedArticles, setPinnedArticles] = useState([]);
  
  // Initialize AppState if it doesn't exist
  if (!window.AppState) {
    window.AppState = {
      searchResults: [],
      updateUIState: () => {}
    };
  }

  // Fetch live news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('http://localhost:3000/news');
        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          // Create a single card with all initial articles
          const initialCard = {
            id: Date.now().toString(),
            title: 'Latest News',
            category: 'General',
            timestamp: new Date().toISOString(),
            articles: data.data.map(article => ({
              title: article.title || 'Untitled Article',
              url: article.url || '#',
              source: article.source?.name || 'News',
              date: article.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              summary: article.description || ''
            })).filter(a => a.title && a.url)
          };
          
          setArticles([initialCard]);
          window.AppState.searchResults = [initialCard];
          
          if (typeof window.updateUIState === 'function') {
            window.updateUIState();
          }
        } else {
          setArticles([]);
          window.AppState.searchResults = [];
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNews();
    
    // Set up dark mode listener
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => setDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);
  
  // Helper function to determine category from article content
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
  
  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // News management handlers
  const handleCreateCard = (card) => {
    console.log('handleCreateCard called with:', card);
    
    // Basic validation
    if (!card?.articles?.length) {
      console.log('Card validation failed: No articles found');
      return false;
    }

    console.log(`Card has ${card.articles.length} articles`);

    // Add to state
    setArticles(prev => {
      console.log('Current articles:', prev);
      const newArticles = [...prev, card];
      console.log('New articles state will be:', newArticles);
      return newArticles;
    });

    // Update AppState
    if (window.AppState?.searchResults) {
      window.AppState.searchResults.push({
        id: card.id,
        title: card.title,
        articles: card.articles
      });
      console.log('Updated AppState.searchResults');
      
      if (typeof window.updateUIState === 'function') {
        window.updateUIState();
      }
    }

    console.log('Created card successfully:', card);
    return true;
  };
  const handleUpdateCard = (id, updates) =>
    setArticles(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
  const handleDeleteCard = id => setArticles(prev => prev.filter(item => item.id !== id));
  const handlePin = (id) => {
    // Check if article is already pinned
    if (pinnedArticles.some(item => item.id === id)) {
      return;
    }
    
    // Find the article in news array
    const articleToPin = articles.find(item => item.id === id);
    if (articleToPin) {
      setPinnedArticles(prev => [...prev, articleToPin]);
    }
  };
  
  const handleRemove = (id) => {
    // Remove from pinned articles if pinned
    setPinnedArticles(prev => prev.filter(item => item.id !== id));
    // Remove from main articles list
    setArticles(prev => prev.filter(item => item.id !== id));
  };

  // Toggle dark mode manually
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Debug article state before rendering
  console.log(`Rendering with ${articles.length} articles:`, 
    articles.map(a => ({id: a.id, title: a.title, articleCount: a.articles?.length || 0})));

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 w-80 h-full transition-transform duration-300 ease-in-out z-30`}>
        <ChatSidebar
          isOpen={true}
          toggleSidebar={() => setIsSidebarOpen(false)}
          onCreateCard={handleCreateCard}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 shadow-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span className="material-icons">menu</span>
            </button>
            <h1 className="text-lg font-medium text-gray-800 dark:text-gray-200 ml-2">News Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <RebuildButton />
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="material-icons text-gray-600 dark:text-gray-400">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          {/* Pinned Articles */}
          {pinnedArticles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                <span className="material-icons text-sm mr-1">push_pin</span>
                Pinned Articles
              </h2>
              <NewsGrid news={pinnedArticles} onPin={handlePin} onRemove={handleRemove} />
            </div>
          )}

          {/* Main Content */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading news...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 p-4 rounded-lg">
                <p className="font-medium">Error</p>
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : articles.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center p-8">
                No news articles yet. Try searching for a topic!
              </p>
            ) : (
              <NewsGrid news={articles} onPin={handlePin} onRemove={handleRemove} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
