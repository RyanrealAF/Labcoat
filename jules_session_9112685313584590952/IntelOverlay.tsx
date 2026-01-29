import React, { useState } from 'react';
import { API_CONFIG } from '../../config/env';

interface DecodedIntel {
  tactical_overlay?: {
    phase: number;
    breadcrumb_id: string;
    orchestrator_intent: string;
    counter_move: string;
  };
  inner_game_signal: string;
}

interface IntelProps {
  topic: string;
  content: string;
}

const IntelOverlay: React.FC<IntelProps> = ({ topic }) => {
  const [intel, setIntel] = useState<DecodedIntel | null>(null);
  const [scanning, setScanning] = useState(false);

  const triggerDeepScan = async () => {
    setScanning(true);
    try {
      // API Call to the augmented Curriculum Worker
      const res = await fetch(`${API_CONFIG.curriculum}/api/decode?topic=${encodeURIComponent(topic)}`);
      const data = await res.json();
      setIntel(data);
    } catch (error) {
      console.error('Deep scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mt-8 border-t border-red-900/30 pt-4 font-mono">
      {!intel ? (
        <button
          onClick={triggerDeepScan}
          disabled={scanning}
          className="text-[10px] text-red-500 hover:text-red-400 border border-red-900 px-2 py-1 bg-red-900/10 uppercase tracking-tighter disabled:opacity-50"
        >
          {scanning ? 'Decoding Signal...' : '[ Initiate Tactical Decoding ]'}
        </button>
      ) : (
        <div className="bg-red-900/5 p-4 border-l-2 border-red-600 animate-in fade-in duration-500">
          <div className="flex justify-between items-start mb-2">
            <span className="text-red-600 font-bold text-xs uppercase">
              Phase {intel.tactical_overlay?.phase}: {intel.tactical_overlay?.breadcrumb_id}
            </span>
            <span className="text-[10px] bg-red-600 text-black px-1">UNSEEN_GAME_KERNEL_ACTIVE</span>
          </div>
          <div className="text-sm text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-red-800 uppercase font-bold">Orchestrator Intent</p>
              <p className="text-xs italic">"{intel.tactical_overlay?.orchestrator_intent}"</p>
            </div>
            <div>
              <p className="text-[10px] text-blue-800 uppercase font-bold">Counter-Move Protocol</p>
              <p className="text-xs">"{intel.tactical_overlay?.counter_move}"</p>
            </div>
          </div>
          <div className="mt-4 border-t border-red-900/20 pt-2">
            <p className="text-[10px] text-gray-500 uppercase">Inner Game Signal</p>
            <p className="text-xs text-red-400/80">{intel.inner_game_signal}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelOverlay;
