import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import NewsCard from '../../../components/NewsCard';

// Mock NewsTable since we're testing card UI
jest.mock('../../../components/NewsTable', () => {
  return function MockNewsTable({ articles }) {
    return <div data-testid="news-table" data-articles={JSON.stringify(articles)} />;
  };
});

describe('NewsCard Component', () => {
  const mockCard = {
    id: '2025-06-10-123',
    title: 'Latest Dog News',
    timestamp: '2025-06-10T22:23:02Z',
    summary: 'Comprehensive roundup of dog-related news and articles',
    articles: [
      {
        id: 1,
        title: 'How To Keep Your Dog Comfortable In Rainy Weather',
        source: 'Forbes',
        date: '2025-05-29',
        summary: 'Expert tips for rainy day dog care'
      },
      {
        id: 2,
        title: 'Best Dog Harnesses Review',
        source: 'Forbes',
        date: '2025-05-12',
        summary: 'Top-rated dog harnesses tested'
      }
    ]
  };

  const mockOnPin = jest.fn();
  const mockOnRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders card with all information properly formatted', () => {
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    // Check title
    expect(screen.getByText('Latest Dog News')).toBeInTheDocument();

    // Check formatted date (this needs to match the format in NewsCard)
    const dateString = new Date('2025-06-10T22:23:02Z').toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    expect(screen.getByText(dateString)).toBeInTheDocument();

    // Check summary
    expect(screen.getByText('Comprehensive roundup of dog-related news and articles')).toBeInTheDocument();

    // Check that NewsTable is rendered with articles
    const newsTable = screen.getByTestId('news-table');
    expect(JSON.parse(newsTable.dataset.articles)).toHaveLength(2);
  });

  test('calls onPin when pin button is clicked', () => {
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const pinButton = screen.getByTitle('Pin card');
    fireEvent.click(pinButton);

    expect(mockOnPin).toHaveBeenCalledWith(mockCard.id);
  });

  test('calls onRemove when remove button is clicked', () => {
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByTitle('Remove card');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith(mockCard.id);
  });

  test('renders card with proper structure and layout', () => {
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    // Header section
    const header = screen.getByRole('heading', { level: 3 });
    expect(header).toHaveClass('font-semibold', 'text-sm', 'truncate');
    expect(header).toHaveTextContent('Latest Dog News');

    // Check for compact header layout
    const headerContainer = header.closest('div[class*="bg-gray-50"]');
    expect(headerContainer).toHaveClass('px-3', 'py-2');

    // Time formatting
    const timestamp = screen.getByText(/Jun 10, \d{1,2}:\d{2}/);
    expect(timestamp).toHaveClass('text-xs');

    // Summary section
    const summary = screen.getByText('Comprehensive roundup of dog-related news and articles');
    expect(summary).toHaveClass('text-xs', 'truncate');

    // Action buttons
    const pinButton = screen.getByTitle('Pin card');
    const removeButton = screen.getByTitle('Remove card');
    expect(pinButton).toHaveClass('text-gray-400', 'hover:text-blue-500');
    expect(removeButton).toHaveClass('text-gray-400', 'hover:text-red-500');

    // NewsTable integration
    const newsTable = screen.getByTestId('news-table');
    const articles = JSON.parse(newsTable.dataset.articles);
    expect(articles).toHaveLength(2);
  });

  test('handles extremely long title with truncation', () => {
    const longTitleCard = {
      ...mockCard,
      title: 'This is an extremely long title that should be truncated because it is too long to fit in the header area and would break the layout if not properly truncated with ellipsis'.repeat(2)
    };

    render(
      <NewsCard
        card={longTitleCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const header = screen.getByRole('heading', { level: 3 });
    expect(header).toHaveClass('truncate');
    
    const headerStyle = window.getComputedStyle(header);
    expect(headerStyle.overflow).toBe('hidden');
    expect(headerStyle.textOverflow).toBe('ellipsis');
  });

  test('properly truncates long summary text', () => {
    const longSummaryCard = {
      ...mockCard,
      summary: 'This is an extremely long summary text that needs to be truncated properly to maintain the compact layout of the card. It should not expand the card height or cause any visual disruption to the layout.'.repeat(3)
    };

    render(
      <NewsCard
        card={longSummaryCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const summary = screen.getByText(longSummaryCard.summary);
    expect(summary).toHaveClass('truncate');
  });

  test('buttons have proper accessibility attributes', () => {
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const pinButton = screen.getByRole('button', { name: /pin card/i });
    const removeButton = screen.getByRole('button', { name: /remove card/i });

    expect(pinButton).toHaveAttribute('title', 'Pin card');
    expect(pinButton).toHaveAttribute('aria-label', 'Pin card');
    expect(removeButton).toHaveAttribute('title', 'Remove card');
    expect(removeButton).toHaveAttribute('aria-label', 'Remove card');
  });

  test('handles missing summary gracefully', () => {
    const cardWithoutSummary = { ...mockCard, summary: undefined };
    
    render(
      <NewsCard
        card={cardWithoutSummary}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2); // Should still show action buttons
  });

  test('maintains compact layout with minimal content', () => {
    const minimalCard = {
      id: 'minimal-123',
      title: 'Minimal Card',
      timestamp: '2025-06-10T22:23:02Z',
      articles: []
    };

    render(
      <NewsCard
        card={minimalCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const card = screen.getByText('Minimal Card').closest('[data-card-id]');
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden');
  });

  test('dark mode classes are properly applied', () => {
    document.documentElement.classList.add('dark');
    
    render(
      <NewsCard
        card={mockCard}
        onPin={mockOnPin}
        onRemove={mockOnRemove}
      />
    );

    const card = screen.getByText('Latest Dog News').closest('[data-card-id]');
    const header = screen.getByRole('heading', { level: 3 }).closest('div');
    
    expect(card).toHaveClass('dark:bg-gray-800');
    expect(header).toHaveClass('dark:bg-gray-900', 'dark:border-gray-700');

    document.documentElement.classList.remove('dark');
  });
});
