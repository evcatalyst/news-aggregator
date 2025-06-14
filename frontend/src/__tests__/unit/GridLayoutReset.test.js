// File: /Users/matthew/Documents/projects/news-aggregator/frontend/src/__tests__/unit/GridLayoutReset.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GridLayoutProvider, useGridLayout } from '../../context/GridLayoutContext';
import { resetGridAnalytics } from '../../utils/GridAnalytics';

// Mock local storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    getAll: () => store,
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock analytics
global.gridAnalytics = {
  trackEvent: jest.fn(),
};

// Mock performance API
global.performance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => [{ duration: 100 }]),
};

// Simple test component to access the context
const TestComponent = ({ onReset }) => {
  const { activeLayout, layouts, resetLayout } = useGridLayout();

  const handleReset = () => {
    const result = resetLayout();
    if (onReset) onReset(result);
  };

  return (
    <div>
      <div data-testid="active-layout">{activeLayout}</div>
      <button data-testid="reset-button" onClick={handleReset}>Reset Layout</button>
    </div>
  );
};

describe('Grid Layout Reset Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    resetGridAnalytics();
  });

  test('reset layout function restores default layouts', () => {
    // Set up custom layouts in localStorage
    const customLayouts = [{ name: 'Custom', grid: { cols: 4, rows: 4, positions: [] } }];
    localStorage.setItem('gridLayouts', JSON.stringify(customLayouts));
    localStorage.setItem('preferredLayout', 'custom');

    const resetHandler = jest.fn();

    render(
      <GridLayoutProvider>
        <TestComponent onReset={resetHandler} />
      </GridLayoutProvider>
    );

    // Click reset button
    fireEvent.click(screen.getByTestId('reset-button'));

    // Verify reset was called
    expect(resetHandler).toHaveBeenCalled();

    // Verify localStorage was updated correctly
    expect(localStorage.removeItem).toHaveBeenCalledWith('gridLayouts');
    expect(localStorage.setItem).toHaveBeenCalledWith('preferredLayout', expect.any(String));
    
    // Verify analytics was called
    expect(gridAnalytics.trackEvent).toHaveBeenCalledWith('layout_reset', expect.any(Object));
  });
});
