import React, { useState, useEffect } from 'react';
import { gridAnalytics } from '../utils/GridAnalytics';
import { useGridLayout } from '../context/GridLayoutContext';

const GridLayoutManager = ({ onLayoutChange }) => {
  const [layouts, setLayouts] = useState([]);
  const [activeLayout, setActiveLayout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const { resetLayout } = useGridLayout();

  // Get viewport dimensions for responsive layouts
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Monitor viewport changes
  useEffect(() => {
    const handleResize = () => {
      const newViewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setViewport(newViewport);
      gridAnalytics.trackEvent('viewport_change', newViewport);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Default layouts based on viewport size
  const getDefaultLayout = () => {
    if (viewport.width < 768) {
      return {
        name: 'Mobile Stack',
        grid: {
          cols: 1,
          rows: 4,
          positions: [
            { id: 'top', name: 'Top Card', row: 1, col: 1 },
            { id: 'middle', name: 'Middle Area', row: 2, col: 1 },
            { id: 'lower', name: 'Lower Section', row: 3, col: 1 },
            { id: 'bottom', name: 'Bottom Area', row: 4, col: 1 }
          ]
        }
      };
    }
    if (viewport.width < 1024) {
      return {
        name: 'Tablet Grid',
        grid: {
          cols: 2,
          rows: 3,
          positions: [
            { id: 'main', name: 'Main Content', row: 1, col: 1, colspan: 2 },
            { id: 'left-side', name: 'Left Side', row: 2, col: 1 },
            { id: 'right-side', name: 'Right Side', row: 2, col: 2 },
            { id: 'bottom-left', name: 'Bottom Left', row: 3, col: 1 },
            { id: 'bottom-right', name: 'Bottom Right', row: 3, col: 2 }
          ]
        }
      };
    }
    return {
      name: 'Desktop Grid',
      grid: {
        cols: 3,
        rows: 3,
        positions: [
          { id: 'top-left', name: 'Top Left', row: 1, col: 1 },
          { id: 'top-center', name: 'Top Center', row: 1, col: 2 },
          { id: 'top-right', name: 'Top Right', row: 1, col: 3 },
          { id: 'middle-left', name: 'Middle Left', row: 2, col: 1 },
          { id: 'middle-center', name: 'Middle Center', row: 2, col: 2 },
          { id: 'middle-right', name: 'Middle Right', row: 2, col: 3 },
          { id: 'bottom-left', name: 'Bottom Left', row: 3, col: 1 },
          { id: 'bottom-center', name: 'Bottom Center', row: 3, col: 2 },
          { id: 'bottom-right', name: 'Bottom Right', row: 3, col: 3 }
        ]
      }
    };
  };

  const [customLayout, setCustomLayout] = useState({
    name: '',
    grid: {
      cols: 3,
      rows: 3,
      positions: []
    }
  });

  // Load layouts from localStorage with error handling
  useEffect(() => {
    try {
      const savedLayouts = localStorage.getItem('gridLayouts');
      if (savedLayouts) {
        const parsed = JSON.parse(savedLayouts);
        setLayouts(parsed);
        gridAnalytics.trackEvent('layouts_loaded', { count: parsed.length });
      } else {
        const defaultLayout = getDefaultLayout();
        setLayouts([defaultLayout]);
        setActiveLayout(defaultLayout);
        gridAnalytics.trackEvent('default_layout_applied');
      }
    } catch (error) {
      console.error('Error loading layouts:', error);
      gridAnalytics.trackEvent('layout_load_error', { error: error.message });
      const defaultLayout = getDefaultLayout();
      setLayouts([defaultLayout]);
      setActiveLayout(defaultLayout);
    }
  }, [viewport.width]);

  // Drag and drop handlers
  const handleDragStart = (event, cardId) => {
    event.dataTransfer.setData('cardId', cardId);
    setIsDragging(true);
    gridAnalytics.trackEvent('drag_start', { cardId });
  };

  const handleDrop = (event, position) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('cardId');
    setIsDragging(false);
    
    // Update card position
    const updatedLayout = {
      ...activeLayout,
      grid: {
        ...activeLayout.grid,
        positions: activeLayout.grid.positions.map(pos => 
          pos.id === position.id ? { ...pos, cardId } : pos
        )
      }
    };
    
    setActiveLayout(updatedLayout);
    onLayoutChange(updatedLayout);
    gridAnalytics.trackEvent('card_dropped', { cardId, position: position.id });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const saveLayout = (layout) => {
    try {
      performance.mark('save-layout-start');
      
      const updatedLayouts = [...layouts, layout];
      setLayouts(updatedLayouts);
      localStorage.setItem('gridLayouts', JSON.stringify(updatedLayouts));
      onLayoutChange(layout);
      
      performance.mark('save-layout-end');
      performance.measure('saveLayout', 'save-layout-start', 'save-layout-end');
      
      const duration = performance.getEntriesByName('saveLayout')[0].duration;
      gridAnalytics.trackEvent('layout_saved', { 
        name: layout.name,
        duration,
        gridSize: `${layout.grid.cols}x${layout.grid.rows}`
      });
    } catch (error) {
      console.error('Error saving layout:', error);
      gridAnalytics.trackEvent('layout_save_error', { error: error.message });
    }
  };

  // Handle layout reset
  const handleResetLayout = () => {
    try {
      setError(null);
      const result = resetLayout();
      console.info('Layout reset requested:', result);
      
      // Update local state
      const savedLayouts = localStorage.getItem('gridLayouts');
      setLayouts(savedLayouts ? JSON.parse(savedLayouts) : []);
      setActiveLayout(localStorage.getItem('preferredLayout') || 'desktop');
      
      // Show success message
      setError({ type: 'success', message: result });
    } catch (err) {
      console.error('Error resetting layout:', err);
      setError({ type: 'error', message: 'Failed to reset layout. Please try again.' });
    }
  };

  return (
    <div className="grid-layout-manager p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Grid Layout Manager</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEditing ? 'Save Layout' : 'Create New Layout'}
        </button>
      </div>

      {error && (
        <div className={`mb-4 p-3 rounded-md ${
          error.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {error.message}
        </div>
      )}

      {/* Layout List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {layouts.map((layout) => (
          <div
            key={layout.name}
            className={`p-4 border rounded cursor-pointer ${
              activeLayout?.name === layout.name ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => {
              setActiveLayout(layout);
              onLayoutChange(layout);
            }}
          >
            <h3 className="font-medium mb-2">{layout.name}</h3>
            <div className="text-sm text-gray-500">
              {layout.grid.cols}x{layout.grid.rows} Grid
            </div>
            {/* Visual grid preview */}
            <div
              className="grid gap-1 mt-2"
              style={{
                gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
                gridTemplateRows: `repeat(${layout.grid.rows}, 20px)`
              }}
            >
              {layout.grid.positions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-blue-100 dark:bg-blue-800"
                  style={{
                    gridColumn: `${pos.col} / span ${pos.colspan || 1}`,
                    gridRow: `${pos.row} / span ${pos.rowspan || 1}`
                  }}
                  title={pos.name}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Layout Editor */}
      {isEditing && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-4">Create New Layout</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Layout Name"
              className="w-full p-2 border rounded"
              value={customLayout.name}
              onChange={(e) => setCustomLayout({ ...customLayout, name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Columns"
                className="p-2 border rounded"
                value={customLayout.grid.cols}
                onChange={(e) => setCustomLayout({
                  ...customLayout,
                  grid: { ...customLayout.grid, cols: parseInt(e.target.value) }
                })}
              />
              <input
                type="number"
                placeholder="Rows"
                className="p-2 border rounded"
                value={customLayout.grid.rows}
                onChange={(e) => setCustomLayout({
                  ...customLayout,
                  grid: { ...customLayout.grid, rows: parseInt(e.target.value) }
                })}
              />
            </div>
            
            {/* Position Editor */}
            <div className="space-y-2">
              {customLayout.grid.positions.map((pos, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Position Name"
                    className="flex-1 p-2 border rounded"
                    value={pos.name}
                    onChange={(e) => {
                      const newPositions = [...customLayout.grid.positions];
                      newPositions[idx] = { ...pos, name: e.target.value };
                      setCustomLayout({
                        ...customLayout,
                        grid: { ...customLayout.grid, positions: newPositions }
                      });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newPositions = customLayout.grid.positions.filter((_, i) => i !== idx);
                      setCustomLayout({
                        ...customLayout,
                        grid: { ...customLayout.grid, positions: newPositions }
                      });
                    }}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newPos = {
                    id: `pos-${customLayout.grid.positions.length + 1}`,
                    name: '',
                    row: 1,
                    col: 1
                  };
                  setCustomLayout({
                    ...customLayout,
                    grid: {
                      ...customLayout.grid,
                      positions: [...customLayout.grid.positions, newPos]
                    }
                  });
                }}
                className="w-full p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridLayoutManager;
