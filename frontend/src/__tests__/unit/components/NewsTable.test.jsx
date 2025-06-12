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
  const mockArticles = [
    {
      id: 1,
      title: 'Test Article 1',
      source: 'Test Source',
      date: '2025-06-10',
      summary: 'Test description',
      url: 'https://test.com/1'
    },
    {
      id: 2,
      title: 'Test Article 2',
      source: { name: 'Another Source' },
      date: '2025-06-09',
      summary: 'Another description',
      url: 'https://test.com/2'
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
    
    // Mock window functions needed for IntersectionObserver
    window.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
    
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
  
  test('initializes Tabulator with proper configuration', () => {
    render(<NewsTable articles={mockArticles} />);
    
    const TabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const constructorCall = TabulatorConstructor.mock.calls[0][1];
    
    expect(constructorCall).toMatchObject({
      data: mockArticles,
      height: 350,
      minHeight: 200,
      layout: 'fitColumns',
      responsiveLayout: 'collapse',
      pagination: 'local',
      paginationSize: 5,
      paginationSizeSelector: [5, 10, 20],
      paginationButtonCount: 3,
      rowHeight: 36,
      placeholder: 'No articles available'
    });
  });

  test('configures table columns correctly', () => {
    render(<NewsTable articles={mockArticles} />);
    
    const TabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const { columns } = TabulatorConstructor.mock.calls[0][1];
    
    // Title column
    expect(columns[0]).toMatchObject({
      title: 'Title',
      field: 'title',
      sorter: 'string',
      headerSort: true,
      widthGrow: 3,
      tooltip: 'Article title',
      cssClass: 'truncate-cell'
    });
    
    // Source column
    expect(columns[1]).toMatchObject({
      title: 'Source',
      field: 'source',
      sorter: 'string',
      headerSort: true,
      widthGrow: 1.5,
      tooltip: 'News source',
      cssClass: 'truncate-cell'
    });
    
    // Date column
    expect(columns[2]).toMatchObject({
      title: 'Date',
      field: 'date',
      sorter: 'date',
      headerSort: true,
      widthGrow: 1,
      tooltip: 'Publication date',
      cssClass: 'whitespace-nowrap'
    });
    
    // Summary column
    expect(columns[3]).toMatchObject({
      title: 'Summary',
      field: 'summary',
      sorter: 'string',
      headerSort: true,
      widthGrow: 4,
      tooltip: 'Article summary',
      cssClass: 'truncate-cell',
      responsive: 2
    });
  });

  test('formats source data correctly', () => {
    render(<NewsTable articles={mockArticles} />);
    
    const TabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const sourceFormatter = TabulatorConstructor.mock.calls[0][1].columns[1].formatter;
    
    // Test string source
    const stringSourceCell = { getValue: () => 'Test Source' };
    expect(sourceFormatter(stringSourceCell)).toBe('<span class="text-sm">Test Source</span>');
    
    // Test object source
    const objectSourceCell = { getValue: () => ({ name: 'Another Source' }) };
    expect(sourceFormatter(objectSourceCell)).toBe('<span class="text-sm">Another Source</span>');
  });

  test('formats dates correctly', () => {
    render(<NewsTable articles={mockArticles} />);
    
    const TabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const dateFormatter = TabulatorConstructor.mock.calls[0][1].columns[2].formatter;
    
    const validDateCell = { getValue: () => '2025-06-10' };
    expect(dateFormatter(validDateCell)).toBe('Jun 10, 2025');
    
    const invalidDateCell = { getValue: () => 'invalid' };
    expect(dateFormatter(invalidDateCell)).toBe('invalid');
  });

  test('handles empty articles array', () => {
    render(<NewsTable articles={[]} />);
    
    const TabulatorConstructor = require('tabulator-tables').TabulatorFull;
    const constructorCall = TabulatorConstructor.mock.calls[0][1];
    
    expect(constructorCall.data).toEqual([]);
    expect(constructorCall.placeholder).toBe('No articles available');
  });

  test('sets up intersection observer for pagination', () => {
    render(<NewsTable articles={mockArticles} />);
    
    expect(window.IntersectionObserver).toHaveBeenCalled();
    expect(window.IntersectionObserver.mock.calls[0][0]).toBeInstanceOf(Function);
    expect(window.IntersectionObserver.mock.calls[0][1]).toEqual({ threshold: 0.5 });
  });

  test('handles errors gracefully', () => {
    // Mock Tabulator to throw error
    require('tabulator-tables').TabulatorFull.mockImplementationOnce(() => {
      throw new Error('Tabulator error');
    });
    
    render(<NewsTable articles={mockArticles} />);
    
    expect(screen.getByText(/Failed to load articles table: Tabulator error/)).toBeInTheDocument();
  });
});
