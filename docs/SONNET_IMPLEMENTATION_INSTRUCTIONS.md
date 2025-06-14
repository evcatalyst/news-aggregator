# Implementation Instructions for Sonnet 3.5

## Project: Adaptive Grid System for News Aggregator

This document provides structured implementation instructions for the adaptive grid system with natural language command capabilities.

### Overview

Your task is to implement an adaptive grid system for news content management with the following key features:

1. Dynamic layout switching based on viewport size
2. Natural language command processing for card positioning
3. Visual layout management interface
4. Layout persistence across sessions

### Core Components to Implement

## 1. GridLayoutContext.jsx

This provides centralized state management and command processing for the grid system.

```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create the context
const GridLayoutContext = createContext();

// Define initial state
const initialState = {
  layouts: {
    mobile: {
      name: "Mobile Stack",
      grid: { cols: 1, rows: 4 },
      positions: [
        { id: "top", name: "Top Card", row: 1, col: 1 },
        { id: "middle", name: "Middle Area", row: 2, col: 1 },
        { id: "lower", name: "Lower Section", row: 3, col: 1 },
        { id: "bottom", name: "Bottom Area", row: 4, col: 1 }
      ]
    },
    tablet: {
      name: "Tablet Grid",
      grid: { cols: 2, rows: 3 },
      positions: [
        { id: "main", name: "Main Content", row: 1, col: 1, colspan: 2 },
        { id: "left-side", name: "Left Side", row: 2, col: 1 },
        { id: "right-side", name: "Right Side", row: 2, col: 2 },
        { id: "bottom-left", name: "Bottom Left", row: 3, col: 1 },
        { id: "bottom-right", name: "Bottom Right", row: 3, col: 2 }
      ]
    },
    desktop: {
      name: "Desktop Grid",
      grid: { cols: 3, rows: 3 },
      positions: [
        { id: "top-left", name: "Top Left", row: 1, col: 1 },
        { id: "top-center", name: "Top Center", row: 1, col: 2 },
        { id: "top-right", name: "Top Right", row: 1, col: 3 },
        { id: "middle-left", name: "Middle Left", row: 2, col: 1 },
        { id: "middle-center", name: "Middle Center", row: 2, col: 2 },
        { id: "middle-right", name: "Middle Right", row: 2, col: 3 },
        { id: "bottom-left", name: "Bottom Left", row: 3, col: 1 },
        { id: "bottom-center", name: "Bottom Center", row: 3, col: 2 },
        { id: "bottom-right", name: "Bottom Right", row: 3, col: 3 }
      ]
    }
  },
  activeLayout: "desktop",
  activeCard: null,
  customLayouts: [],
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight
  }
};

// Define action types
const actionTypes = {
  SET_ACTIVE_LAYOUT: 'SET_ACTIVE_LAYOUT',
  SET_ACTIVE_CARD: 'SET_ACTIVE_CARD',
  MOVE_CARD: 'MOVE_CARD',
  RESIZE_CARD: 'RESIZE_CARD',
  SAVE_LAYOUT: 'SAVE_LAYOUT',
  SET_VIEWPORT: 'SET_VIEWPORT'
};

// Define reducer
const gridReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_ACTIVE_LAYOUT:
      return { ...state, activeLayout: action.payload };
    case actionTypes.SET_ACTIVE_CARD:
      return { ...state, activeCard: action.payload };
    case actionTypes.MOVE_CARD:
      // Implement card movement logic
      return state;
    case actionTypes.RESIZE_CARD:
      // Implement card resizing logic
      return state;
    case actionTypes.SAVE_LAYOUT:
      // Logic to save a custom layout
      const newCustomLayouts = [...state.customLayouts, action.payload];
      return { ...state, customLayouts: newCustomLayouts };
    case actionTypes.SET_VIEWPORT:
      return { ...state, viewport: action.payload };
    default:
      return state;
  }
};

// Position mapping system - maps natural language to grid coordinates
const positionMap = {
  'top left': { row: 1, col: 1 },
  'top center': { row: 1, col: 2 },
  'top right': { row: 1, col: 3 },
  'middle left': { row: 2, col: 1 },
  'center': { row: 2, col: 2 },
  'middle center': { row: 2, col: 2 },
  'middle right': { row: 2, col: 3 },
  'bottom left': { row: 3, col: 1 },
  'bottom center': { row: 3, col: 2 },
  'bottom right': { row: 3, col: 3 }
};

// Natural language command patterns
const commands = {
  move: /(move|put|place)\s+(the\s+)?(new|last|latest|this)?\s*card\s+(to\s+|in\s+|at\s+)?([a-zA-Z-\s]+)/i,
  resize: /(make|set)\s+(the\s+)?(new|last|latest|this)?\s*card\s+(to\s+|as\s+)?\s*(larger|smaller|bigger|wider|taller)/i,
  saveLayout: /(save|store)\s+(this\s+)?layout(\s+as\s+|\s+with\s+name\s+|\s+named\s+)["']?([^"']+)["']?/i,
  switchLayout: /(switch|change|use)\s+(to\s+)?(the\s+)?["']?([^"']+)["']?\s+layout/i
};

// Provider component
export const GridLayoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gridReducer, initialState);
  
  // Monitor viewport changes
  useEffect(() => {
    const handleResize = () => {
      dispatch({
        type: actionTypes.SET_VIEWPORT, 
        payload: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
      
      // Auto-select appropriate layout based on viewport
      if (window.innerWidth < 768) {
        dispatch({ type: actionTypes.SET_ACTIVE_LAYOUT, payload: 'mobile' });
      } else if (window.innerWidth < 1024) {
        dispatch({ type: actionTypes.SET_ACTIVE_LAYOUT, payload: 'tablet' });
      } else {
        dispatch({ type: actionTypes.SET_ACTIVE_LAYOUT, payload: 'desktop' });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Load saved layouts from localStorage
  useEffect(() => {
    const savedLayouts = localStorage.getItem('gridLayouts');
    if (savedLayouts) {
      // Handle loading saved layouts
    }
  }, []);
  
  // Process natural language command
  const processCommand = (text) => {
    // Check for move command
    if (commands.move.test(text)) {
      const match = text.match(commands.move);
      if (match && match[5]) {
        const requestedPosition = match[5].trim().toLowerCase();
        return handleMoveCommand(requestedPosition);
      }
    }
    
    // Check for resize command
    if (commands.resize.test(text)) {
      const match = text.match(commands.resize);
      if (match && match[5]) {
        const sizeAction = match[5].trim().toLowerCase();
        return handleResizeCommand(sizeAction);
      }
    }
    
    // Check for save layout command
    if (commands.saveLayout.test(text)) {
      const match = text.match(commands.saveLayout);
      if (match && match[4]) {
        const layoutName = match[4].trim();
        return handleSaveLayoutCommand(layoutName);
      }
    }
    
    // Check for switch layout command
    if (commands.switchLayout.test(text)) {
      const match = text.match(commands.switchLayout);
      if (match && match[4]) {
        const layoutName = match[4].trim();
        return handleSwitchLayoutCommand(layoutName);
      }
    }
    
    return "I didn't understand that command.";
  };
  
  // Handle move command
  const handleMoveCommand = (requestedPosition) => {
    // Get mapping from natural language to grid position
    const mappedPosition = positionMap[requestedPosition];
    if (mappedPosition) {
      dispatch({
        type: actionTypes.MOVE_CARD,
        payload: {
          cardId: state.activeCard,
          position: mappedPosition
        }
      });
      return `Card moved to ${requestedPosition}`;
    }
    
    // Look for exact position by name or ID
    const layout = state.layouts[state.activeLayout];
    const position = layout.grid.positions.find(pos => 
      pos.name.toLowerCase() === requestedPosition ||
      pos.id.toLowerCase() === requestedPosition
    );
    
    if (position) {
      dispatch({
        type: actionTypes.MOVE_CARD,
        payload: {
          cardId: state.activeCard,
          position: { row: position.row, col: position.col }
        }
      });
      return `Card moved to ${position.name}`;
    }
    
    return `I couldn't find position "${requestedPosition}"`;
  };
  
  // Handle resize command
  const handleResizeCommand = (sizeAction) => {
    const growActions = ['larger', 'bigger', 'wider', 'taller'];
    const shrinkActions = ['smaller', 'narrower'];
    
    let resizeAction;
    if (growActions.includes(sizeAction)) {
      resizeAction = 'grow';
    } else if (shrinkActions.includes(sizeAction)) {
      resizeAction = 'shrink';
    } else {
      return `I don't understand the resize action "${sizeAction}"`;
    }
    
    dispatch({
      type: actionTypes.RESIZE_CARD,
      payload: {
        cardId: state.activeCard,
        action: resizeAction
      }
    });
    
    return `Card ${resizeAction === 'grow' ? 'enlarged' : 'reduced'} as requested`;
  };
  
  // Handle save layout command
  const handleSaveLayoutCommand = (layoutName) => {
    // Create a custom layout based on current state
    const currentLayout = state.layouts[state.activeLayout];
    const newLayout = {
      name: layoutName,
      grid: { ...currentLayout.grid },
      positions: [...currentLayout.grid.positions]
    };
    
    dispatch({
      type: actionTypes.SAVE_LAYOUT,
      payload: newLayout
    });
    
    // Also save to localStorage
    const savedLayouts = JSON.parse(localStorage.getItem('gridLayouts') || '[]');
    localStorage.setItem('gridLayouts', JSON.stringify([...savedLayouts, newLayout]));
    
    return `Layout saved as "${layoutName}"`;
  };
  
  // Handle switch layout command
  const handleSwitchLayoutCommand = (layoutName) => {
    // Look for layout in built-in layouts
    if (state.layouts[layoutName.toLowerCase()]) {
      dispatch({
        type: actionTypes.SET_ACTIVE_LAYOUT,
        payload: layoutName.toLowerCase()
      });
      return `Switched to ${layoutName} layout`;
    }
    
    // Look for layout in custom layouts
    const customLayout = state.customLayouts.find(
      layout => layout.name.toLowerCase() === layoutName.toLowerCase()
    );
    
    if (customLayout) {
      // Logic to apply custom layout
      return `Switched to "${customLayout.name}" layout`;
    }
    
    return `Could not find layout "${layoutName}"`;
  };
  
  // Generate context for AI about current layout
  const generateLayoutContext = () => {
    const layout = state.layouts[state.activeLayout];
    return `
      Current grid layout "${layout.name}":
      ${layout.grid.cols}x${layout.grid.rows} grid with positions:
      ${layout.grid.positions.map(pos => `"${pos.name}" at row ${pos.row}, column ${pos.col}`).join('\n')}
    `;
  };
  
  // Map a card to a grid position
  const moveCardToPosition = (cardId, position) => {
    dispatch({
      type: actionTypes.MOVE_CARD,
      payload: { cardId, position }
    });
  };
  
  // Expose context value
  const contextValue = {
    layouts: state.layouts,
    activeLayout: state.activeLayout,
    activeCard: state.activeCard,
    customLayouts: state.customLayouts,
    viewport: state.viewport,
    setActiveLayout: (layout) => dispatch({ type: actionTypes.SET_ACTIVE_LAYOUT, payload: layout }),
    setActiveCard: (cardId) => dispatch({ type: actionTypes.SET_ACTIVE_CARD, payload: cardId }),
    moveCardToPosition,
    processCommand,
    generateLayoutContext
  };
  
  return (
    <GridLayoutContext.Provider value={contextValue}>
      {children}
    </GridLayoutContext.Provider>
  );
};

