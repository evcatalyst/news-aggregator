import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/table.css';

// Initialize the AppState in window if it doesn't already exist
// This ensures compatibility between React and vanilla JS parts
if (!window.AppState) {
  window.AppState = {
    isLoading: false,
    hasError: false,
    errorMessage: '',
    searchResults: [],
    chatHistory: [],
    currentUser: null,
    debug: (window.localStorage.getItem('debug') === 'true') || true
  };
}

// Make sure the updateUIState function exists for vanilla JS integration
if (typeof window.updateUIState !== 'function') {
  window.updateUIState = () => {
    // Find the vanilla JS news container and update it if it exists
    const newsDiv = document.getElementById('news');
    if (newsDiv) {
      // Trigger any listeners in the vanilla JS code
      const updateEvent = new CustomEvent('app:stateUpdated', { 
        detail: { searchResults: window.AppState.searchResults } 
      });
      window.dispatchEvent(updateEvent);
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
