import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Book, Target, Zap, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRACTAL_CURRICULUM } from '../../data/curriculum';
import { API_CONFIG } from '../../config/env';

interface SearchResult {
  id: string;
  title: string;
  tacticalConcept: string;
  moduleTitle?: string;
  score?: number;
}

interface APISearchResult {
  score: number;
  lesson: {
    id: string;
    title: string;
    tactical_concept: string;
  };
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const performSemanticSearch = useCallback(async (searchQuery: string) => {
    if (!API_CONFIG.curriculum || searchQuery.length < API_CONFIG.semantic.minQueryLength) return;
    
    setIsSearching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

      const response = await fetch(`${API_CONFIG.curriculum}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, topK: API_CONFIG.semantic.topK }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.results.map((r: APISearchResult) => ({
          id: r.lesson.id,
          title: r.lesson.title,
          tacticalConcept: r.lesson.tactical_concept,
          moduleTitle: `Semantic Match (${Math.round(r.score * 100)}%)`,
          score: r.score
        }));
        setSemanticResults(results);
      }
    } catch (error) {
      console.error('Semantic search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= API_CONFIG.semantic.minQueryLength) {
        performSemanticSearch(query);
      } else {
        setSemanticResults([]);
      }
    }, API_CONFIG.semantic.debounceMs);

    return () => clearTimeout(timer);
  }, [query, performSemanticSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const localResults = query.length > 2 
    ? FRACTAL_CURRICULUM.flatMap(m => m.lessons.map(l => ({ ...l, moduleTitle: m.title })))
        .filter(l => 
          l.title.toLowerCase().includes(query.toLowerCase()) || 
          l.tacticalConcept.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
    : [];

  // Combine results, prioritizing local keyword matches then semantic matches
  const combinedResults: SearchResult[] = [...localResults];
  semanticResults.forEach(sr => {
    if (!combinedResults.some(lr => lr.id === sr.id)) {
      combinedResults.push(sr);
    }
  });

  const finalResults = combinedResults.slice(0, 6);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-oxford-blue/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
        <div className="p-4 border-b border-slate/10 flex items-center space-x-4">
          {isSearching ? (
            <Loader2 className="text-oxford-blue animate-spin" size={24} />
          ) : (
            <Search className="text-cadet-grey" size={24} />
          )}
          <input 
            autoFocus
            type="text" 
            placeholder="Search for units, terms, or case studies..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-oxford-blue placeholder:text-cadet-grey"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 hover:bg-eggshell rounded-full transition-colors">
            <X size={20} className="text-cadet-grey" />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {finalResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-cadet-grey uppercase tracking-[2px] mb-2 px-2 flex justify-between">
                <span>Unit Results</span>
                {API_CONFIG.curriculum && <span className="text-oxford-blue/40 flex items-center gap-1"><Zap size={10} /> Semantic Search Active</span>}
              </h3>
              {finalResults.map((result) => (
                <div 
                  key={result.id}
                  onClick={() => {
                    navigate(`/unit/${result.id}`);
                    onClose();
                  }}
                  className="p-4 hover:bg-eggshell rounded-sm cursor-pointer border border-transparent hover:border-slate/10 transition-all flex items-center space-x-4 group"
                >
                  <div className="w-10 h-10 bg-oxford-blue/5 rounded-sm flex items-center justify-center text-oxford-blue group-hover:bg-oxford-blue group-hover:text-white transition-colors">
                    <Target size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-oxford-blue">{result.title}</div>
                    <div className="text-xs text-cadet-grey">{result.moduleTitle} • {result.tacticalConcept}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length > 2 ? (
            <div className="text-center py-12 text-slate">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="py-8 px-4">
              <h3 className="text-[10px] font-bold text-cadet-grey uppercase tracking-[2px] mb-6">Suggested Topics</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Hybrid Warfare', 'Wagner Group', 'Cyber APT', 'Sanctions Evasion'].map(topic => (
                  <div key={topic} className="flex items-center space-x-3 p-3 bg-eggshell rounded-sm text-sm text-oxford-blue/70 hover:text-oxford-blue cursor-pointer transition-colors">
                    <Book size={16} />
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-eggshell border-t border-slate/10 flex items-center justify-between text-[10px] font-bold text-cadet-grey tracking-widest uppercase">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate/20 rounded shadow-sm text-oxford-blue">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate/20 rounded shadow-sm text-oxford-blue">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate/20 rounded shadow-sm text-oxford-blue">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