// Custom hook for using grid layout context
export const useGridLayoutContext = () => {
  const context = useContext(GridLayoutContext);
  if (!context) {
    throw new Error('useGridLayoutContext must be used within a GridLayoutProvider');
  }
  return context;
};
```

## 2. ChatSidebar.jsx

Implement the natural language command interface that allows users to enter commands:

```javascript
import React, { useState, useRef, useEffect } from 'react';
import { useGridLayoutContext } from '../context/GridLayoutContext';
import HelpTooltip from './HelpTooltip';

const ChatSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'system', 
      text: 'Welcome to the News Grid! How would you like to arrange your news cards today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  
  // Get grid context
  const { processCommand, setActiveCard } = useGridLayoutContext();
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (inputText.trim() === '') return;
    
    // Set active card to the "latest" by default for commands
    // In a real implementation, you would track the most recent card
    setActiveCard('latest-card-id');
    
    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    // Process the command and add system response
    setTimeout(() => {
      const responseText = processCommand(inputText);
      
      const newSystemMessage = {
        id: messages.length + 2,
        sender: 'system',
        text: responseText,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newSystemMessage]);
    }, 500);
    
    setInputText('');
  };
  
  return (
    <div className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button 
        className={`chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="toggle-icon">💬</span>
      </button>
      
      <div className="chat-content">
        <div className="chat-header">
          <h3>News Grid Assistant</h3>
          <button 
            className="help-button"
            onClick={() => setShowHelp(!showHelp)}
            aria-label="Help"
          >
            ?
          </button>
        </div>
        
        {showHelp && (
          <HelpTooltip 
            title="Grid Command Help"
            content={`
              You can control the grid with these commands:
              • Move card: "Move this card to the top right"
              • Resize card: "Make this card larger"
              • Save layout: "Save this layout as Morning News"
              • Switch layout: "Switch to the Sports layout"
              
              You can also use natural descriptions like "next to the weather" or "below the headlines".
            `}
            onClose={() => setShowHelp(false)}
          />
        )}
        
        <div className="messages-container">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text}
              </div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your command here..."
            className="chat-input"
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSidebar;
```

## 3. HelpTooltip.jsx

Create a help tooltip component for displaying command documentation:

```javascript
import React from 'react';

const HelpTooltip = ({ title, content, onClose }) => {
  return (
    <div className="help-tooltip">
      <div className="help-tooltip-header">
        <h4>{title}</h4>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="help-tooltip-content">
        <p className="help-text">{content}</p>
      </div>
    </div>
  );
};

export default HelpTooltip;
```

## 4. GridLayoutManager.jsx

Enhance the existing GridLayoutManager component with drag-and-drop functionality and layout management:

```javascript
// Enhance the existing GridLayoutManager.jsx with these features

// Add drag-and-drop functionality
const handleDragStart = (event, cardId) => {
  event.dataTransfer.setData('cardId', cardId);
};

const handleDrop = (event, position) => {
  const cardId = event.dataTransfer.getData('cardId');
  moveCardToPosition(cardId, position);
};

const handleDragOver = (event) => {
  event.preventDefault();
};

// Add layout preview rendering
const renderLayoutPreview = (layout) => {
  return (
    <div 
      className="grid-preview" 
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.grid.rows}, 60px)`,
        gap: '4px'
      }}
    >
      {layout.grid.positions.map((position) => (
        <div
          key={position.id}
          className="grid-position"
          style={{
            gridRow: `${position.row} / span ${position.rowspan || 1}`,
            gridColumn: `${position.col} / span ${position.colspan || 1}`,
            backgroundColor: activeLayout?.name === layout.name ? '#e3f2fd' : '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onDrop={(e) => handleDrop(e, position)}
          onDragOver={handleDragOver}
        >
          <span className="position-name">{position.name}</span>
          <div 
            className="drag-handle"
            draggable
            onDragStart={(e) => handleDragStart(e, position.id)}
            style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#bdbdbd',
              borderRadius: '2px',
              cursor: 'grab'
            }}
          ></div>
        </div>
      ))}
    </div>
  );
};
```

## 5. NewsGrid.jsx

Update or create the NewsGrid component that displays the actual grid with cards:

```javascript
import React from 'react';
import { useGridLayoutContext } from '../context/GridLayoutContext';

