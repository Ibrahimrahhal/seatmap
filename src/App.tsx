import React, { useState } from 'react';
import SeatingEditor from './components/SeatingEditor';
import type { SeatingLayout } from './components/SeatingEditor';
import './App.css';

function App() {
  const [currentLayout, setCurrentLayout] = useState<SeatingLayout | undefined>(undefined);

  const handleLayoutChange = (layout: SeatingLayout) => {
    setCurrentLayout(layout);
    console.log('Layout updated:', layout);
  };

  return (
    <div className="App">
      <SeatingEditor 
        onLayoutChange={handleLayoutChange}
        initialLayout={currentLayout}
      />
    </div>
  );
}

export default App;
