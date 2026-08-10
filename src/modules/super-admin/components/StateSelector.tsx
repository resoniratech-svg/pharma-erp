import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface StateSelectorProps {
  value: string; // Comma separated string of states
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ value, onChange, disabled = false }) => {
  const [availableStates, setAvailableStates] = useState<string[]>(() => {
    const saved = localStorage.getItem('pharma_states_master');
    if (saved) return JSON.parse(saved);
    return ['Maharashtra', 'Gujarat', 'Karnataka', 'Delhi', 'Tamil Nadu'];
  });

  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const selectedStates = value ? value.split(', ').filter(s => s.trim()) : [];

  const filteredStates = availableStates.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()));
  const isSearchStateNew = stateSearch.trim() !== '' && !availableStates.some(s => s.toLowerCase() === stateSearch.trim().toLowerCase());

  const handleStateSelect = (stateName: string) => {
    if (disabled) return;
    let newSelection;
    if (selectedStates.includes(stateName)) {
      newSelection = selectedStates.filter(s => s !== stateName);
    } else {
      newSelection = [...selectedStates, stateName];
    }
    onChange(newSelection.join(', '));
  };

  const handleCreateState = () => {
    if (disabled) return;
    const newState = stateSearch.trim();
    if (!newState) return;
    
    // Check if duplicate ignores case
    const existingIndex = availableStates.findIndex(s => s.toLowerCase() === newState.toLowerCase());
    
    let actualState = newState;
    if (existingIndex === -1) {
      // Add to master list permanently
      const newAvailable = [...availableStates, newState];
      setAvailableStates(newAvailable);
      localStorage.setItem('pharma_states_master', JSON.stringify(newAvailable));
    } else {
      // If it exists but just cases differ, use the existing one and select it
      actualState = availableStates[existingIndex];
    }

    if (!selectedStates.includes(actualState)) {
      onChange([...selectedStates, actualState].join(', '));
    }
    
    setStateSearch('');
  };

  return (
    <div className="relative">
      <div 
        className={`w-full min-h-[46px] px-3 py-2 border border-slate-300 rounded-lg ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white cursor-text focus-within:ring-2 focus-within:ring-[#163c78] focus-within:border-[#163c78]'} flex flex-wrap gap-2 items-center`}
        onClick={() => !disabled && setIsStateDropdownOpen(true)}
      >
        {selectedStates.map(state => (
          <span key={state} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            {state}
            {!disabled && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); handleStateSelect(state); }} 
                className="hover:text-rose-500 hover:bg-slate-200 rounded-full p-0.5 ml-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
            placeholder={selectedStates.length === 0 ? "Search or add states..." : ""}
            value={stateSearch}
            onChange={e => {
              setStateSearch(e.target.value);
              setIsStateDropdownOpen(true);
            }}
            onFocus={() => setIsStateDropdownOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (isSearchStateNew) {
                  handleCreateState();
                } else if (filteredStates.length > 0) {
                  handleStateSelect(filteredStates[0]);
                  setStateSearch('');
                }
              }
            }}
          />
        )}
      </div>
      
      {isStateDropdownOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsStateDropdownOpen(false)}></div>
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
            {isSearchStateNew && (
              <div 
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 flex items-center text-sm font-medium text-[#163c78]"
                onClick={() => handleCreateState()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create "{stateSearch.trim()}"
              </div>
            )}
            {filteredStates.map(state => (
              <div 
                key={state} 
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center text-sm text-slate-700"
                onClick={() => handleStateSelect(state)}
              >
                <input 
                  type="checkbox" 
                  className="mr-3 rounded border-slate-300 text-[#163c78] focus:ring-[#163c78]"
                  checked={selectedStates.includes(state)}
                  onChange={() => {}} 
                  onClick={(e) => e.stopPropagation()} 
                />
                {state}
              </div>
            ))}
            {filteredStates.length === 0 && !isSearchStateNew && (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">No states found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