const NewsGrid = ({ cards }) => {
  const { layouts, activeLayout } = useGridLayoutContext();
  const currentLayout = layouts[activeLayout];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${currentLayout.grid.cols}, 1fr)`,
    gridTemplateRows: `repeat(${currentLayout.grid.rows}, auto)`,
    gap: '16px',
    padding: '16px'
  };
  
  // Map cards to positions
  const renderCards = () => {
    return cards.map(card => {
      // Find position for this card (in a real implementation, you would have a mapping)
      const position = currentLayout.grid.positions.find(pos => pos.id === card.positionId) || 
                      currentLayout.grid.positions[0]; // Default to first position
      
      return (
        <div
          key={card.id}
          className="news-card"
          style={{
            gridRow: `${position.row} / span ${position.rowspan || 1}`,
            gridColumn: `${position.col} / span ${position.colspan || 1}`,
            transition: 'all 0.3s ease'
          }}
        >
          {/* Card content */}
          <h3>{card.title}</h3>
          <p>{card.content}</p>
        </div>
      );
    });
  };
  
  return (
    <div className="news-grid" style={gridStyle}>
      {renderCards()}
    </div>
  );
};

export default NewsGrid;
```

## 6. CSS Styles for Chat Sidebar

Create a new CSS file: `/frontend/src/styles/chat-sidebar.css`

