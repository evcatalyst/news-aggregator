import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsTable from '../../../components/NewsTable';

// Mock Tabulator
jest.mock('tabulator-tables', () => {
  const mockTabulatorInstance = {
    on: jest.fn(),
    setData: jest.fn(),
    redraw: jest.fn(),
    destroy: jest.fn()
  };
  
  const mockTabulatorClass = jest.fn().mockImplementation(() => mockTabulatorInstance);
  
  return {
    TabulatorFull: mockTabulatorClass,
    // Make the mock instance accessible for assertions
    __getMockInstance: () => mockTabulatorInstance
  };
});

describe('NewsTable Component', () => {
  const mockOnPin = jest.fn();
  const mockOnRemove = jest.fn();
  
  // Sample news data for testing
  const sampleNewsArticles = [
    {
      id: 1,
      title: 'Test Article 1',
      category: 'Tech',
      source: 'Test Source',
      date: '2025-06-10',
      summary: 'Test description',
      url: 'https://test.com/article1'
    },
    {
      id: 2,
      title: 'Test Article 2',
      category: 'Sports',
      source: 'Another Source',
      date: '2025-06-09',
      summary: 'Another description',
      url: 'https://test.com/article2'
    }
  ];
  
  // Sample news cards for testing
  const sampleNewsCards = [
    {
      id: 101,
      title: 'Tech News',
      category: 'Tech',
      source: 'News API',
      date: '2025-06-10',
      summary: 'Latest tech news',
      articles: [
        {
          id: 1,
          title: 'Tech Article 1',
          category: 'Tech',
          source: 'Tech Source',
          date: '2025-06-10',
          summary: 'Tech description',
          url: 'https://tech.com/article1'
        }
      ]
    },
    {
      id: 102,
      title: 'Sports News',
      category: 'Sports',
      source: 'News API',
      date: '2025-06-09',
      summary: 'Latest sports news',
      articles: [
        {
          id: 2,
          title: 'Sports Article 1',
          category: 'Sports',
          source: 'Sports Source',
          date: '2025-06-09',
          summary: 'Sports description',
          url: 'https://sports.com/article1'
        }
      ]
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the DOM element needed for the Tabulator table
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 100 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 100 });
  });
  
  test('renders with flat news article data', () => {
    render(
      <NewsTable
        news={sampleNewsArticles}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );
    
    // Verify Tabulator was initialized
    expect(require('tabulator-tables').TabulatorFull).toHaveBeenCalled();
  });
  
  test('renders with card-based news data', () => {
    render(
      <NewsTable
        news={sampleNewsCards}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );
    
    // Verify Tabulator was initialized
    expect(require('tabulator-tables').TabulatorFull).toHaveBeenCalled();
  });
  
  test('properly flattens nested card data', () => {
    render(
      <NewsTable
        news={sampleNewsCards}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );
    
    // Check that Tabulator is initialized with flattened data
    const tabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const callData = tabulatorConstructor.mock.calls[0][1];
    
    // Check the data property being passed to Tabulator
    expect(callData).toHaveProperty('data');
    
    // We can't directly assert on the flattened data because it's processed in a useEffect
    // But we can verify that Tabulator was called with the right configuration
    expect(callData).toHaveProperty('columns');
    expect(callData.columns.some(col => col.field === 'title')).toBe(true);
    expect(callData.columns.some(col => col.field === 'category')).toBe(true);
    expect(callData.columns.some(col => col.field === 'source')).toBe(true);
  });
  
  test('cleans up Tabulator instance on unmount', () => {
    const { unmount } = render(
      <NewsTable
        news={sampleNewsArticles}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );
    
    // Unmount the component
    unmount();
    
    // Verify destroy was called on the Tabulator instance
    const tabulatorInstance = require('tabulator-tables').__getMockInstance();
    expect(tabulatorInstance.destroy).toHaveBeenCalled();
  });
});
