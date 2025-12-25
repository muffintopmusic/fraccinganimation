import React, { useState, useCallback, useRef } from 'react';
import { FractalParams } from './types';
import FractalCanvas from './components/FractalCanvas';
import Controls from './components/Controls';

const App: React.FC = () => {
  const [params, setParams] = useState<FractalParams>({
    cReal: -0.75,
    cImag: 0.1,
    zoom: 1.0,
    offsetX: 0,
    offsetY: 0,
    iterations: 64,
    isJulia: false,
    colorShift: 0.4,
    animateC: true,
    animationSpeed: 0.8,
    animMag: 1.0,
    exposure: 2.0,
    foldSpeed: 1.2,
    foldSplits: 2,
    animDepth: 0.6,
    yaw: 0,
    roll: 0,
    warp: 0,
    mirrorHorizontal: false,
    grayscale: false,
    antialiasing: false,
  });

  const [showControls, setShowControls] = useState(true);

  const updateParam = useCallback((key: keyof FractalParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleNavUpdate = useCallback((updates: Partial<FractalParams>) => {
    setParams(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none touch-none">
      <FractalCanvas params={params} onNavUpdate={handleNavUpdate} />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6">
        <header className="flex justify-end items-start h-8">
          {/* Header area kept for layout balance, FPS removed */}
        </header>

        <main className="flex justify-end items-center flex-1 pointer-events-none overflow-hidden py-4">
           {showControls ? (
             <Controls 
               params={params} 
               onUpdate={updateParam} 
               onClose={() => setShowControls(false)} 
             />
           ) : (
             <button
               onClick={() => setShowControls(true)}
               className="pointer-events-auto bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/20 hover:text-white/60 p-2.5 rounded-full transition-all active:scale-90 border border-white/5"
               title="Show Settings"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                 <circle cx="12" cy="12" r="3"/>
               </svg>
             </button>
           )}
        </main>

        <footer className="flex justify-between items-end pointer-events-none h-8">
        </footer>
      </div>
    </div>
  );
};

export default App;