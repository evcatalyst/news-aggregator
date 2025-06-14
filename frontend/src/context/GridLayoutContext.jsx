import React, { createContext, useContext, useState, useEffect, useCallback, useReducer } from 'react';
import { gridAnalytics } from '../utils/GridAnalytics';

const GridLayoutContext = createContext();

// Safe Analytics wrapper
const trackEvent = (eventName, data) => {
  try {
    gridAnalytics?.trackEvent?.(eventName, data);
  } catch (error) {
    console.debug('[GridLayoutContext] Analytics error:', error);
  }
};

const DEFAULT_LAYOUTS = {
  desktop: {
    name: 'Desktop',
    grid: { 
      cols: 3, 
      rows: 2,
      positions: [
        { id: '1', name: 'top-left', row: 0, col: 0 },
        { id: '2', name: 'top-center', row: 0, col: 1 },
        { id: '3', name: 'top-right', row: 0, col: 2 },
        { id: '4', name: 'bottom-left', row: 1, col: 0 },
        { id: '5', name: 'bottom-center', row: 1, col: 1 },
        { id: '6', name: 'bottom-right', row: 1, col: 2 }
      ]
    }
  },
  tablet: {
    name: 'Tablet',
    grid: {
      cols: 2,
      rows: 3,
      positions: [
        { id: '1', name: 'top-left', row: 0, col: 0 },
        { id: '2', name: 'top-right', row: 0, col: 1 },
        { id: '3', name: 'middle-left', row: 1, col: 0 },
        { id: '4', name: 'middle-right', row: 1, col: 1 },
        { id: '5', name: 'bottom-left', row: 2, col: 0 },
        { id: '6', name: 'bottom-right', row: 2, col: 1 }
      ]
    }
  },
  mobile: {
    name: 'Mobile',
    grid: {
      cols: 1,
      rows: 6,
      positions: [
        { id: '1', name: 'first', row: 0, col: 0 },
        { id: '2', name: 'second', row: 1, col: 0 },
        { id: '3', name: 'third', row: 2, col: 0 },
        { id: '4', name: 'fourth', row: 3, col: 0 },
        { id: '5', name: 'fifth', row: 4, col: 0 },
        { id: '6', name: 'sixth', row: 5, col: 0 }
      ]
    }
  }
};

// Check for browser capabilities
const checkBrowserCapabilities = () => {
  return {
    cssGrid: CSS.supports('display', 'grid'),
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    draggable: 'draggable' in document.createElement('div'),
    resizeObserver: typeof ResizeObserver !== 'undefined',
    intersectionObserver: typeof IntersectionObserver !== 'undefined'
  };
};

