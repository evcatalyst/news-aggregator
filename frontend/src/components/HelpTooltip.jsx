import React, { useState } from 'react';

const HelpTooltip = () => {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    { type: 'Delete', examples: ['delete the new card', 'remove this card'] },
    { type: 'Minimize/Expand', examples: ['minimize this card', 'expand the latest card'] },
    { type: 'Resize', examples: ['make this card compact', 'resize card to expanded'] },
  ];

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        aria-label="Card Management Help"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-72 p-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Card Management Commands</h3>
          <div className="space-y-3">
            {commands.map(({ type, examples }) => (
              <div key={type} className="text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{type}:</span>
                <ul className="mt-1 space-y-1">
                  {examples.map((example) => (
                    <li key={example} className="text-gray-600 dark:text-gray-400 pl-3">
                      "{example}"
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Commands work on the most recently created card by default
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
