import { create } from 'zustand';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  module: string;
  message: string;
  data?: unknown;
}

interface LogState {
  entries: LogEntry[];
  levelFilter: string;
  searchText: string;
  maxEntries: number;

  addEntry: (entry: LogEntry) => void;
  setEntries: (entries: LogEntry[]) => void;
  setLevelFilter: (level: string) => void;
  setSearchText: (text: string) => void;
  clearEntries: () => void;
  
  getFilteredEntries: () => LogEntry[];
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],
  levelFilter: 'all',
  searchText: '',
  maxEntries: 1000,

  addEntry: (entry) => {
    const { entries, maxEntries } = get();
    const newEntries = [...entries, entry];
    if (newEntries.length > maxEntries) {
      set({ entries: newEntries.slice(-maxEntries) });
    } else {
      set({ entries: newEntries });
    }
  },

  setEntries: (entries) => set({ entries }),
  setLevelFilter: (level) => set({ levelFilter: level }),
  setSearchText: (text) => set({ searchText: text }),
  
  clearEntries: () => {
    set({ entries: [] });
    window.electron.clearLogs();
  },

  getFilteredEntries: () => {
    const { entries, levelFilter, searchText } = get();
    return entries.filter((entry) => {
      if (levelFilter !== 'all' && entry.level !== levelFilter) return false;
      if (searchText && !entry.message.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  },
}));
