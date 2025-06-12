import { useEffect, useRef } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import '../styles/table-custom.css';
import '../styles/tabulator-mobile.css';
import { DateTime } from 'luxon';

const NewsTable = ({ articles }) => {
  const tableRef = useRef(null);
  const tableInstance = useRef(null);

  useEffect(() => {
    if (!tableRef.current || !Array.isArray(articles)) return;

    try {
      // Create Tabulator instance with improved density settings
      tableInstance.current = new Tabulator(tableRef.current, {
        data: articles,
        layout: 'fitColumns',
        responsiveLayout: 'collapse',
        height: 350, // Increased height to ensure pagination visibility
        minHeight: 200,
        pagination: 'local',
        paginationSize: 5,
        paginationSizeSelector: [5, 10, 20],
        paginationButtonCount: 3, // Show fewer pagination buttons for density
        columns: [
          {
            title: 'Title',
            field: 'title',
            sorter: 'string',
            headerSort: true,
            widthGrow: 3,
            tooltip: 'Article title',
            cssClass: 'truncate-cell', // Custom class for truncation
            formatter: function(cell) {
              const url = cell.getRow().getData().url || '#';
              return `<a href="${url}" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm">${cell.getValue()}</a>`;
            }
          },
          {
            title: 'Source',
            field: 'source',
            sorter: 'string',
            headerSort: true,
            widthGrow: 1.5,
            tooltip: 'News source',
            cssClass: 'truncate-cell',
            formatter: function(cell) {
              const value = cell.getValue();
              return `<span class="text-sm">${typeof value === 'object' ? value?.name || '' : value}</span>`;
            }
          },
          {
            title: 'Date',
            field: 'date',
            sorter: 'date',
            headerSort: true,
            widthGrow: 1,
            tooltip: 'Publication date',
            cssClass: 'whitespace-nowrap',
            formatter: function(cell) {
              const date = cell.getValue();
              if (!date) return '';
              try {
                return new Date(date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              } catch (e) {
                return date;
              }
            }
          },
          {
            title: 'Summary',
            field: 'summary',
            sorter: 'string',
            headerSort: true,
            widthGrow: 4,
            tooltip: 'Article summary',
            cssClass: 'truncate-cell',
            responsive: 2, // Hide on smaller screens
            formatter: function(cell) {
              return `<span class="text-sm text-gray-600 dark:text-gray-300">${cell.getValue() || ''}</span>`;
            }
          }
        ],
        rowHeight: 36, // Compact row height
        placeholder: 'No articles available'
      });

      // Add intersection observer for pagination visibility
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const footerElement = entry.target;
            if (!entry.isIntersecting) {
              // Add padding when pagination is not fully visible
              tableRef.current.style.marginBottom = '2rem';
            } else {
              tableRef.current.style.marginBottom = '0';
            }
          });
        },
        { threshold: 0.5 }
      );

      // Observe the pagination footer after a small delay to ensure it's rendered
      setTimeout(() => {
        const footer = tableRef.current.querySelector('.tabulator-footer');
        if (footer) {
          observer.observe(footer);
        }
      }, 100);
    } catch (error) {
      console.error('[NewsTable] Error initializing Tabulator:', error);
      // Show error state
      if (tableRef.current) {
        tableRef.current.innerHTML = `
          <div class="text-sm text-red-600 dark:text-red-400 p-2">
            Failed to load articles table: ${error.message}
          </div>
        `;
      }
    }

    return () => {
      if (tableInstance.current?.destroy) {
        try {
          tableInstance.current.destroy();
        } catch (error) {
          console.debug('[NewsTable] Error destroying Tabulator:', error);
        }
      }
    };
  }, [articles]);

  const tableOptions = {
    layout: "fitColumns",
    height: "400px", // Increased height for better visibility
    placeholder: "No news articles available",
    responsiveLayout: "collapse",
    columns: [
      {
        title: "Title",
        field: "title",
        formatter: function(cell) {
          const value = cell.getValue();
          const source = cell.getRow().getData().source?.name || 'Unknown';
          cell.getElement().setAttribute('data-title', `${value}\nSource: ${source}`);
          return value;
        },
        widthGrow: 3,
        headerSort: true,
        tooltip: true
      },
      {
        title: "Source",
        field: "source.name",
        formatter: function(cell) {
          const value = cell.getValue() || 'Unknown';
          return `<span class="font-medium text-gray-700 dark:text-gray-300">${value}</span>`;
        },
        widthGrow: 1,
        headerSort: true
      },
      {
        title: "Date",
        field: "publishedAt",
        formatter: function(cell) {
          const value = cell.getValue();
          const formatted = DateTime.fromISO(value).toRelative();
          cell.getElement().setAttribute('data-title', DateTime.fromISO(value).toFormat('MMMM dd, yyyy HH:mm'));
          return formatted;
        },
        widthGrow: 1,
        headerSort: true
      }
    ],
    rowFormatter: function(row) {
      const el = row.getElement();
      el.classList.add(
        'transition-all',
        'duration-200',
        'hover:bg-gray-50',
        'dark:hover:bg-gray-800',
        'cursor-pointer'
      );
      
      // Add click handler for the row
      el.addEventListener('click', () => {
        const data = row.getData();
        if (data.url) {
          window.open(data.url, '_blank');
        }
      });
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg bg-transparent">
      <div ref={tableRef} className="w-full min-w-[300px] tabulator-compact" />
    </div>
  );
};

export default NewsTable;
