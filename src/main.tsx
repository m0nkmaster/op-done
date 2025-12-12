import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { DrumCreator } from './pages/DrumCreator';
import { SampleAnalyzer } from './pages/SampleAnalyzer';
import { SoundCreation } from './pages/SoundCreation';
import { SynthesizerUI } from './pages/SynthesizerUI';
import { USBBrowser } from './pages/USBBrowser';
import SynthPrototypeA from './pages/SynthPrototypeA';
import SynthPrototypeB from './pages/SynthPrototypeB';
import SynthPrototypeC from './pages/SynthPrototypeC';
import SynthPrototypeD from './pages/SynthPrototypeD';
import SynthPrototypeE from './pages/SynthPrototypeE';
import SynthPrototypeF from './pages/SynthPrototypeF';
import VisualNodeSynth from './pages/VisualNodeSynth';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/drum-creator" replace />} />
          <Route path="drum-creator" element={<DrumCreator />} />
          <Route path="sample-analyzer" element={<SampleAnalyzer />} />
          <Route path="sound-creation" element={<SoundCreation />} />
          <Route path="synthesizer" element={<ErrorBoundary><SynthesizerUI /></ErrorBoundary>} />
          <Route path="usb-browser" element={<USBBrowser />} />
          <Route path="synth-prototype-a" element={<ErrorBoundary><SynthPrototypeA /></ErrorBoundary>} />
          <Route path="synth-prototype-b" element={<ErrorBoundary><SynthPrototypeB /></ErrorBoundary>} />
          <Route path="synth-prototype-c" element={<ErrorBoundary><SynthPrototypeC /></ErrorBoundary>} />
          <Route path="synth-prototype-d" element={<ErrorBoundary><SynthPrototypeD /></ErrorBoundary>} />
          <Route path="synth-prototype-e" element={<ErrorBoundary><SynthPrototypeE /></ErrorBoundary>} />
          <Route path="synth-prototype-f" element={<ErrorBoundary><SynthPrototypeF /></ErrorBoundary>} />
          <Route path="visual-node-synth" element={<ErrorBoundary><VisualNodeSynth /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
