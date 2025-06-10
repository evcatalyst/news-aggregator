import { useState } from 'react';

const RebuildButton = () => {
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);

  const handleRebuild = async () => {
    if (isRebuilding) return;
    
    try {
      setIsRebuilding(true);
      setOutput('Starting rebuild process...\n');
      setShowOutput(true);
      
      const response = await fetch('http://localhost:3000/rebuild', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Rebuild failed with status: ${response.status}`);
      }
      
      setOutput(prev => prev + 'Rebuild completed successfully. Services are restarting...\n');
      
      // Poll the health endpoint until it responds
      let attempts = 0;
      const maxAttempts = 20;
      const checkHealth = async () => {
        try {
          const healthCheck = await fetch('http://localhost:3000/health');
          if (healthCheck.ok) {
            setOutput(prev => prev + 'Services are back online!\n');
            setTimeout(() => {
              window.location.reload();
            }, 3000);
            return;
          }
        } catch (error) {
          // Ignore errors during polling
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setOutput(prev => prev + `Waiting for services to restart (${attempts}/${maxAttempts})...\n`);
          setTimeout(checkHealth, 1500);
        } else {
          setOutput(prev => prev + 'Timed out waiting for services. You may need to reload manually.\n');
          setIsRebuilding(false);
        }
      };
      
      setTimeout(checkHealth, 2000);
      
    } catch (error) {
      setOutput(prev => prev + `Error: ${error.message}\n`);
      setIsRebuilding(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleRebuild}
        disabled={isRebuilding}
        className={`py-1 px-3 rounded-md text-xs ${
          isRebuilding 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
        } transition-colors`}
      >
        {isRebuilding ? 'Rebuilding...' : 'Rebuild App'}
      </button>
      
      {showOutput && (
        <div className="absolute top-8 right-0 z-50 w-80 bg-gray-900 border border-gray-700 rounded-md shadow-xl">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <h3 className="text-xs font-semibold text-gray-300">Rebuild Output</h3>
            <button 
              onClick={() => setShowOutput(false)}
              className="text-gray-400 hover:text-gray-200"
            >
              ×
            </button>
          </div>
          <pre className="p-2 text-gray-300 text-xs overflow-auto max-h-60 font-mono">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RebuildButton;