```css
.chat-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background-color: #ffffff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 1000;
}

.chat-sidebar.closed {
  transform: translateX(320px);
}

.chat-toggle {
  position: absolute;
  left: -50px;
  top: 20px;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #4299e1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s;
}

.chat-toggle:hover {
  background-color: #3182ce;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 15px;
  background-color: #4299e1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.help-button {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.messages-container {
  flex-grow: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 12px;
  position: relative;
  margin-bottom: 5px;
}

.message.user {
  background-color: #4299e1;
  color: white;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.message.system {
  background-color: #f7fafc;
  border: 1px solid #e2e8f0;
  color: #2d3748;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
}

.message-time {
  font-size: 10px;
  opacity: 0.8;
  text-align: right;
  margin-top: 4px;
}

.chat-input-form {
  display: flex;
  padding: 10px;
  border-top: 1px solid #e2e8f0;
}

.chat-input {
  flex-grow: 1;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  outline: none;
}

.chat-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 1px #4299e1;
}

.send-button {
  margin-left: 8px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #3182ce;
}

/* HelpTooltip styles */
.help-tooltip {
  position: absolute;
  top: 60px;
  right: 15px;
  width: 280px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1010;
}

.help-tooltip-header {
  padding: 12px;
  background-color: #f7fafc;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.help-tooltip-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #718096;
}

.help-tooltip-content {
  padding: 12px;
}

.help-text {
  white-space: pre-line;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
```

