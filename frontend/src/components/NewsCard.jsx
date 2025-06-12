import React, { memo } from 'react';
import { DateTime } from 'luxon';
import NewsTable from './NewsTable';
import '../styles/jira-card.css';

const NewsCard = memo(({ card, onPin, onRemove }) => {
  // Add basic validation to avoid app crashes when card structure is incorrect
  if (!card || typeof card !== 'object') {
    console.error('Invalid card passed to NewsCard:', card);
    return <div className="news-card mb-4 p-4 text-red-600">Error: Invalid card data</div>;
  }

  const { title = 'News Card', articles = [], timestamp = new Date().toISOString(), category = 'Other' } = card;
  
  // Check if articles is valid array
  if (!Array.isArray(articles)) {
    console.error('Invalid articles array in card:', card);
    return <div className="news-card mb-4 p-4 text-red-600">Error: Invalid article data</div>;
  }
  
  const getCategoryColor = (category) => {
    const colors = {
      Tech: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Entertainment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category] || colors.Other;
  };

  const [isMinimized, setIsMinimized] = React.useState(false);
  const [cardSize, setCardSize] = React.useState('normal'); // 'compact', 'normal', 'expanded'

  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const cycleSize = () => {
    const sizes = ['compact', 'normal', 'expanded'];
    const currentIndex = sizes.indexOf(cardSize);
    setCardSize(sizes[(currentIndex + 1) % sizes.length]);
  };

  return (
    <div className={`news-card mb-4 ${cardSize} ${isMinimized ? 'minimized' : ''}`} data-card-id={card.id}>
      <div className="news-card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="news-card-title">
              {title}
              <span className={`news-card-badge ml-2 ${getCategoryColor(category)}`}>
                {category}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={cycleSize} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Resize card"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
            <button 
              onClick={toggleMinimize} 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M12 4v16m-8-8h16" : "M20 12H4"} />
              </svg>
            </button>
            <button 
              onClick={() => onRemove(card.id)} 
              className="p-1 hover:bg-red-100 dark:hover:bg-red-700 rounded text-red-600 dark:text-red-400"
              title="Delete card"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {DateTime.fromISO(timestamp).toRelative()}
        </span>
      </div>
      
      <div className="news-card-content">
        <table className="news-card-table">
          <thead>
            <tr>
              <th>Title</th>
              <th className="hidden md:table-cell">Source</th>
              <th className="hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => {
              // Ensure we have a valid article object
              if (!article || typeof article !== 'object') {
                console.error('Invalid article item:', article);
                return null;
              }
              
              // Generate a reliable key
              const key = article.id || article.url || `article-${index}`;
              
              // Safely extract all properties with fallbacks
              const title = article.title || 'Untitled Article';
              const url = article.url || '#';
              const source = article.source?.name || article.source || 'Unknown';
              const dateStr = article.publishedAt || article.date || new Date().toISOString();
              
              // Create a safe date display with error handling
              let dateDisplay = 'Unknown date';
              try {
                dateDisplay = DateTime.fromISO(dateStr).toRelative();
              } catch (e) {
                console.warn('Date parsing failed for:', dateStr);
                dateDisplay = dateStr; 
              }
              
              return (
                <tr key={key}>
                  <td>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {title}
                    </a>
                  </td>
                  <td className="hidden md:table-cell text-gray-600 dark:text-gray-400">
                    {source}
                  </td>
                  <td className="hidden lg:table-cell text-gray-600 dark:text-gray-400">
                    {dateDisplay}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="news-card-actions">
        <button 
          onClick={() => typeof onPin === 'function' ? onPin(card.id) : console.warn('onPin is not a function')} 
          className="news-card-button news-card-button-primary"
        >
          <span className="material-icons text-xs mr-1" style={{fontSize: '14px', verticalAlign: 'text-bottom'}}>push_pin</span>
          Pin
        </button>
        <button 
          onClick={() => typeof onRemove === 'function' ? onRemove(card.id) : console.warn('onRemove is not a function')}
          className="news-card-button news-card-button-danger"
        >
          <span className="material-icons text-xs mr-1" style={{fontSize: '14px', verticalAlign: 'text-bottom'}}>close</span>
          Remove
        </button>
      </div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';

export default NewsCard;
