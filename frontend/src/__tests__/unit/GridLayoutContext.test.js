import React from 'react';
import { render, act } from '@testing-library/react';
import { GridLayoutContext, GridLayoutProvider } from '../../context/GridLayoutContext';

describe('GridLayoutContext', () => {
  const mockConsole = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  const mockPerformance = {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn()
  };

  beforeAll(() => {
    global.console = { ...console, ...mockConsole };
    global.performance = { ...performance, ...mockPerformance };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with correct default state', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    expect(contextValue.activeLayout).toBe('desktop');
    expect(contextValue.layouts).toBeDefined();
    expect(contextValue.customLayouts).toEqual([]);
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringMatching(/GridLayoutContext initialized/i)
    );
  });

  test('processes move command correctly', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    const result = contextValue.processCommand('move this card to top right');
    expect(result).toMatch(/moved/i);
    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Processing move command/i)
    );
  });

  test('handles viewport changes with performance logging', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    mockPerformance.getEntriesByName.mockReturnValue([{ duration: 50 }]);

    act(() => {
      global.innerWidth = 500;
      global.dispatchEvent(new Event('resize'));
    });

    expect(contextValue.activeLayout).toBe('mobile');
    expect(mockPerformance.mark).toHaveBeenCalledWith('layoutChange-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('layoutChange-end');
    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'layoutChange',
      'layoutChange-start',
      'layoutChange-end'
    );
    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Layout change completed in \d+ms/i)
    );
  });

  test('handles invalid commands gracefully', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    const result = contextValue.processCommand('invalid command');
    expect(result).toMatch(/unrecognized command/i);
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Invalid command received/i),
      expect.any(String)
    );
  });

  test('monitors layout transition performance', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    mockPerformance.getEntriesByName.mockReturnValue([{ duration: 30 }]);

    act(() => {
      contextValue.setActiveLayout('tablet');
    });

    expect(mockPerformance.mark).toHaveBeenCalledWith('layoutTransition-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('layoutTransition-end');
    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Layout transition completed/i),
      expect.any(Object)
    );
  });

  test('persists layouts to localStorage with logging', () => {
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });

    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    contextValue.processCommand('save this layout as Test Layout');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'gridLayouts',
      expect.any(String)
    );
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringMatching(/Layout saved successfully/i),
      expect.any(String)
    );
  });

  test('monitors memory usage during layout changes', () => {
    let contextValue;
    render(
      <GridLayoutProvider>
        <GridLayoutContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </GridLayoutContext.Consumer>
      </GridLayoutProvider>
    );

    const mockMemory = { usedJSHeapSize: 1000000 };
    global.performance.memory = mockMemory;

    act(() => {
      contextValue.processCommand('optimize layout');
    });

    expect(mockConsole.debug).toHaveBeenCalledWith(
      expect.stringMatching(/Memory usage/i),
      expect.any(Object)
    );
  });
});