## 7. CSS Transitions for Grid Layout

Add these CSS classes for smooth transitions between layouts:

```css
/* Add to your main CSS file */
.layout-transition .news-card {
  transition: all 0.3s ease-in-out;
}

@keyframes card-transition {
  0% { 
    opacity: 0.8; 
    transform: scale(0.95);
  }
  100% { 
    opacity: 1; 
    transform: scale(1);
  }
}

.card-transition {
  animation: card-transition 0.3s ease-out forwards;
}
```

### Integration Instructions

1. Create the files in the appropriate directories
2. Update App.jsx to include the GridLayoutProvider:

```jsx
import { GridLayoutProvider } from './context/GridLayoutContext';

function App() {
  return (
    <GridLayoutProvider>
      <div className="app">
        <header>
          {/* Header content */}
        </header>
        <main>
          <NewsGrid cards={newsCards} />
          <ChatSidebar />
        </main>
      </div>
    </GridLayoutProvider>
  );
}
```

3. Import CSS files in the appropriate components

4. Test the implementation with these user flows:
   - Change viewport size and observe responsive layout changes
   - Enter natural language commands in the chat sidebar
   - Use the visual layout manager to create custom layouts
   - Test layout persistence by refreshing the page

### Testing

Verify the implementation against the following test cases:

1. Command parsing correctly identifies move, resize, save, and switch commands
2. Grid layouts properly adapt to different viewport sizes
3. Cards correctly position based on natural language commands
4. Custom layouts save and restore properly
5. Transitions between layouts are smooth and maintain content relationships

### Performance Considerations

1. For handling many cards (50+), consider implementing virtualization
2. Debounce viewport change handling to prevent thrashing
3. Use memoization for expensive calculations in the render cycle
4. Use CSS Grid for layout rendering instead of JavaScript positioning