export const GridLayoutProvider = ({ children }) => {
  const [activeLayout, setActiveLayout] = useState('desktop');
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS);
  const [customLayouts, setCustomLayouts] = useState([]);
  const [layoutContext, setLayoutContext] = useState('');
  const [capabilities] = useState(checkBrowserCapabilities());
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [error, setError] = useState(null);

  // Load saved layouts and preferences on mount
  useEffect(() => {
    try {
      performance.mark('init-start');
      console.info('Initializing GridLayoutContext');

      const savedLayouts = localStorage.getItem('gridLayouts');
      if (savedLayouts) {
        const parsed = JSON.parse(savedLayouts);
        console.info('Loading saved layouts', { count: parsed.length });
        setCustomLayouts(parsed);
      }

      const savedPreference = localStorage.getItem('preferredLayout');
      if (savedPreference) {
        console.info('Restoring preferred layout', { layout: savedPreference });
        setActiveLayout(savedPreference);
      }

      performance.mark('init-end');
      performance.measure('initialization', 'init-start', 'init-end');
      console.debug('Initialization complete', {
        duration: performance.getEntriesByName('initialization')[0].duration
      });
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }, []);

  // Update layout context when active layout changes
  useEffect(() => {
    if (layouts[activeLayout]) {
      performance.mark('context-update-start');
      
      const currentLayout = layouts[activeLayout];
      const positions = currentLayout.grid.positions
        .map(pos => `"${pos.name}" (${pos.id}): at row ${pos.row}, column ${pos.col}`)
        .join('\n');

      const context = `
Current grid layout "${currentLayout.name}":
${currentLayout.grid.cols}x${currentLayout.grid.rows} grid with the following positions:
${positions}

You can refer to positions by either their name or ID when placing cards.
Example commands:
- "move card to ${currentLayout.grid.positions[0].name}"
- "place card in ${currentLayout.grid.positions[Math.floor(currentLayout.grid.positions.length / 2)].name}"
      `.trim();

      setLayoutContext(context);
      
      performance.mark('context-update-end');
      performance.measure('contextUpdate', 'context-update-start', 'context-update-end');
      console.debug('Layout context updated', {
        duration: performance.getEntriesByName('contextUpdate')[0].duration
      });
    }
  }, [activeLayout, layouts]);

  // Handle viewport changes
  useEffect(() => {
    const handleResize = () => {
      performance.mark('viewport-change-start');
      const width = window.innerWidth;
      console.debug('Viewport changed', { width });

      let newLayout = 'desktop';
      if (width <= 768) {
        newLayout = 'tablet';
      }
      if (width <= 480) {
        newLayout = 'mobile';
      }

      if (newLayout !== activeLayout) {
        console.info('Switching layout', { from: activeLayout, to: newLayout });
        setActiveLayout(newLayout);
      }

      performance.mark('viewport-change-end');
      performance.measure('viewportChange', 'viewport-change-start', 'viewport-change-end');
      console.debug('Viewport adaptation complete', {
        duration: performance.getEntriesByName('viewportChange')[0].duration
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeLayout]);

  const processCommand = useCallback((command) => {
    console.debug('Processing command', { command });
    performance.mark('command-start');

    try {
      const moveMatch = command.match(/move card to ([\w-]+)/i);
      if (moveMatch) {
        const targetPosition = moveMatch[1].toLowerCase();
        const currentLayout = layouts[activeLayout];
        const position = currentLayout.grid.positions.find(
          pos => pos.name.toLowerCase() === targetPosition || pos.id === targetPosition
        );

        if (position) {
          console.info('Moving card', { to: position });
          // Actual move logic would go here
          const result = `Card moved to ${position.name}`;
          console.debug('Move successful', { position });
          return result;
        } else {
          console.warn('Invalid position requested', { position: targetPosition });
          return "Couldn't find that position";
        }
      }

      // Process reset layout command
      const resetMatch = command.match(/reset\s+(the\s+)?layout/i);
      if (resetMatch) {
        console.info('Reset layout command detected');
        const result = resetLayout();
        return result;
      }

      if (command.match(/save .* layout as/i)) {
        const layoutName = command.replace(/save .* layout as /i, '');
        const newLayout = {
          name: layoutName,
          grid: layouts[activeLayout].grid
        };
        
        const updatedLayouts = [...customLayouts, newLayout];
        setCustomLayouts(updatedLayouts);
        localStorage.setItem('gridLayouts', JSON.stringify(updatedLayouts));
        console.info('Layout saved', { name: layoutName });
        return `Layout saved as ${layoutName}`;
      }

      console.warn('Unrecognized command', { command });
      return 'Unrecognized command';
    } catch (error) {
      console.error('Error processing command:', error);
      return 'Error processing command';
    } finally {
      performance.mark('command-end');
      performance.measure('commandProcessing', 'command-start', 'command-end');
      console.debug('Command processing complete', {
        duration: performance.getEntriesByName('commandProcessing')[0].duration
      });
    }
  }, [activeLayout, layouts, customLayouts, resetLayout]);

  const updateLayout = useCallback((layout) => {
    performance.mark('layout-update-start');
    console.info('Updating layout', { layout });

    setActiveLayout(layout);
    localStorage.setItem('preferredLayout', layout);

    performance.mark('layout-update-end');
    performance.measure('layoutUpdate', 'layout-update-start', 'layout-update-end');
    console.debug('Layout update complete', {
      duration: performance.getEntriesByName('layoutUpdate')[0].duration
    });
  }, []);

  // Reset layout to default configuration
  const resetLayout = useCallback(() => {
    try {
      performance.mark('reset-layout-start');
      console.info('Resetting layout to defaults');

      // Reset to default layouts
      setLayouts(DEFAULT_LAYOUTS);
      setError(null);

      // Get current screen size and set appropriate default layout
      const width = window.innerWidth;
      let defaultLayout = 'desktop';
      if (width <= 768) {
        defaultLayout = 'tablet';
      }
      if (width <= 480) {
        defaultLayout = 'mobile';
      }

      // Set active layout based on current screen size
      setActiveLayout(defaultLayout);

      // Clear custom layouts
      setCustomLayouts([]);

      // Clear localStorage saved layouts
      if (capabilities.localStorage) {
        localStorage.removeItem('gridLayouts');
        localStorage.setItem('preferredLayout', defaultLayout);
      }

      // Track layout reset
      trackEvent('layout_reset', {
        to: defaultLayout,
        timestamp: new Date().toISOString()
      });

      performance.mark('reset-layout-end');
      performance.measure('resetLayout', 'reset-layout-start', 'reset-layout-end');

      console.debug('Layout reset complete', {
        duration: performance.getEntriesByName('resetLayout')[0].duration
      });

      return `Layout reset to default ${defaultLayout} configuration`;
    } catch (error) {
      console.error('[GridLayoutContext] Error during reset:', error);
      setError('Error resetting layout. Please try again.');
      return 'Something went wrong while resetting the layout. Please try again.';
    }
  }, [capabilities.localStorage]);

  // Progressive enhancement setup
  useEffect(() => {
    // Base functionality - always works
    document.documentElement.classList.add('grid-base');
    
    // Enhanced features based on browser capabilities
    if (capabilities.cssGrid) {
      document.documentElement.classList.add('grid-enhanced');
      setIsEnhanced(true);
    }
    
    // Track capabilities in analytics
    trackEvent('browser_capabilities', capabilities);
  }, [capabilities]);

  // Enhanced resize handling with ResizeObserver
  useEffect(() => {
    if (!capabilities.resizeObserver) {
      // Fallback to basic resize listener
      const handleBasicResize = () => {
        dispatch({
          type: actionTypes.SET_VIEWPORT,
          payload: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
      };
      
      window.addEventListener('resize', handleBasicResize);
      return () => window.removeEventListener('resize', handleBasicResize);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        gridAnalytics.trackEvent('viewport_change', { width, height });
        
        dispatch({
          type: actionTypes.SET_VIEWPORT,
          payload: { width, height }
        });
      }
    });

    resizeObserver.observe(document.documentElement);
    return () => resizeObserver.disconnect();
  }, [capabilities.resizeObserver]);

  // Enhanced persistence with fallback
  const saveLayout = useCallback((layout) => {
    if (capabilities.localStorage) {
      try {
        localStorage.setItem('gridLayouts', JSON.stringify(layout));
        return true;
      } catch (e) {
        console.warn('Failed to save layout to localStorage:', e);
      }
    }
    
    // Fallback to session storage or memory-only
    try {
      sessionStorage.setItem('gridLayouts', JSON.stringify(layout));
      return true;
    } catch (e) {
      console.warn('Failed to save layout to sessionStorage:', e);
      return false;
    }
  }, [capabilities.localStorage]);

  // Enhanced loading with intersection observer
  const handleCardVisibility = useCallback((entries) => {
    entries.forEach(entry => {
      const cardElement = entry.target;
      if (entry.isIntersecting) {
        gridAnalytics.trackEvent('card_visible', {
          cardId: cardElement.dataset.cardId,
          position: cardElement.dataset.position
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!capabilities.intersectionObserver) return;

    const observer = new IntersectionObserver(handleCardVisibility, {
      threshold: 0.5
    });

    document.querySelectorAll('.news-card').forEach(card => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, [capabilities.intersectionObserver, handleCardVisibility]);

  const value = {
    activeLayout,
    layouts,
    customLayouts,
    layoutContext,
    processCommand,
    updateLayout,
    resetLayout,
    error
  };

  const enhancedContextValue = {
    ...value,
    capabilities,
    isEnhanced,
    saveLayout
  };

  return (
    <GridLayoutContext.Provider value={enhancedContextValue}>
      {children}
    </GridLayoutContext.Provider>
  );
};

export const useGridLayout = () => {
  const context = useContext(GridLayoutContext);
  if (!context) {
    throw new Error('useGridLayout must be used within a GridLayoutProvider');
  }
  return context;
};
