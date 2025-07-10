# Seating Editor

A powerful React component for creating and editing interactive seating layouts with drag-and-drop functionality.

## Features

- 🎯 **Interactive Editor**: Drag-and-drop sections and seats
- 🎨 **Visual Design**: Color-coded sections with customizable colors
- 🔄 **Transform Controls**: Rotate, resize, and move sections
- 🪑 **Seat Management**: Add individual seats or fill sections with grid-based seats
- 📋 **Context Menus**: Right-click for quick actions on sections and seats
- 🔍 **Zoom & Pan**: Navigate large layouts with zoom controls and space-to-pan
- 📤 **Export**: Save layouts as JSON files
- 🏷️ **Labels**: Add stage labels and section names
- 🎛️ **Toolbar**: Easy access to all editing tools

## Installation

```bash
npm install seatmap-creator
```

## Basic Usage

```tsx
import React from 'react';
import { SeatingEditor } from './components/SeatingEditor';

function App() {
  const handleLayoutChange = (layout) => {
    console.log('Layout changed:', layout);
  };

  return (
    <SeatingEditor
      height="600px"
      width="800px"
      backgroundColor="#f5f5f5"
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `string \| number` | `'100vh'` | Height of the editor container |
| `width` | `string \| number` | `'100%'` | Width of the editor container |
| `backgroundColor` | `string` | `'transparent'` | Background color of the editor |
| `hideToolbar` | `boolean` | `false` | Hide the default toolbar |
| `onLayoutChange` | `function` | `undefined` | Callback when layout changes |
| `initialLayout` | `SeatingLayout` | `undefined` | Initial layout configuration |

## Advanced Usage

### Custom Initial Layout

```tsx
const initialLayout = {
  sections: [
    {
      id: 'section-1',
      name: 'VIP Section',
      color: '#ff6b6b',
      x: 50,
      y: 200,
      width: 200,
      height: 150,
      rotation: 0,
      seats: [],
      type: 'section'
    }
  ],
  scale: 1
};

<SeatingEditor
  initialLayout={initialLayout}
  onLayoutChange={(layout) => {
    // Save to database or local storage
    localStorage.setItem('seatingLayout', JSON.stringify(layout));
  }}
/>
```

### Responsive Container

```tsx
<div style={{ width: '100%', height: '100vh' }}>
  <SeatingEditor
    height="100%"
    width="100%"
    backgroundColor="#ffffff"
  />
</div>
```

### Custom Toolbar

```tsx
import React, { useRef } from 'react';
import { SeatingEditor, type SeatingEditorRef } from './components/SeatingEditor';

function App() {
  const editorRef = useRef<SeatingEditorRef>(null);

  return (
    <div>
      {/* Custom toolbar */}
      <div style={{ padding: '10px', background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => editorRef.current?.addSection()}>
          Add Section
        </button>
        <button onClick={() => editorRef.current?.addLabelSection()}>
          Add Label
        </button>
        <button onClick={() => editorRef.current?.setTool('add-seat')}>
          Add Seat Mode
        </button>
        <button onClick={() => editorRef.current?.setTool('select')}>
          Select Mode
        </button>
        <button onClick={() => editorRef.current?.zoomIn()}>
          Zoom In
        </button>
        <button onClick={() => editorRef.current?.zoomOut()}>
          Zoom Out
        </button>
        <button onClick={() => editorRef.current?.exportToJSON()}>
          Export
        </button>
      </div>

      {/* Editor without default toolbar */}
      <SeatingEditor
        ref={editorRef}
        hideToolbar={true}
        height="calc(100vh - 60px)"
        onLayoutChange={(layout) => console.log(layout)}
      />
    </div>
  );
}
```

## Controls

### Mouse Controls
- **Left Click**: Select sections/seats
- **Right Click**: Open context menu
- **Drag**: Move selected elements (when in select mode)
- **Space + Drag**: Pan the canvas

### Keyboard Controls
- **Space**: Hold to enable pan mode
- **Ctrl + Scroll**: Zoom in/out

### Toolbar Buttons
- **Select**: Default mode for selecting and moving elements
- **Add Seat**: Click on sections to add individual seats
- **Add Section**: Create new seating sections
- **Add Label Section**: Create stage labels
- **Zoom In/Out**: Adjust view scale
- **Export JSON**: Download layout as JSON file

## Ref Methods

When using a ref, you can access the following methods:

| Method | Description |
|--------|-------------|
| `addSection()` | Add a new seating section |
| `addLabelSection()` | Add a new label section |
| `setTool(tool)` | Set the current tool ('select', 'add-seat', 'add-section') |
| `zoomIn()` | Zoom in the view |
| `zoomOut()` | Zoom out the view |
| `exportToJSON()` | Export the layout as JSON file |
| `getLayout()` | Get the current layout |
| `setLayout(layout)` | Set a new layout |

## Context Menu Actions

### Section Context Menu
- **Duplicate**: Create a copy of the section
- **Edit Name**: Change section name
- **Fill with Seats**: Add grid-based seats to section
- **Change Color**: Customize section color
- **Delete**: Remove section and all its seats

### Seat Context Menu
- **Edit ID**: Change seat identifier
- **Delete**: Remove individual seat

## Data Structure

### Seat Interface
```typescript
interface Seat {
  id: string;           // Unique identifier
  x: number;            // X coordinate relative to section
  y: number;            // Y coordinate relative to section
  row: string;          // Row identifier (e.g., 'A', 'B')
  number: number;       // Seat number within row
  sectionId: string;    // Parent section ID
  seatSize: number;     // Radius of seat circle
}
```

### Section Interface
```typescript
interface Section {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  color: string;                 // Background color
  x: number;                     // X coordinate
  y: number;                     // Y coordinate
  width: number;                 // Width
  height: number;                // Height
  rotation: number;              // Rotation angle (degrees)
  seats: Seat[];                 // Array of seats
  type: 'section' | 'label';     // Section type
}
```

### Layout Interface
```typescript
interface SeatingLayout {
  sections: Section[];    // Array of sections
  scale: number;          // Current zoom scale
}
```

## Styling

The component uses inline styles for simplicity, but you can customize the appearance by:

1. **Container**: Use the `backgroundColor` prop
2. **Sections**: Change colors via context menu
3. **Seats**: White circles with black borders (hardcoded)
4. **Toolbar**: White background with shadow (hardcoded)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- React 16.8+ (for hooks)
- react-konva
- konva

## License

MIT 
