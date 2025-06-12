import React, { useState } from 'react';
import { DateTime } from 'luxon';
import NewsCard from './NewsCard';

const NewsGrid = ({ news, onPin, onRemove }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil((news?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleCards = news?.slice(startIndex, startIndex + itemsPerPage) || [];

  // Format date using Luxon
  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    try {
      return DateTime.fromISO(dateStr).toRelative();
    } catch (e) {
      return dateStr;
    }
  };

  // Debug incoming news array
  console.log(`NewsGrid received ${news?.length || 0} items:`, 
    news?.map(item => ({
      id: item.id, 
      title: item.title?.substring(0, 20), 
      hasArticles: Boolean(item.articles?.length)
    })));

  if (!news?.length) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No news cards available
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {visibleCards.map((card) => (
          <NewsCard 
            key={card.id}
            card={card}
            onPin={() => onPin(card.id)}
            onRemove={() => onRemove(card.id)}
          />
        ))}
        {visibleCards.length === 0 && (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 p-8">
            No news cards available. Try searching for some topics!
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsGrid;
