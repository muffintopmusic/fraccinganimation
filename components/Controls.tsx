
import React, { useState } from 'react';
import { FractalParams } from '../types';

interface ControlsProps {
  params: FractalParams;
  onUpdate: (key: keyof FractalParams, value: any) => void;
  onClose: () => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  format?: (val: number) => string;
}> = ({ label, value, min, max, step, onChange, format }) => (
  <div className="flex flex-col gap-0.5 mb-2">
    <div className="flex justify-between items-center text-[10px] text-white/50 font-medium">
      <span>{label}</span>
      <span className="font-mono">{format ? format(value) : value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
    />
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0 pb-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
      >
        <span>{title}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="pt-2 flex flex-col gap-1 px-1">{children}</div>}
    </div>
  );
};

const Controls: React.FC<ControlsProps> = ({ params, onUpdate, onClose }) => {
  return (
    <div className="pointer-events-auto bg-black/85 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 w-72 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <section className="pb-3 border-b border-white/5">
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={() => onUpdate('isJulia', !params.isJulia)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border ${
                params.isJulia 
                  ? 'bg-blue-500/20 border-blue-400 text-blue-400' 
                  : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
              }`}
            >
              {params.isJulia ? 'JULIA' : 'MANDELBROT'}
            </button>
            <button
              onClick={() => onUpdate('grayscale', !params.grayscale)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border ${
                params.grayscale 
                  ? 'bg-white/30 border-white text-black' 
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              {params.grayscale ? 'GRAYSCALE' : 'COLORS'}
            </button>
            {!params.isJulia && (
              <button
                onClick={() => onUpdate('mirrorHorizontal', !params.mirrorHorizontal)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border ${
                  params.mirrorHorizontal 
                    ? 'bg-purple-500/20 border-purple-400 text-purple-400' 
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}
              >
                H-MIRROR {params.mirrorHorizontal ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </section>

        <Section title="Orientation & Lens">
          <Slider 
            label="Roll (Z-Spin)" 
            value={params.roll} 
            min={0} max={360} step={1} 
            onChange={(v) => onUpdate('roll', v)} 
            format={(v) => `${v.toFixed(0)}°`}
          />
          <Slider 
            label="Yaw (Tilt)" 
            value={params.yaw} 
            min={-45} max={45} step={1} 
            onChange={(v) => onUpdate('yaw', v)} 
            format={(v) => `${v.toFixed(0)}°`}
          />
          <Slider 
            label="Warp" 
            value={params.warp} 
            min={-1} max={1} step={0.01} 
            onChange={(v) => onUpdate('warp', v)} 
          />
          <Slider 
            label="Zoom" 
            value={params.zoom} 
            min={0.1} max={50} step={0.1} 
            onChange={(v) => onUpdate('zoom', v)} 
            format={(v) => `x${v.toFixed(1)}`}
          />
        </Section>

        <Section title="Folding & Depth">
          <Slider 
            label="Speed" 
            value={params.foldSpeed} 
            min={0} max={5} step={0.1} 
            onChange={(v) => onUpdate('foldSpeed', v)} 
          />
          <Slider 
            label="Recursion" 
            value={params.foldSplits} 
            min={0} max={8} step={0.01} 
            onChange={(v) => onUpdate('foldSplits', v)} 
            format={(v) => v.toFixed(2)}
          />
          <Slider 
            label="Split Depth" 
            value={params.animDepth} 
            min={0} max={2} step={0.05} 
            onChange={(v) => onUpdate('animDepth', v)} 
          />
        </Section>

        <Section title="C Animation">
          <div className="flex items-center justify-between mb-2">
             <span className="text-[9px] font-bold uppercase text-white/20">Auto Cycle</span>
             <button
              onClick={() => onUpdate('animateC', !params.animateC)}
              className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors ${
                params.animateC ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-white/20 text-white/30'
              }`}
            >
              {params.animateC ? 'ON' : 'OFF'}
            </button>
          </div>
          <Slider 
            label="Real Offset" 
            value={params.cReal} 
            min={-2} max={2} step={0.001} 
            onChange={(v) => onUpdate('cReal', v)} 
          />
          <Slider 
            label="Imag Offset" 
            value={params.cImag} 
            min={-2} max={2} step={0.001} 
            onChange={(v) => onUpdate('cImag', v)} 
          />
          {params.animateC && (
            <>
              <Slider 
                label="Cycle Rate" 
                value={params.animationSpeed} 
                min={0} max={3} step={0.1} 
                onChange={(v) => onUpdate('animationSpeed', v)} 
              />
              <Slider 
                label="Swing Depth" 
                value={params.animMag} 
                min={0} max={2} step={0.05} 
                onChange={(v) => onUpdate('animMag', v)} 
              />
            </>
          )}
        </Section>

        <Section title="Visual Output">
          <div className="flex items-center justify-between mb-2 px-0.5">
            <span className="text-[10px] font-medium text-white/50">Antialiasing (2x2)</span>
            <button
              onClick={() => onUpdate('antialiasing', !params.antialiasing)}
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                params.antialiasing 
                  ? 'bg-blue-500/30 border-blue-400 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              {params.antialiasing ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
          <Slider 
            label="Fidelity" 
            value={params.iterations} 
            min={16} max={256} step={8} 
            onChange={(v) => onUpdate('iterations', Math.round(v))} 
            format={(v) => Math.round(v).toString()}
          />
          {!params.grayscale && (
            <Slider 
              label="Color Bias" 
              value={params.colorShift} 
              min={0} max={1} step={0.01} 
              onChange={(v) => onUpdate('colorShift', v)} 
            />
          )}
          <Slider 
            label="Exposure" 
            value={params.exposure} 
            min={0.1} max={5} step={0.1} 
            onChange={(v) => onUpdate('exposure', v)} 
          />
        </Section>

        <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-xl uppercase tracking-widest"
          >
            Collapse
          </button>
          <button 
            onClick={() => {
              onUpdate('zoom', 1.0);
              onUpdate('offsetX', 0);
              onUpdate('offsetY', 0);
              onUpdate('cReal', -0.75);
              onUpdate('cImag', 0.1);
              onUpdate('animationSpeed', 0.8);
              onUpdate('animMag', 1.0);
              onUpdate('foldSpeed', 1.2);
              onUpdate('foldSplits', 2);
              onUpdate('animDepth', 0.6);
              onUpdate('yaw', 0);
              onUpdate('roll', 0);
              onUpdate('warp', 0);
              onUpdate('mirrorHorizontal', false);
              onUpdate('grayscale', false);
              onUpdate('antialiasing', false);
            }}
            className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-bold transition-all text-white/20 rounded-lg uppercase"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
